import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  DeathRegistrationCase,
  DeathCorrectionRequest,
  DeathExceptionRecord,
  DeathReviewSectionKey,
  ReviewSectionStatus,
  DeathRejectionReason,
  emptyDeathReviewSections,
} from "@/domain/crvs/types";
import { assertTransitionDeathRegistration } from "@/domain/crvs/statusMachines";
import {
  isLateDeathReporting,
  daysAfterDeath,
  requiresSupervisorReviewForDeath,
  requiresDeathExceptionEscalation,
} from "@/domain/crvs/crvsPolicyConfig";
import { canApproveDeathCase } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { enqueueDeathSdidSync } from "./crvsDeathSdidSync";
import { demoLinkDeathNotificationToRegistration } from "./crvsDeathNotifications";

export type DeathRegistrationListParams = {
  search?: string;
  notificationReference?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  pathway?: string;
  facilityId?: string;
  jurisdiction?: string;
  assignedOfficerId?: string;
  isLate?: boolean;
  offset?: number;
  limit?: number;
};

export const demoListDeathRegistrations = async (params: DeathRegistrationListParams) => {
  const db = getDemoData();
  let results = db.crvsDeathRegistrations;

  if (params.status) results = results.filter((c) => c.status === params.status!.toUpperCase());
  if (params.pathway) results = results.filter((c) => c.pathway === params.pathway);
  if (params.facilityId) results = results.filter((c) => c.facilityId === params.facilityId);
  if (params.jurisdiction) results = results.filter((c) => c.jurisdiction === params.jurisdiction);
  if (params.isLate !== undefined) results = results.filter((c) => c.isLate === params.isLate);
  if (params.notificationReference)
    results = results.filter((c) => c.notificationReference === params.notificationReference);
  if (params.assignedOfficerId)
    results = results.filter((c) => c.officerId === params.assignedOfficerId || c.reviewerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((c) => c.dateOfDeath >= params.dateFrom!);
  if (params.dateTo) results = results.filter((c) => c.dateOfDeath <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.reference.toLowerCase().includes(term) ||
        `${c.deceased.firstName || ""} ${c.deceased.lastName || ""}`.toLowerCase().includes(term) ||
        (c.notificationReference || "").toLowerCase().includes(term) ||
        (c.officialDeathRecordNumber || "").toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetDeathRegistration = async (id: string): Promise<DeathRegistrationCase | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsDeathRegistrations.find((c) => c.id === id || c.reference === id));
};

const nextDeathRegistrationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsDeathRegistrations.length + 1;
  return `DR-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextDeathRecordNumber = (db: ReturnType<typeof getDemoData>) => {
  const registeredCount = db.crvsDeathRegistrations.filter((c) => c.officialDeathRecordNumber).length + 1;
  return `CRVS-DEATH-DEMO-${registeredCount.toString().padStart(4, "0")}`;
};

export type CreateDeathRegistrationInput = {
  pathway: DeathRegistrationCase["pathway"];
  notificationId?: string;
  notificationReference?: string;
  facilityId?: string;
  facilityName?: string;
  processingOfficeId: string;
  processingOfficeName: string;
  jurisdiction: string;
  dateOfDeath: string;
  dateReported: string;
  delayReason?: string;
  deceased: DeathRegistrationCase["deceased"];
  occurrence: DeathRegistrationCase["occurrence"];
  medicalCertification?: DeathRegistrationCase["medicalCertification"];
  declarant: DeathRegistrationCase["declarant"];
};

export const demoCreateDeathRegistrationDraft = (
  input: CreateDeathRegistrationInput,
  actorId: string,
  actorName: string
): DeathRegistrationCase =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const late = isLateDeathReporting(input.dateOfDeath, input.dateReported);
    const draft: DeathRegistrationCase = {
      id: nextId("DR"),
      reference: nextDeathRegistrationReference(db),
      status: "DRAFT",
      pathway: input.pathway,
      notificationId: input.notificationId,
      notificationReference: input.notificationReference,
      facilityId: input.facilityId,
      facilityName: input.facilityName,
      processingOfficeId: input.processingOfficeId,
      processingOfficeName: input.processingOfficeName,
      jurisdiction: input.jurisdiction,
      dateOfDeath: input.dateOfDeath,
      dateReported: input.dateReported,
      daysAfterDeath: daysAfterDeath(input.dateOfDeath, input.dateReported),
      isLate: late,
      requiresSupervisorReview: requiresSupervisorReviewForDeath(input.dateOfDeath, input.dateReported),
      delayReason: input.delayReason,
      deceased: input.deceased,
      occurrence: input.occurrence,
      medicalCertification: input.medicalCertification,
      declarant: input.declarant,
      nextOfKin: [],
      witnesses: [],
      evidence: [],
      reviewSections: emptyDeathReviewSections(),
      reviewDecisions: [],
      correctionRequests: [],
      officerId: actorId,
      officerName: actorName,
      declarationConfirmed: false,
      declarantConfirmed: false,
      privacyAcknowledged: false,
      createdAt: now,
      updatedAt: now,
      sdid: { status: "NOT_READY", attempts: [] },
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsDeathRegistrations.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.death_registration", draft.reference, `Created a ${input.pathway.toLowerCase()} death-registration draft.`);
    if (input.notificationId) demoLinkDeathNotificationToRegistration(input.notificationId, draft.id);
    return db;
  }).crvsDeathRegistrations[0];

export const demoUpdateDeathRegistrationDraft = (
  id: string,
  patch: Partial<DeathRegistrationCase>,
  actorName: string,
  expectedVersion?: number
): DeathRegistrationCase => {
  let updated: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (expectedVersion !== undefined && deathCase.version !== expectedVersion) {
      throw new ConcurrencyError("This death registration case");
    }
    Object.assign(deathCase, patch);
    if (patch.dateOfDeath || patch.dateReported) {
      deathCase.daysAfterDeath = daysAfterDeath(deathCase.dateOfDeath, deathCase.dateReported);
      deathCase.isLate = isLateDeathReporting(deathCase.dateOfDeath, deathCase.dateReported);
      deathCase.requiresSupervisorReview = requiresSupervisorReviewForDeath(deathCase.dateOfDeath, deathCase.dateReported);
    }
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    updated = deathCase;
    return db;
  });
  return updated!;
};

export const demoCancelDeathRegistrationDraft = (id: string, reason: string, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathRegistration(deathCase.status, "CANCELLED");
    const now = new Date().toISOString();
    deathCase.status = "CANCELLED";
    deathCase.cancelledAt = now;
    deathCase.cancellationReason = reason;
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.death_registration", deathCase.reference, reason);
    result = deathCase;
    return db;
  });
  return result!;
};

export const demoSubmitDeathRegistration = (id: string, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");

    if (deathCase.status === "DRAFT" && deathCase.duplicateCheck?.overallLevel === "EXACT") {
      throw new Error("An exact duplicate match blocks submission. Resolve the duplicate first.");
    }

    // Pathway-driven exception routing takes priority over ordinary lateness
    // routing — a medico-legal or unidentified-person case always bypasses
    // the routine queue regardless of how quickly it was reported.
    const escalatedStatus: DeathRegistrationCase["status"] | undefined =
      deathCase.pathway === "MEDICO_LEGAL"
        ? "MEDICO_LEGAL_REVIEW"
        : deathCase.pathway === "UNIDENTIFIED"
        ? "UNIDENTIFIED_PERSON_REVIEW"
        : deathCase.isLate || requiresDeathExceptionEscalation(deathCase.dateOfDeath, deathCase.dateReported)
        ? "LATE_REGISTRATION_REVIEW"
        : undefined;

    const now = new Date().toISOString();
    deathCase.submittedAt = deathCase.submittedAt || now;
    deathCase.updatedAt = now;
    deathCase.version += 1;

    if (deathCase.status === "CORRECTION_REQUIRED") {
      assertTransitionDeathRegistration(deathCase.status, "RESUBMITTED");
      deathCase.status = "RESUBMITTED";
      // Mark every still-open correction request resolved/addressed here
      // rather than requiring a second, separate call — this is the only
      // path that ever moves a case out of CORRECTION_REQUIRED, so there is
      // no legal follow-up transition left for a standalone
      // "resubmit corrections" call to perform after this.
      deathCase.correctionRequests
        .filter((c) => !c.resolvedAt)
        .forEach((c) => {
          c.resolvedAt = now;
          c.items.forEach((item) => (item.addressed = true));
        });
      deathCase.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    } else {
      assertTransitionDeathRegistration(deathCase.status, "SUBMITTED");
      deathCase.status = "SUBMITTED";
      deathCase.statusHistory.push({ status: "SUBMITTED", at: now, by: actorName });

      if (escalatedStatus) {
        assertTransitionDeathRegistration(deathCase.status, escalatedStatus);
        deathCase.status = escalatedStatus;
        deathCase.statusHistory.push({ status: escalatedStatus, at: now, by: "System" });
      }
    }

    logCrvsAudit(db, actorName, "submitted", "crvs.death_registration", deathCase.reference, `Submitted; now ${deathCase.status}.`);
    result = deathCase;
    return db;
  });
  return result!;
};

export const demoStartDeathReview = (id: string, actorId: string, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (deathCase.reviewerId && deathCase.reviewerId !== actorId) {
      throw new Error(`This case is already being reviewed by ${deathCase.reviewerName}.`);
    }
    assertTransitionDeathRegistration(deathCase.status, "UNDER_REVIEW");
    const now = new Date().toISOString();
    deathCase.status = "UNDER_REVIEW";
    deathCase.reviewerId = actorId;
    deathCase.reviewerName = actorName;
    deathCase.reviewLockedAt = now;
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "UNDER_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "started review", "crvs.death_review", deathCase.reference, "Started review — case locked to this registrar.");
    result = deathCase;
    return db;
  });
  return result!;
};

export const demoSetDeathReviewSectionStatus = (
  id: string,
  section: DeathReviewSectionKey,
  status: ReviewSectionStatus,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    deathCase.reviewSections[section] = status;
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "reviewed section", "crvs.death_review", deathCase.reference, `${section}: ${status}`);
    result = deathCase;
    return db;
  });
  return result!;
};

export const allMandatoryDeathSectionsReviewed = (deathCase: DeathRegistrationCase): boolean =>
  (Object.keys(deathCase.reviewSections) as DeathReviewSectionKey[]).every(
    (key) => deathCase.reviewSections[key] === "VERIFIED"
  );

export const demoRequestDeathCorrection = (
  id: string,
  correction: Omit<DeathCorrectionRequest, "id" | "requestedAt" | "responseToken">,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathRegistration(deathCase.status, "CORRECTION_REQUIRED");
    const now = new Date().toISOString();
    deathCase.status = "CORRECTION_REQUIRED";
    deathCase.correctionRequests.push({
      ...correction,
      id: nextId("DCR"),
      requestedAt: now,
      responseToken: `resp-tok-${deathCase.id.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "CORRECTION_REQUIRED", at: now, by: actorName, note: correction.items[0]?.reason });
    logCrvsAudit(db, actorName, "requested correction", "crvs.death_correction", deathCase.reference, correction.items.map((i) => i.reason).join("; "));
    result = deathCase;
    return db;
  });
  return result!;
};

