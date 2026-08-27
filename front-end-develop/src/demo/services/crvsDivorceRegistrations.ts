// Core CRUD + submit/correction/resubmit/review/approve/reject/register
// service for divorce registrations — mirrors crvsMarriageApplications.ts's
// shape closely, but every review decision runs through the
// canApproveDivorceCase() maker-checker/conflict-of-interest gate, and
// demoRegisterDivorce() additionally (a) annotates the existing
// MarriageApplication as dissolved without ever deleting or overwriting its
// original registration data (spec §1, §21) and (b) enqueues a two-party
// SDID sync exactly like demoRegisterMarriage() does, except flipping
// maritalStatus to DIVORCED and dissolving the existing relationship rather
// than creating a new one (spec §23).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  DivorceRegistration,
  DivorceCorrectionRequest,
  DivorceReviewSectionKey,
  ReviewSectionStatus,
  DivorceRejectionReason,
  DivorceExceptionRecord,
  DivorceApplicant,
  FormerSpouse,
  DivorceJudgment,
  ForeignDivorceRecognition,
  DivorceSubmissionSource,
  emptyDivorceReviewSections,
} from "@/domain/crvs/types";
import { assertTransitionDivorceRegistration } from "@/domain/crvs/statusMachines";
import { isLateDivorceRegistration } from "@/domain/crvs/divorcePolicyConfig";
import { findDivorceDuplicateCandidates, findExistingDivorceConflicts, overallDivorceMatchLevel } from "@/domain/crvs/divorceDuplicateDetection";
import { canApproveDivorceCase } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { enqueueDivorceSdidSync } from "./crvsDivorceSdidSync";

