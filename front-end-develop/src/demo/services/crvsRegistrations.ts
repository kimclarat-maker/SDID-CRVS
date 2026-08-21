import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  BirthRegistrationCase,
  CorrectionRequest,
  ExceptionRecord,
  ReviewSectionKey,
  ReviewSectionStatus,
  RejectionReason,
  emptyReviewSections,
} from "@/domain/crvs/types";
import { assertTransitionRegistration } from "@/domain/crvs/statusMachines";
import { isLateRegistration, daysAfterBirth, requiresSupervisorReview, requiresExceptionEscalation } from "@/domain/crvs/lateRegistration";
import { canApproveCase } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { enqueueSdidSync } from "./crvsSdidSync";
import { demoLinkNotificationToRegistration } from "./crvsNotifications";

export type RegistrationListParams = {
  search?: string;
  notificationReference?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  facilityId?: string;
  jurisdiction?: string;
  assignedOfficerId?: string;
  sourceType?: string;
  isLate?: boolean;
  offset?: number;
  limit?: number;
};

export const demoListRegistrations = async (params: RegistrationListParams) => {
  const db = getDemoData();
  let results = db.crvsRegistrations;

  if (params.status) results = results.filter((c) => c.status === params.status!.toUpperCase());
  if (params.facilityId) results = results.filter((c) => c.facilityId === params.facilityId);
  if (params.jurisdiction) results = results.filter((c) => c.jurisdiction === params.jurisdiction);
  if (params.sourceType) results = results.filter((c) => c.sourceType === params.sourceType);
  if (params.isLate !== undefined) results = results.filter((c) => c.isLate === params.isLate);
  if (params.notificationReference)
    results = results.filter((c) => c.notificationReference === params.notificationReference);
  if (params.assignedOfficerId)
    results = results.filter((c) => c.officerId === params.assignedOfficerId || c.reviewerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((c) => c.dateOfBirth >= params.dateFrom!);
  if (params.dateTo) results = results.filter((c) => c.dateOfBirth <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.reference.toLowerCase().includes(term) ||
        `${c.child.firstName || ""} ${c.child.lastName}`.toLowerCase().includes(term) ||
        (c.notificationReference || "").toLowerCase().includes(term) ||
        (c.officialBirthRecordNumber || "").toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetRegistration = async (id: string): Promise<BirthRegistrationCase | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsRegistrations.find((c) => c.id === id || c.reference === id));
};

const nextRegistrationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsRegistrations.length + 1;
  return `BR-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextBirthRecordNumber = (db: ReturnType<typeof getDemoData>) => {
  const registeredCount = db.crvsRegistrations.filter((c) => c.officialBirthRecordNumber).length + 1;
  return `CRVS-BIRTH-DEMO-${registeredCount.toString().padStart(4, "0")}`;
};

export type CreateRegistrationInput = {
  sourceType: BirthRegistrationCase["sourceType"];
  notificationId?: string;
  notificationReference?: string;
  occurrenceType: BirthRegistrationCase["occurrenceType"];
  facilityId?: string;
  facilityName?: string;
  placeOfBirth: string;
  processingOfficeId: string;
  processingOfficeName: string;
  jurisdiction: string;
  dateOfBirth: string;
  dateReported: string;
  delayReason?: string;
  directRegistrationReason?: string;
  registrationCategory: string;
  child: BirthRegistrationCase["child"];
  mother: BirthRegistrationCase["mother"];
  father: BirthRegistrationCase["father"];
  declarant: BirthRegistrationCase["declarant"];
};

export const demoCreateRegistrationDraft = (
  input: CreateRegistrationInput,
  actorId: string,
  actorName: string
): BirthRegistrationCase =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const late = isLateRegistration(input.dateOfBirth, input.dateReported);
    const draft: BirthRegistrationCase = {
      id: nextId("BR"),
      reference: nextRegistrationReference(db),
      status: "DRAFT",
      sourceType: input.sourceType,
      notificationId: input.notificationId,
      notificationReference: input.notificationReference,
      occurrenceType: input.occurrenceType,
      facilityId: input.facilityId,
      facilityName: input.facilityName,
      placeOfBirth: input.placeOfBirth,
      processingOfficeId: input.processingOfficeId,
      processingOfficeName: input.processingOfficeName,
      jurisdiction: input.jurisdiction,
      dateOfBirth: input.dateOfBirth,
      dateReported: input.dateReported,
      daysAfterBirth: daysAfterBirth(input.dateOfBirth, input.dateReported),
      isLate: late,
      requiresSupervisorReview: requiresSupervisorReview(input.dateOfBirth, input.dateReported),
      delayReason: input.delayReason,
      directRegistrationReason: input.directRegistrationReason,
      registrationCategory: input.registrationCategory,
      child: input.child,
      mother: input.mother,
      father: input.father,
      declarant: input.declarant,
      witnesses: [],
      evidence: [],
      notificationValueChanges: [],
      reviewSections: emptyReviewSections(),
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
    db.crvsRegistrations.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.registration", draft.reference, `Created a ${input.sourceType.toLowerCase()} registration draft.`);
    if (input.notificationId) demoLinkNotificationToRegistration(input.notificationId, draft.id);
    return db;
  }).crvsRegistrations[0];

export const demoUpdateRegistrationDraft = (
  id: string,
  patch: Partial<BirthRegistrationCase>,
  actorName: string,
  expectedVersion?: number
): BirthRegistrationCase => {
  let updated: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (expectedVersion !== undefined && registrationCase.version !== expectedVersion) {
      throw new ConcurrencyError("This registration case");
    }
    Object.assign(registrationCase, patch);
    if (patch.dateOfBirth || patch.dateReported) {
      registrationCase.daysAfterBirth = daysAfterBirth(registrationCase.dateOfBirth, registrationCase.dateReported);
      registrationCase.isLate = isLateRegistration(registrationCase.dateOfBirth, registrationCase.dateReported);
      registrationCase.requiresSupervisorReview = requiresSupervisorReview(
        registrationCase.dateOfBirth,
        registrationCase.dateReported
      );
    }
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    updated = registrationCase;
    return db;
  });
  return updated!;
};

export const demoCancelRegistrationDraft = (id: string, reason: string, actorName: string): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    assertTransitionRegistration(registrationCase.status, "CANCELLED");
    registrationCase.status = "CANCELLED";
    registrationCase.cancelledAt = new Date().toISOString();
    registrationCase.updatedAt = registrationCase.cancelledAt;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "CANCELLED", at: registrationCase.cancelledAt, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.registration", registrationCase.reference, reason);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoSubmitRegistration = (id: string, actorName: string): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");

    if (registrationCase.status === "DRAFT" && registrationCase.duplicateCheck?.overallLevel === "EXACT") {
      throw new Error("An exact duplicate match blocks submission. Resolve the duplicate first.");
    }

    const routesToException =
      requiresExceptionEscalation(registrationCase.dateOfBirth, registrationCase.dateReported) ||
      registrationCase.duplicateCheck?.overallLevel === "POTENTIAL" ||
      registrationCase.duplicateCheck?.overallLevel === "PROBABLE";

    const nextStatus: BirthRegistrationCase["status"] =
      registrationCase.status === "CORRECTION_REQUIRED"
        ? "RESUBMITTED"
        : routesToException
        ? "EXCEPTION_REVIEW"
        : registrationCase.isLate
        ? "LATE_REGISTRATION_REVIEW"
        : "UNDER_REVIEW";

    assertTransitionRegistration(registrationCase.status, nextStatus);
    const now = new Date().toISOString();
    registrationCase.status = nextStatus;
    registrationCase.submittedAt = registrationCase.submittedAt || now;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: nextStatus, at: now, by: actorName });
    logCrvsAudit(db, actorName, "submitted", "crvs.registration", registrationCase.reference, `Submitted; routed to ${nextStatus}.`);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoStartReview = (id: string, actorId: string, actorName: string): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (registrationCase.reviewerId && registrationCase.reviewerId !== actorId) {
      throw new Error(`This case is already being reviewed by ${registrationCase.reviewerName}.`);
    }
    assertTransitionRegistration(registrationCase.status, "UNDER_REVIEW");
    const now = new Date().toISOString();
    registrationCase.status = "UNDER_REVIEW";
    registrationCase.reviewerId = actorId;
    registrationCase.reviewerName = actorName;
    registrationCase.reviewLockedAt = now;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "UNDER_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "started review", "crvs.review", registrationCase.reference, "Started review — case locked to this registrar.");
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoSetReviewSectionStatus = (
  id: string,
  section: ReviewSectionKey,
  status: ReviewSectionStatus,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    registrationCase.reviewSections[section] = status;
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "reviewed section", "crvs.review", registrationCase.reference, `${section}: ${status}`);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const allMandatorySectionsReviewed = (registrationCase: BirthRegistrationCase): boolean =>
  (Object.keys(registrationCase.reviewSections) as ReviewSectionKey[]).every(
    (key) => registrationCase.reviewSections[key] === "VERIFIED"
  );

export const demoRequestCorrection = (
  id: string,
  correction: Omit<CorrectionRequest, "id" | "requestedAt">,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    assertTransitionRegistration(registrationCase.status, "CORRECTION_REQUIRED");
    const now = new Date().toISOString();
    registrationCase.status = "CORRECTION_REQUIRED";
    registrationCase.correctionRequests.push({ ...correction, id: nextId("CR"), requestedAt: now });
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "CORRECTION_REQUIRED", at: now, by: actorName, note: correction.items[0]?.reason });
    logCrvsAudit(db, actorName, "requested correction", "crvs.correction", registrationCase.reference, correction.items.map((i) => i.reason).join("; "));
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoResubmitCorrections = (id: string, actorName: string): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    assertTransitionRegistration(registrationCase.status, "RESUBMITTED");
    const now = new Date().toISOString();
    registrationCase.status = "RESUBMITTED";
    const open = registrationCase.correctionRequests.filter((c) => !c.resolvedAt);
    open.forEach((c) => {
      c.resolvedAt = now;
      c.items.forEach((item) => (item.addressed = true));
    });
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "resubmitted", "crvs.correction", registrationCase.reference, "Resubmitted after addressing corrections.");
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoApproveRegistration = (
  id: string,
  actorId: string,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");

    const { allowed, reasons } = canApproveCase(actorId, registrationCase);
    if (!allowed) throw new Error(`Cannot approve this case: ${reasons.join(" ")}`);

    assertTransitionRegistration(registrationCase.status, "APPROVED");
    const now = new Date().toISOString();
    registrationCase.status = "APPROVED";
    registrationCase.approvedAt = now;
    registrationCase.approvedBy = actorId;
    registrationCase.approvedByName = actorName;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "APPROVED", at: now, by: actorName });

    assertTransitionRegistration(registrationCase.status, "REGISTERED");
    registrationCase.status = "REGISTERED";
    registrationCase.registeredAt = now;
    registrationCase.officialBirthRecordNumber = nextBirthRecordNumber(db);
    registrationCase.statusHistory.push({ status: "REGISTERED", at: now, by: actorName });

    logCrvsAudit(
      db,
      actorName,
      "approved and registered",
      "crvs.registration",
      registrationCase.reference,
      `Official birth record ${registrationCase.officialBirthRecordNumber} created.`
    );
    result = registrationCase;
    return db;
  });

  enqueueSdidSync(result!.id);
  return result!;
};

export const demoRejectRegistration = (
  id: string,
  reason: RejectionReason,
  actorId: string,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    assertTransitionRegistration(registrationCase.status, "REJECTED");
    const now = new Date().toISOString();
    registrationCase.status = "REJECTED";
    registrationCase.rejectedAt = now;
    registrationCase.rejectedBy = actorId;
    registrationCase.rejectionReason = reason;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "rejected", "crvs.registration", registrationCase.reference, reason.reason);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoReassignCase = (
  id: string,
  newAssigneeId: string,
  newAssigneeName: string,
  reason: string,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    registrationCase.reviewerId = newAssigneeId;
    registrationCase.reviewerName = newAssigneeName;
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "reassigned", "crvs.reassignment", registrationCase.reference, `Reassigned to ${newAssigneeName}: ${reason}`);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoSetException = (
  id: string,
  exception: Omit<ExceptionRecord, "status">,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    registrationCase.exception = { ...exception, status: "OPEN" };
    if (registrationCase.status !== "EXCEPTION_REVIEW") {
      assertTransitionRegistration(registrationCase.status, "EXCEPTION_REVIEW");
      registrationCase.status = "EXCEPTION_REVIEW";
      registrationCase.statusHistory.push({ status: "EXCEPTION_REVIEW", at: new Date().toISOString(), by: actorName });
    }
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "flagged exception", "crvs.exception", registrationCase.reference, `${exception.type}: ${exception.reason}`);
    result = registrationCase;
    return db;
  });
  return result!;
};

export type ExceptionResolutionInput = {
  type: string;
  reason: string;
  note?: string;
  nextStatus: BirthRegistrationCase["status"];
};

export const demoResolveException = (
  id: string,
  resolution: ExceptionResolutionInput,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    const now = new Date().toISOString();
    if (registrationCase.exception) {
      registrationCase.exception.status = "RESOLVED";
      registrationCase.exception.resolution = { ...resolution, resolvedBy: actorName, resolvedAt: now };
    }
    assertTransitionRegistration(registrationCase.status, resolution.nextStatus);
    registrationCase.status = resolution.nextStatus;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: resolution.nextStatus, at: now, by: actorName, note: resolution.reason });
    logCrvsAudit(db, actorName, "resolved exception", "crvs.exception", registrationCase.reference, `${resolution.type}: ${resolution.reason}`);
    result = registrationCase;
    return db;
  });
  return result!;
};

export const demoResolveLateRegistration = (
  id: string,
  resolution: ExceptionResolutionInput,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === id);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    const now = new Date().toISOString();
    assertTransitionRegistration(registrationCase.status, resolution.nextStatus);
    registrationCase.status = resolution.nextStatus;
    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    registrationCase.statusHistory.push({ status: resolution.nextStatus, at: now, by: actorName, note: resolution.reason });
    logCrvsAudit(db, actorName, "resolved late-registration review", "crvs.exception", registrationCase.reference, resolution.reason);
    result = registrationCase;
    return db;
  });
  return result!;
};