export const demoResubmitDeathCorrections = (id: string, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathRegistration(deathCase.status, "RESUBMITTED");
    const now = new Date().toISOString();
    deathCase.status = "RESUBMITTED";
    const open = deathCase.correctionRequests.filter((c) => !c.resolvedAt);
    open.forEach((c) => {
      c.resolvedAt = now;
      c.items.forEach((item) => (item.addressed = true));
    });
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "resubmitted", "crvs.death_correction", deathCase.reference, "Resubmitted after addressing corrections.");
    result = deathCase;
    return db;
  });
  return result!;
};

/**
 * Approves and immediately registers a death case, exactly mirroring
 * demoApproveRegistration()'s combined approve+register step for birth.
 * `confirmedNoConflict` is the Civil Registrar's explicit "I did not
 * prepare this case" checkbox (spec §2) — required in addition to (not
 * instead of) the automatic canApproveDeathCase() gate.
 */
export const demoApproveDeathRegistration = (
  id: string,
  actorId: string,
  actorName: string,
  confirmedNoConflict: boolean
): DeathRegistrationCase => {
  if (!confirmedNoConflict) {
    throw new Error("You must confirm that you did not prepare this case before approving it.");
  }

  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");

    const { allowed, reasons } = canApproveDeathCase(actorId, deathCase);
    if (!allowed) throw new Error(`Cannot approve this case: ${reasons.join(" ")}`);

    assertTransitionDeathRegistration(deathCase.status, "APPROVED");
    const now = new Date().toISOString();
    deathCase.status = "APPROVED";
    deathCase.approvedAt = now;
    deathCase.approvedBy = actorId;
    deathCase.approvedByName = actorName;
    deathCase.reviewDecisions.push({ type: "APPROVE", decidedBy: actorName, decidedAt: now, confirmedNoConflict: true });
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "APPROVED", at: now, by: actorName });

    assertTransitionDeathRegistration(deathCase.status, "REGISTERED");
    deathCase.status = "REGISTERED";
    deathCase.registeredAt = now;
    deathCase.officialDeathRecordNumber = nextDeathRecordNumber(db);
    deathCase.registrationEvent = {
      id: nextId("DRE"),
      registrationReference: deathCase.reference,
      officialDeathRecordNumber: deathCase.officialDeathRecordNumber,
      registeredAt: now,
      registeredBy: actorId,
      registeredByName: actorName,
      processingOfficeId: deathCase.processingOfficeId,
      processingOfficeName: deathCase.processingOfficeName,
      deceasedSummary: {
        firstName: deathCase.deceased.firstName,
        lastName: deathCase.deceased.lastName,
        sex: deathCase.deceased.sex,
        dateOfDeath: deathCase.dateOfDeath,
      },
    };
    deathCase.statusHistory.push({ status: "REGISTERED", at: now, by: actorName });

    logCrvsAudit(
      db,
      actorName,
      "approved and registered",
      "crvs.death_registration",
      deathCase.reference,
      `Official death record ${deathCase.officialDeathRecordNumber} created.`
    );
    result = deathCase;
    return db;
  });

  // enqueueDeathSdidSync runs its own updateDemoData() cycle, so re-fetch
  // rather than returning the stale in-closure snapshot — same reasoning as
  // demoApproveRegistration's equivalent re-fetch for birth.
  enqueueDeathSdidSync(result!.id);
  return getDemoData().crvsDeathRegistrations.find((c) => c.id === result!.id)!;
};