export type DivorceRegistrationListParams = {
  search?: string;
  status?: string;
  source?: string;
  jurisdiction?: string;
  processingOfficeId?: string;
  assignedOfficerId?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListDivorceRegistrations = async (params: DivorceRegistrationListParams) => {
  const db = getDemoData();
  let results = db.crvsDivorceRegistrations;

  if (params.status) results = results.filter((r) => r.status === params.status!.toUpperCase());
  if (params.source) results = results.filter((r) => r.source === params.source!.toUpperCase());
  if (params.jurisdiction) results = results.filter((r) => r.jurisdiction === params.jurisdiction);
  if (params.processingOfficeId) results = results.filter((r) => r.processingOffice.selectedProcessingOfficeId === params.processingOfficeId);
  if (params.assignedOfficerId) results = results.filter((r) => r.officerId === params.assignedOfficerId || r.reviewerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((r) => (r.judgment.registrationEffectiveDate || "") >= params.dateFrom!);
  if (params.dateTo) results = results.filter((r) => (r.judgment.registrationEffectiveDate || "") <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.reference.toLowerCase().includes(term) ||
        r.judgment.courtCaseNumber.toLowerCase().includes(term) ||
        r.judgment.judgmentNumber.toLowerCase().includes(term) ||
        (r.existingMarriage.selected?.registrationNumber || "").toLowerCase().includes(term) ||
        `${r.formerSpouse1.firstName || ""} ${r.formerSpouse1.lastName || ""}`.toLowerCase().includes(term) ||
        `${r.formerSpouse2.firstName || ""} ${r.formerSpouse2.lastName || ""}`.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetDivorceRegistration = async (id: string): Promise<DivorceRegistration | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsDivorceRegistrations.find((r) => r.id === id || r.reference === id));
};

const nextDivorceReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsDivorceRegistrations.length + 1;
  return `DR-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextDivorceRegistrationNumber = (db: ReturnType<typeof getDemoData>) => {
  const registeredCount = db.crvsDivorceRegistrations.filter((r) => r.registrationEvent).length + 1;
  return `CRVS-DIVORCE-DEMO-${registeredCount.toString().padStart(4, "0")}`;
};

const randomToken = () => Math.random().toString(36).slice(2, 10);

export type CreateDivorceRegistrationInput = {
  source: DivorceSubmissionSource;
  sourceNotificationId?: string;
  sourceNotificationReference?: string;
  jurisdiction: string;
  applicant: DivorceApplicant;
  processingOfficeId: string;
  processingOfficeName: string;
};

const emptyFormerSpouse = (spouseKey: "SPOUSE1" | "SPOUSE2"): FormerSpouse => ({
  spouseKey,
  sex: "UNKNOWN",
  identityMatchConfidence: "NO_MATCH",
  identityVerification: "NOT_VERIFIED",
  linkedToSelectedMarriage: false,
});

const emptyJudgment = (): DivorceJudgment => ({
  country: "",
  courtOrAuthorityName: "",
  courtCaseNumber: "",
  judgmentNumber: "",
  judgmentDate: "",
  decisionType: "MUTUAL_CONSENT",
  isForeign: false,
});

const notApplicableForeignRecognition = (): ForeignDivorceRecognition => ({
  status: "NOT_APPLICABLE",
  country: "",
  foreignCourtOrAuthority: "",
  translationRequired: false,
  translationProvided: false,
  authenticationRequired: false,
  authenticationProvided: false,
  exequaturOrRecognitionRequired: false,
  exequaturOrRecognitionProvided: false,
  missingRequirements: [],
});

export const demoCreateDivorceRegistrationDraft = (
  input: CreateDivorceRegistrationInput,
  actorId: string,
  actorName: string
): DivorceRegistration =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const draft: DivorceRegistration = {
      id: nextId("DR"),
      reference: nextDivorceReference(db),
      status: "DRAFT",
      source: input.source,
      sourceNotificationId: input.sourceNotificationId,
      sourceNotificationReference: input.sourceNotificationReference,
      applicant: input.applicant,
      existingMarriage: { status: "NOT_SEARCHED", candidates: [], notFoundEvidence: [] },
      formerSpouse1: emptyFormerSpouse("SPOUSE1"),
      formerSpouse2: emptyFormerSpouse("SPOUSE2"),
      judgment: emptyJudgment(),
      judgmentVerification: { status: "NOT_STARTED", results: [] },
      foreignRecognition: notApplicableForeignRecognition(),
      evidence: [],
      processingOffice: {
        selectedProcessingOfficeId: input.processingOfficeId,
        selectedProcessingOfficeName: input.processingOfficeName,
        embassyOrForeignOfficePath: false,
        jurisdictionResult: "CONFIRMED",
      },
      jurisdiction: input.jurisdiction,
      reviewSections: emptyDivorceReviewSections(),
      reviewDecisions: [],
      correctionRequests: [],
      officerId: actorId,
      officerName: actorName,
      accuracyDeclarationConfirmed: false,
      authorityToSubmitConfirmed: false,
      judgmentFinalConfirmed: false,
      privacyAcknowledged: false,
      electronicSubmissionConfirmed: false,
      createdAt: now,
      updatedAt: now,
      sdid: {
        status: "NOT_READY",
        spouse1: { status: "NOT_READY", attempts: [] },
        spouse2: { status: "NOT_READY", attempts: [] },
      },
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsDivorceRegistrations.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.divorce_registration", draft.reference, "Created a divorce registration draft.");
    return db;
  }).crvsDivorceRegistrations[0];

export const demoUpdateDivorceRegistrationDraft = (
  id: string,
  patch: Partial<DivorceRegistration>,
  actorName: string,
  expectedVersion?: number
): DivorceRegistration => {
  let updated: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (expectedVersion !== undefined && reg.version !== expectedVersion) {
      throw new ConcurrencyError("This divorce registration");
    }
    Object.assign(reg, patch);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    updated = reg;
    return db;
  });
  return updated!;
};

export const demoCancelDivorceRegistration = (id: string, reason: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "CANCELLED");
    const now = new Date().toISOString();
    reg.status = "CANCELLED";
    reg.cancelledAt = now;
    reg.cancellationReason = reason;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.divorce_registration", reg.reference, reason);
    result = reg;
    return db;
  });
  return result!;
};

/** Submits (or resubmits after correction) a divorce registration. Blocks
 * submission on an exact duplicate-registration match — mirrors marriage's
 * exact-duplicate submission block (spec §17 "no duplicate divorce
 * registration"). */
export const demoSubmitDivorceRegistration = (id: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");

    if (reg.status === "DRAFT") {
      const dupCandidates = findDivorceDuplicateCandidates(
        { marriageApplicationId: reg.existingMarriage.selected?.marriageApplicationId, courtCaseNumber: reg.judgment.courtCaseNumber, judgmentNumber: reg.judgment.judgmentNumber },
        db.crvsDivorceRegistrations,
        reg.id
      );
      if (overallDivorceMatchLevel(dupCandidates) === "EXACT") {
        throw new Error("An exact duplicate divorce registration blocks submission. Resolve the duplicate first.");
      }
    }

    const now = new Date().toISOString();
    reg.submittedAt = reg.submittedAt || now;
    reg.updatedAt = now;
    reg.version += 1;

    if (reg.status === "CORRECTION_REQUIRED") {
      assertTransitionDivorceRegistration(reg.status, "RESUBMITTED");
      reg.status = "RESUBMITTED";
      reg.correctionRequests
        .filter((c) => !c.resolvedAt)
        .forEach((c) => {
          c.resolvedAt = now;
          c.items.forEach((item) => (item.addressed = true));
        });
      reg.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    } else {
      assertTransitionDivorceRegistration(reg.status, "SUBMITTED");
      reg.status = "SUBMITTED";
      reg.statusHistory.push({ status: "SUBMITTED", at: now, by: actorName });
    }

    logCrvsAudit(db, actorName, "submitted", "crvs.divorce_registration", reg.reference, `Submitted; now ${reg.status}.`);
    result = reg;
    return db;
  });
  return result!;
};

/** Locks the registration to this reviewer and moves SUBMITTED/RESUBMITTED
 * into UNDER_REVIEW — mirrors demoStartMarriageEligibilityReview()'s
 * locking pattern. */
export const demoStartDivorceReview = (id: string, actorId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (reg.reviewerId && reg.reviewerId !== actorId) {
      throw new Error(`This registration is already being reviewed by ${reg.reviewerName}.`);
    }
    assertTransitionDivorceRegistration(reg.status, "UNDER_REVIEW");
    const now = new Date().toISOString();
    reg.status = "UNDER_REVIEW";
    reg.reviewerId = actorId;
    reg.reviewerName = actorName;
    reg.reviewLockedAt = now;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "UNDER_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "started review", "crvs.divorce_review", reg.reference, "Started review — registration locked to this reviewer.");
    result = reg;
    return db;
  });
  return result!;
};

export const demoSetDivorceReviewSectionStatus = (
  id: string,
  section: DivorceReviewSectionKey,
  status: ReviewSectionStatus,
  actorName: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.reviewSections[section] = status;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "reviewed section", "crvs.divorce_review", reg.reference, `${section}: ${status}`);
    result = reg;
    return db;
  });
  return result!;
};

export const demoRequestDivorceCorrection = (
  id: string,
  correction: Omit<DivorceCorrectionRequest, "id" | "requestedAt" | "responseToken">,
  actorName: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "CORRECTION_REQUIRED");
    const now = new Date().toISOString();
    reg.status = "CORRECTION_REQUIRED";
    reg.correctionRequests.push({
      ...correction,
      id: nextId("DCR"),
      requestedAt: now,
      responseToken: `resp-tok-${reg.id.toLowerCase()}-${randomToken()}`,
    });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "CORRECTION_REQUIRED", at: now, by: actorName, note: correction.items[0]?.reason });
    logCrvsAudit(db, actorName, "requested correction", "crvs.divorce_correction", reg.reference, correction.items.map((i) => i.reason).join("; "));
    result = reg;
    return db;
  });
  return result!;
};

export const demoRouteDivorceToJudgmentVerification = (id: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "JUDGMENT_VERIFICATION");
    const now = new Date().toISOString();
    reg.status = "JUDGMENT_VERIFICATION";
    reg.reviewDecisions.push({ type: "ROUTE_JUDGMENT_VERIFICATION", decidedBy: actorName, decidedAt: now });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "JUDGMENT_VERIFICATION", at: now, by: actorName });
    logCrvsAudit(db, actorName, "routed to judgment verification", "crvs.divorce_judgment_verification", reg.reference, "Routed for judgment verification.");
    result = reg;
    return db;
  });
  return result!;
};

export const demoRouteDivorceToForeignReview = (id: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "FOREIGN_JUDGMENT_REVIEW");
    const now = new Date().toISOString();
    reg.status = "FOREIGN_JUDGMENT_REVIEW";
    if (reg.foreignRecognition.status === "NOT_APPLICABLE") reg.foreignRecognition.status = "PENDING";
    reg.reviewDecisions.push({ type: "ROUTE_FOREIGN_REVIEW", decidedBy: actorName, decidedAt: now });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "FOREIGN_JUDGMENT_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "routed to foreign judgment review", "crvs.divorce_foreign_review", reg.reference, "Routed for foreign-decision recognition review.");
    result = reg;
    return db;
  });
  return result!;
};

export type DivorceExceptionInput = Pick<DivorceExceptionRecord, "type" | "reason" | "triggeringRule" | "affectedData">;

export const demoRouteDivorceToException = (id: string, input: DivorceExceptionInput, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "EXCEPTION_REVIEW");
    const now = new Date().toISOString();
    reg.status = "EXCEPTION_REVIEW";
    reg.exception = { ...input, status: "OPEN" };
    reg.reviewDecisions.push({ type: "ROUTE_EXCEPTION", decidedBy: actorName, decidedAt: now, reason: input.reason });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "EXCEPTION_REVIEW", at: now, by: actorName, note: input.reason });
    logCrvsAudit(db, actorName, "routed for exception review", "crvs.divorce_exception", reg.reference, `${input.type}: ${input.reason}`);
    result = reg;
    return db;
  });
  return result!;
};

export type DivorceExceptionResolutionInput = { type: string; reason: string; note?: string; nextStatus: DivorceRegistration["status"] };

export const demoResolveDivorceException = (id: string, resolution: DivorceExceptionResolutionInput, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    const now = new Date().toISOString();
    if (reg.exception) {
      reg.exception.status = "RESOLVED";
      reg.exception.resolution = { type: resolution.type, reason: resolution.reason, note: resolution.note, nextStatus: resolution.nextStatus, resolvedBy: actorName, resolvedAt: now };
    }
    assertTransitionDivorceRegistration(reg.status, resolution.nextStatus);
    reg.status = resolution.nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: resolution.nextStatus, at: now, by: actorName, note: `Exception resolved: ${resolution.type}` });
    logCrvsAudit(db, actorName, "resolved exception review", "crvs.divorce_exception", reg.reference, `${resolution.type}: ${resolution.reason}`);
    result = reg;
    return db;
  });
  return result!;
};

/**
 * Approves a divorce registration (legal-eligibility approval only — this
 * does NOT yet register the divorce or touch SDID; registration only
 * happens after a separate explicit "Register divorce" action, spec §21
 * "after approval... do not yet mark SDID identities divorced until
 * registration is completed"). `confirmedDidNotPrepare` and
 * `confirmedNoConflictOfInterest` are the approver's explicit maker-checker
 * checkboxes, required in addition to (not instead of) the automatic
 * canApproveDivorceCase() gate.
 */
export const demoApproveDivorceRegistration = (
  id: string,
  actorId: string,
  actorName: string,
  confirmedDidNotPrepare: boolean,
  confirmedNoConflictOfInterest: boolean,
  note?: string
): DivorceRegistration => {
  if (!confirmedDidNotPrepare || !confirmedNoConflictOfInterest) {
    throw new Error("You must confirm you did not prepare this case and declare no conflict of interest before approving it.");
  }
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");

    const { allowed, reasons } = canApproveDivorceCase(actorId, reg);
    if (!allowed) throw new Error(`Cannot approve this registration: ${reasons.join(" ")}`);

    assertTransitionDivorceRegistration(reg.status, "APPROVED");
    const now = new Date().toISOString();
    reg.status = "APPROVED";
    reg.approvedAt = now;
    reg.approvedBy = actorId;
    reg.approvedByName = actorName;
    reg.reviewDecisions.push({ type: "APPROVE", decidedBy: actorName, decidedAt: now, note, confirmedDidNotPrepare: true, confirmedNoConflictOfInterest: true });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "APPROVED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "approved", "crvs.divorce_review", reg.reference, "Approved; awaiting final registration.");
    result = reg;
    return db;
  });
  return result!;
};

export const demoRejectDivorceRegistration = (
  id: string,
  reason: DivorceRejectionReason,
  actorId: string,
  actorName: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "REJECTED");
    const now = new Date().toISOString();
    reg.status = "REJECTED";
    reg.rejectedAt = now;
    reg.rejectedBy = actorId;
    reg.rejectionReason = reason;
    reg.reviewDecisions.push({ type: "REJECT", decidedBy: actorName, decidedAt: now, reason: reason.reason });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "rejected", "crvs.divorce_review", reg.reference, reason.reason);
    result = reg;
    return db;
  });
  return result!;
};

export const demoReassignDivorceCase = (
  id: string,
  newAssigneeId: string,
  newAssigneeName: string,
  reason: string,
  actorName: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.reviewerId = newAssigneeId;
    reg.reviewerName = newAssigneeName;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "reassigned", "crvs.divorce_reassignment", reg.reference, `Reassigned to ${newAssigneeName}: ${reason}`);
    result = reg;
    return db;
  });
  return result!;
};

/**
 * Records the final REGISTERED transition (spec §21 "Register divorce"). In
 * one mutation cycle:
 *  1. Generates the immutable divorce registration number.
 *  2. Sets status REGISTERED.
 *  3. Annotates the linked MarriageApplication as dissolved — status stays
 *     REGISTERED (its own registration is an immutable historical fact);
 *     only the new `dissolution` field is set, and the divorce reference is
 *     recorded, never the marriage's original registration data touched or
 *     the record deleted (spec §1, §11, §21).
 *  4. Sets certificate eligibility to NOT_CHECKED (assessed separately by
 *     crvsDivorceCertificateEligibility.ts once SDID sync resolves).
 *  5. Writes the audit event.
 * SDID sync is enqueued in a second, separate updateDemoData() cycle
 * (enqueueDivorceSdidSync), mirroring demoRegisterMarriage()'s own
 * re-fetch-after-enqueue pattern.
 */
export const demoRegisterDivorce = (id: string, effectiveDate: string, actorId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, "REGISTERED");
    const now = new Date().toISOString();
    reg.status = "REGISTERED";
    reg.registeredAt = now;
    const registrationNumber = nextDivorceRegistrationNumber(db);
    reg.registrationEvent = {
      id: nextId("DRE"),
      registrationNumber,
      registeredAt: now,
      registeredBy: actorId,
      registeredByName: actorName,
      officeId: reg.processingOffice.selectedProcessingOfficeId,
      officeName: reg.processingOffice.selectedProcessingOfficeName,
      effectiveDate,
      courtCaseNumber: reg.judgment.courtCaseNumber,
      judgmentNumber: reg.judgment.judgmentNumber,
      marriageRegistrationReference: reg.existingMarriage.selected?.registrationNumber || "",
      formerSpouse1Summary: { firstName: reg.formerSpouse1.firstName, lastName: reg.formerSpouse1.lastName },
      formerSpouse2Summary: { firstName: reg.formerSpouse2.firstName, lastName: reg.formerSpouse2.lastName },
    };

    const marriageId = reg.existingMarriage.selected?.marriageApplicationId;
    const marriage = marriageId ? db.crvsMarriageApplications.find((m) => m.id === marriageId) : undefined;
    if (marriage) {
      marriage.dissolution = {
        divorceRegistrationId: reg.id,
        divorceRegistrationReference: reg.reference,
        effectiveDate,
        recordedAt: now,
        recordedBy: actorName,
      };
      marriage.updatedAt = now;
      marriage.version += 1;
      logCrvsAudit(db, actorName, "annotated as dissolved", "crvs.divorce_marriage_status_update", marriage.reference, `Marked DISSOLVED_BY_DIVORCE by ${reg.reference}; original registration data preserved.`);
    }
    reg.marriageStatusUpdate = {
      applied: !!marriage,
      marriageApplicationId: marriage?.id,
      marriageApplicationReference: marriage?.reference,
      previousStatus: marriage ? "REGISTERED" : undefined,
      newStatus: "DISSOLVED_BY_DIVORCE",
      updatedAt: now,
      divorceRegistrationReference: reg.reference,
    };

    reg.certificateEligibility = { status: "NOT_CHECKED", reasons: [] };
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REGISTERED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "registered", "crvs.divorce_registration_event", reg.reference, `Divorce registration ${registrationNumber} created.`);
    result = reg;
    return db;
  });

  // enqueueDivorceSdidSync runs its own updateDemoData() cycle — re-fetch
  // rather than returning the stale in-closure snapshot, same reasoning as
  // demoRegisterMarriage's equivalent re-fetch.
  enqueueDivorceSdidSync(result!.id);
  return getDemoData().crvsDivorceRegistrations.find((r) => r.id === result!.id)!;
};

/** Late-registration flag used by the wizard/review screens (spec §5, §20,
 * §28) — read-only, never itself blocks a status transition; the reviewer
 * decides whether to route to exception review. */
export const isDivorceLateRegistration = (reg: Pick<DivorceRegistration, "judgment" | "submittedAt">): boolean => {
  if (!reg.judgment.finalityDate || !reg.submittedAt) return false;
  return isLateDivorceRegistration(reg.judgment.finalityDate, reg.submittedAt);
};

export const runDivorceDuplicateCheck = (reg: Pick<DivorceRegistration, "id" | "existingMarriage" | "judgment">, allRegistrations: DivorceRegistration[]) => {
  const candidates = findDivorceDuplicateCandidates(
    { marriageApplicationId: reg.existingMarriage.selected?.marriageApplicationId, courtCaseNumber: reg.judgment.courtCaseNumber, judgmentNumber: reg.judgment.judgmentNumber },
    allRegistrations,
    reg.id
  );
  const conflicts = findExistingDivorceConflicts(reg.existingMarriage.selected?.marriageApplicationId, allRegistrations, reg.id);
  return { candidates, conflicts, overallLevel: overallDivorceMatchLevel(candidates) };
};