export const demoRejectDeathRegistration = (
  id: string,
  reason: DeathRejectionReason,
  actorId: string,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathRegistration(deathCase.status, "REJECTED");
    const now = new Date().toISOString();
    deathCase.status = "REJECTED";
    deathCase.rejectedAt = now;
    deathCase.rejectedBy = actorId;
    deathCase.rejectionReason = reason;
    deathCase.reviewDecisions.push({ type: "REJECT", decidedBy: actorName, decidedAt: now, reason: reason.reason });
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "rejected", "crvs.death_registration", deathCase.reference, reason.reason);
    result = deathCase;
    return db;
  });
  return result!;
};

export const demoReassignDeathCase = (
  id: string,
  newAssigneeId: string,
  newAssigneeName: string,
  reason: string,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    deathCase.reviewerId = newAssigneeId;
    deathCase.reviewerName = newAssigneeName;
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "reassigned", "crvs.death_reassignment", deathCase.reference, `Reassigned to ${newAssigneeName}: ${reason}`);
    result = deathCase;
    return db;
  });
  return result!;
};

export type DeathExceptionRouteTarget = "LATE_REGISTRATION_REVIEW" | "MEDICO_LEGAL_REVIEW" | "UNIDENTIFIED_PERSON_REVIEW";

const EXCEPTION_TYPE_FOR_ROUTE: Record<DeathExceptionRouteTarget, DeathExceptionRecord["type"]> = {
  LATE_REGISTRATION_REVIEW: "LATE_FILING",
  MEDICO_LEGAL_REVIEW: "MEDICO_LEGAL",
  UNIDENTIFIED_PERSON_REVIEW: "UNIDENTIFIED_PERSON",
};

/** Routes an UNDER_REVIEW case into one of the three exception-review
 * branches (spec §6 review actions "route to late/medico-legal/unidentified
 * review"). */
export const demoRouteDeathCase = (
  id: string,
  target: DeathExceptionRouteTarget,
  reason: string,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathRegistration(deathCase.status, target);
    const now = new Date().toISOString();
    deathCase.status = target;
    deathCase.exception = { type: EXCEPTION_TYPE_FOR_ROUTE[target], reason, status: "OPEN" };
    deathCase.reviewDecisions.push({
      type: target === "LATE_REGISTRATION_REVIEW" ? "ROUTE_LATE" : target === "MEDICO_LEGAL_REVIEW" ? "ROUTE_MEDICO_LEGAL" : "ROUTE_UNIDENTIFIED",
      decidedBy: actorName,
      decidedAt: now,
      reason,
    });
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: target, at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "routed for exception review", "crvs.death_exception", deathCase.reference, `${target}: ${reason}`);
    result = deathCase;
    return db;
  });
  return result!;
};

export type DeathExceptionResolutionInput = {
  type: string;
  reason: string;
  note?: string;
  nextStatus: DeathRegistrationCase["status"];
};

/** Resolves any of the three exception-review branches back to UNDER_REVIEW,
 * CORRECTION_REQUIRED, or REJECTED. */
export const demoResolveDeathExceptionReview = (
  id: string,
  resolution: DeathExceptionResolutionInput,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    const now = new Date().toISOString();
    if (deathCase.exception) {
      deathCase.exception.status = "RESOLVED";
      deathCase.exception.resolution = { ...resolution, resolvedBy: actorName, resolvedAt: now };
    }
    assertTransitionDeathRegistration(deathCase.status, resolution.nextStatus);
    deathCase.status = resolution.nextStatus;
    deathCase.updatedAt = now;
    deathCase.version += 1;
    deathCase.statusHistory.push({ status: resolution.nextStatus, at: now, by: actorName, note: resolution.reason });
    logCrvsAudit(db, actorName, "resolved exception review", "crvs.death_exception", deathCase.reference, `${resolution.type}: ${resolution.reason}`);
    result = deathCase;
    return db;
  });
  return result!;
};

/** Records a newly identified person against a previously UNIDENTIFIED
 * deceased record (spec §4.5 "later identity-linking capability") without
 * touching the case's registration status. */
export const demoLinkIdentifiedPerson = (
  id: string,
  identity: Pick<DeathRegistrationCase["deceased"], "firstName" | "middleName" | "lastName" | "nin" | "sdidIdentityId" | "documentType" | "documentNumber">,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === id);
    if (!deathCase) throw new NotFoundError("Death registration case");
    deathCase.deceased = { ...deathCase.deceased, ...identity, identityStatus: "KNOWN", verification: "VERIFIED" };
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "linked identified person", "crvs.death_registration", deathCase.reference, `Identity linked: ${identity.firstName || ""} ${identity.lastName || ""}`.trim());
    result = deathCase;
    return db;
  });
  return result!;
};
