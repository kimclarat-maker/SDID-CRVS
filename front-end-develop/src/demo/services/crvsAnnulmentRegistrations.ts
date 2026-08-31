// Core CRUD + submit/correction/resubmit/review/approve/reject/register
// service for marriage-annulment registrations — mirrors
// crvsDivorceRegistrations.ts's shape closely, but every review decision
// runs through the canApproveAnnulmentCase() maker-checker/conflict-of-
// interest gate (which additionally blocks approval while the legal-effect
// classification is unresolved), and demoRegisterAnnulment() (a) annotates
// the existing MarriageApplication as annulled without ever deleting or
// overwriting its original registration data (spec §1, §22) and (b)
// enqueues a two-party SDID sync exactly like demoRegisterDivorce() does,
// except the resulting civil status is never hardcoded — it is whatever the
// CONFIRMED legal-effect classification maps to (spec §24). Approval itself
// only locks the decision/legal-effect values; it never touches the
// marriage record or SDID — that only happens on the separate, explicit
// "Register annulment" action.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  AnnulmentRegistration,
  AnnulmentRegistrationStatus,
  AnnulmentReviewSectionKey,
  ReviewSectionStatus,
  AnnulmentApplicant,
  AffectedParty,
  AffectedPartyKey,
  AnnulmentDecision,
  ForeignAnnulmentRecognition,
  AnnulmentLegalEffect,
  AnnulmentExceptionType,
  emptyAnnulmentReviewSections,
} from "@/domain/crvs/types";
import { assertTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import { isLateAnnulmentRegistration } from "@/domain/crvs/annulmentPolicyConfig";
import {
  findAnnulmentDuplicateCandidates,
  findExistingAnnulmentConflicts,
  overallAnnulmentMatchLevel,
  AnnulmentDuplicateCandidate,
} from "@/domain/crvs/annulmentDuplicateDetection";
import { assessExistingMarriageCertificateConsequence } from "@/domain/crvs/annulmentCertificateEligibility";
import { deriveMarriageCivilStatus } from "@/domain/crvs/marriageCivilStatus";
import { canApproveAnnulmentCase } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { enqueueAnnulmentSdidSync } from "./crvsAnnulmentSdidSync";

export type AnnulmentRegistrationListParams = {
  status?: AnnulmentRegistrationStatus | AnnulmentRegistrationStatus[];
  savedView?: string;
  search?: string;
  officeId?: string;
  assignedTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListAnnulmentRegistrations = async (
  params: AnnulmentRegistrationListParams
): Promise<{ data: AnnulmentRegistration[]; total: number }> => {
  const db = getDemoData();
  let results = db.crvsAnnulmentRegistrations;

  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    results = results.filter((r) => statuses.includes(r.status));
  }
  if (params.officeId) results = results.filter((r) => r.processingOffice.selectedProcessingOfficeId === params.officeId);
  if (params.assignedTo) results = results.filter((r) => r.officerId === params.assignedTo || r.reviewerId === params.assignedTo);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.reference.toLowerCase().includes(term) ||
        r.decision.courtCaseNumber.toLowerCase().includes(term) ||
        r.decision.decisionNumber.toLowerCase().includes(term) ||
        (r.existingMarriage.selected?.registrationNumber || "").toLowerCase().includes(term) ||
        `${r.affectedParty1.firstName || ""} ${r.affectedParty1.lastName || ""}`.toLowerCase().includes(term) ||
        `${r.affectedParty2.firstName || ""} ${r.affectedParty2.lastName || ""}`.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetAnnulmentRegistration = async (id: string): Promise<AnnulmentRegistration> => {
  const db = getDemoData();
  const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id || r.reference === id);
  if (!reg) throw new NotFoundError("Annulment registration");
  return demoDelay(reg);
};

const nextAnnulmentReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  // Mirrors the seed data's shared AN-DEMO-{year}-{seq} numbering across
  // notifications and registrations (see seed/crvsAnnulmentRegistrations.ts)
  // rather than a registrations-only counter, so newly created references
  // never collide with seeded ones.
  const seq = db.crvsAnnulmentNotifications.length + db.crvsAnnulmentRegistrations.length + 1;
  return `AN-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextAnnulmentRegistrationNumber = (db: ReturnType<typeof getDemoData>) => {
  const registeredCount = db.crvsAnnulmentRegistrations.filter((r) => r.registrationEvent).length + 1;
  return `CRVS-ANNULMENT-DEMO-${registeredCount.toString().padStart(4, "0")}`;
};

const randomToken = () => Math.random().toString(36).slice(2, 10);

const emptyApplicant = (): AnnulmentApplicant => ({
  documentType: "NONE",
  relationshipToCase: "AFFECTED_PARTY_1",
  identityVerification: "NOT_VERIFIED",
});

const emptyAffectedParty = (partyKey: AffectedPartyKey): AffectedParty => ({
  partyKey,
  sex: "UNKNOWN",
  identityMatchConfidence: "NO_MATCH",
  identityVerification: "NOT_VERIFIED",
  linkedToSelectedMarriage: false,
});

const emptyDecision = (): AnnulmentDecision => ({
  country: "",
  courtOrAuthorityName: "",
  jurisdiction: "",
  courtCaseNumber: "",
  decisionNumber: "",
  decisionDate: "",
  decisionType: "COURT_ORDER",
  describesMarriageAs: "UNSPECIFIED",
  isForeign: false,
});

const notApplicableForeignRecognition = (): ForeignAnnulmentRecognition => ({
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

const emptyLegalEffect = (): AnnulmentLegalEffect => ({
  marriageStatusResult: "REQUIRES_MANUAL_REVIEW",
  proposedSdid: {
    party1: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
    party2: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
  },
  relationshipHistoryTreatment: "MARK_ANNULLED_PRESERVE_HISTORY",
  certificateConsequence: "MANUAL_REVIEW",
  downstreamChangesExplicitlyExcluded: [
    "Parent-child relationships",
    "Names",
    "Nationality or citizenship",
    "Residence or address",
    "Property, inheritance, tax, or immigration decisions",
  ],
  classificationHistory: [],
});

/** Builds a new draft from a caller-supplied partial shape (the wizard
 * assembles the applicant/existingMarriage/decision/etc fields as the user
 * progresses through steps) — system-owned fields (id, reference, status,
 * officer identity, timestamps, sdid, statusHistory, version) are always
 * generated here and can never be overridden by the input. */
export const demoCreateAnnulmentRegistrationDraft = async (
  input: Partial<AnnulmentRegistration>,
  actorId: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const now = new Date().toISOString();
    const draft: AnnulmentRegistration = {
      source: "APPLICANT",
      applicant: emptyApplicant(),
      existingMarriage: { status: "NOT_SEARCHED", candidates: [], notFoundEvidence: [] },
      affectedParty1: emptyAffectedParty("PARTY_1"),
      affectedParty2: emptyAffectedParty("PARTY_2"),
      decision: emptyDecision(),
      decisionVerification: { status: "NOT_STARTED", results: [] },
      legalEffect: emptyLegalEffect(),
      foreignRecognition: notApplicableForeignRecognition(),
      evidence: [],
      processingOffice: {
        selectedProcessingOfficeId: "",
        selectedProcessingOfficeName: "",
        embassyOrForeignOfficePath: false,
        jurisdictionResult: "UNRESOLVED",
      },
      jurisdiction: "",
      accuracyDeclarationConfirmed: false,
      authorityToSubmitConfirmed: false,
      authoritativeDecisionExistsConfirmed: false,
      decisionCompleteConfirmed: false,
      privacyAcknowledged: false,
      electronicSubmissionConfirmed: false,
      ...input,
      id: nextId("AN"),
      reference: nextAnnulmentReference(db),
      status: "DRAFT",
      reviewSections: emptyAnnulmentReviewSections(),
      reviewDecisions: [],
      correctionRequests: [],
      officerId: actorId,
      officerName: actorName,
      createdAt: now,
      updatedAt: now,
      sdid: {
        status: "NOT_READY",
        party1: { status: "NOT_READY", attempts: [] },
        party2: { status: "NOT_READY", attempts: [] },
      },
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsAnnulmentRegistrations.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.annulment_registration", draft.reference, "Created an annulment registration draft.");
    return db;
  }).crvsAnnulmentRegistrations[0];
};

export const demoUpdateAnnulmentRegistrationDraft = async (
  id: string,
  patch: Partial<AnnulmentRegistration>,
  actorName: string,
  expectedVersion?: number
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (expectedVersion !== undefined && reg.version !== expectedVersion) {
      throw new ConcurrencyError("This annulment registration");
    }
    Object.assign(reg, patch);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoCancelAnnulmentRegistration = async (id: string, reason: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "CANCELLED");
    const now = new Date().toISOString();
    reg.status = "CANCELLED";
    reg.cancelledAt = now;
    reg.cancellationReason = reason;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.annulment_registration", reg.reference, reason);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

/** Submits (or resubmits after correction) an annulment registration. Blocks
 * submission on an exact duplicate-registration match (spec §21/§31 "no
 * duplicate annulment"). */
export const demoSubmitAnnulmentRegistration = async (id: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");

    if (reg.status === "DRAFT") {
      const dupCandidates = findAnnulmentDuplicateCandidates(
        {
          marriageApplicationId: reg.existingMarriage.selected?.marriageApplicationId,
          courtCaseNumber: reg.decision.courtCaseNumber,
          decisionNumber: reg.decision.decisionNumber,
        },
        db.crvsAnnulmentRegistrations,
        reg.id
      );
      if (overallAnnulmentMatchLevel(dupCandidates) === "EXACT") {
        throw new Error("An exact duplicate annulment registration blocks submission. Resolve the duplicate first.");
      }
    }

    const now = new Date().toISOString();
    reg.submittedAt = reg.submittedAt || now;
    reg.updatedAt = now;
    reg.version += 1;

    if (reg.status === "CORRECTION_REQUIRED") {
      assertTransitionAnnulmentRegistration(reg.status, "RESUBMITTED");
      reg.status = "RESUBMITTED";
      reg.correctionRequests
        .filter((c) => !c.resolvedAt)
        .forEach((c) => {
          c.resolvedAt = now;
          c.items.forEach((item) => (item.addressed = true));
        });
      reg.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    } else {
      assertTransitionAnnulmentRegistration(reg.status, "SUBMITTED");
      reg.status = "SUBMITTED";
      reg.statusHistory.push({ status: "SUBMITTED", at: now, by: actorName });
    }

    logCrvsAudit(db, actorName, "submitted", "crvs.annulment_registration", reg.reference, `Submitted; now ${reg.status}.`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

/** Locks the registration to this reviewer and moves SUBMITTED/RESUBMITTED
 * into UNDER_REVIEW. */
export const demoStartAnnulmentReview = async (id: string, reviewerId: string, reviewerName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.reviewerId && reg.reviewerId !== reviewerId) {
      throw new Error(`This registration is already being reviewed by ${reg.reviewerName}.`);
    }
    assertTransitionAnnulmentRegistration(reg.status, "UNDER_REVIEW");
    const now = new Date().toISOString();
    reg.status = "UNDER_REVIEW";
    reg.reviewerId = reviewerId;
    reg.reviewerName = reviewerName;
    reg.reviewLockedAt = now;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "UNDER_REVIEW", at: now, by: reviewerName });
    logCrvsAudit(db, reviewerName, "started review", "crvs.annulment_review", reg.reference, "Started review — registration locked to this reviewer.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoSetAnnulmentReviewSectionStatus = async (
  id: string,
  section: AnnulmentReviewSectionKey,
  status: ReviewSectionStatus,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.reviewSections[section] = status;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "reviewed section", "crvs.annulment_review", reg.reference, `${section}: ${status}`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export type AnnulmentCorrectionRequestInput = {
  requestType: "CORRECTION" | "EVIDENCE";
  items: Array<{ section: AnnulmentReviewSectionKey; fields: string[]; reason: string; note?: string; documentsRequired: boolean }>;
  responseDeadline?: string;
  notifyApplicants: boolean;
};

export const demoRequestAnnulmentCorrection = async (
  id: string,
  input: AnnulmentCorrectionRequestInput,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "CORRECTION_REQUIRED");
    const now = new Date().toISOString();
    reg.status = "CORRECTION_REQUIRED";
    reg.correctionRequests.push({
      id: nextId("ACR"),
      requestType: input.requestType,
      requestedBy: actorName,
      requestedAt: now,
      items: input.items.map((item) => ({ ...item, id: nextId("ACI"), addressed: false })),
      responseDeadline: input.responseDeadline,
      notifyApplicants: input.notifyApplicants,
      responseToken: `resp-tok-${reg.id.toLowerCase()}-${randomToken()}`,
    });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "CORRECTION_REQUIRED", at: now, by: actorName, note: input.items[0]?.reason });
    logCrvsAudit(db, actorName, "requested correction", "crvs.annulment_correction", reg.reference, input.items.map((i) => i.reason).join("; "));
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoRouteAnnulmentToDecisionVerification = async (id: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "DECISION_VERIFICATION");
    const now = new Date().toISOString();
    reg.status = "DECISION_VERIFICATION";
    reg.reviewDecisions.push({ type: "ROUTE_DECISION_VERIFICATION", decidedBy: actorName, decidedAt: now });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "DECISION_VERIFICATION", at: now, by: actorName });
    logCrvsAudit(db, actorName, "routed to decision verification", "crvs.annulment_decision_verification", reg.reference, "Routed for decision verification.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoRouteAnnulmentToLegalEffectReview = async (id: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "LEGAL_EFFECT_REVIEW");
    const now = new Date().toISOString();
    reg.status = "LEGAL_EFFECT_REVIEW";
    reg.reviewDecisions.push({ type: "ROUTE_LEGAL_EFFECT_REVIEW", decidedBy: actorName, decidedAt: now });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "LEGAL_EFFECT_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "routed to legal-effect review", "crvs.annulment_legal_effect", reg.reference, "Routed for legal-effect classification review.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoRouteAnnulmentToForeignReview = async (id: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "FOREIGN_DECISION_REVIEW");
    const now = new Date().toISOString();
    reg.status = "FOREIGN_DECISION_REVIEW";
    if (reg.foreignRecognition.status === "NOT_APPLICABLE") reg.foreignRecognition.status = "PENDING";
    reg.reviewDecisions.push({ type: "ROUTE_FOREIGN_REVIEW", decidedBy: actorName, decidedAt: now });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "FOREIGN_DECISION_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "routed to foreign decision review", "crvs.annulment_foreign_review", reg.reference, "Routed for foreign-decision recognition review.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export type AnnulmentExceptionInput = {
  type: AnnulmentExceptionType;
  reason: string;
  triggeringRule?: string;
  affectedData?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
};

export const demoRouteAnnulmentToException = async (id: string, exception: AnnulmentExceptionInput, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "EXCEPTION_REVIEW");
    const now = new Date().toISOString();
    reg.status = "EXCEPTION_REVIEW";
    reg.exception = { ...exception, status: "OPEN" };
    reg.reviewDecisions.push({ type: "ROUTE_EXCEPTION", decidedBy: actorName, decidedAt: now, reason: exception.reason });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "EXCEPTION_REVIEW", at: now, by: actorName, note: exception.reason });
    logCrvsAudit(db, actorName, "routed for exception review", "crvs.annulment_exception", reg.reference, `${exception.type}: ${exception.reason}`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export type AnnulmentExceptionResolutionInput = { type: string; reason: string; note?: string; nextStatus: AnnulmentRegistrationStatus };

export const demoResolveAnnulmentException = async (
  id: string,
  resolution: AnnulmentExceptionResolutionInput,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    const now = new Date().toISOString();
    if (reg.exception) {
      reg.exception.status = "RESOLVED";
      reg.exception.resolution = { type: resolution.type, reason: resolution.reason, note: resolution.note, nextStatus: resolution.nextStatus, resolvedBy: actorName, resolvedAt: now };
    }
    assertTransitionAnnulmentRegistration(reg.status, resolution.nextStatus);
    reg.status = resolution.nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: resolution.nextStatus, at: now, by: actorName, note: `Exception resolved: ${resolution.type}` });
    logCrvsAudit(db, actorName, "resolved exception review", "crvs.annulment_exception", reg.reference, `${resolution.type}: ${resolution.reason}`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

/**
 * Approves an annulment registration (legal-eligibility approval only — does
 * NOT yet register the annulment or touch SDID/the marriage record;
 * registration only happens via the separate demoRegisterAnnulment() action,
 * spec §22). `confirmedDidNotPrepare` and `confirmedNoConflictOfInterest` are
 * the approver's explicit maker-checker checkboxes, required in addition to
 * (not instead of) the automatic canApproveAnnulmentCase() gate, which
 * itself already blocks approval while the legal-effect classification is
 * unconfirmed. On success, locks the confirmed legal-effect classification
 * (lockedAt + classificationHistory entry marked locked) so it can never be
 * silently changed afterward.
 */
export const demoApproveAnnulmentRegistration = async (
  id: string,
  actorId: string,
  actorName: string,
  note: string,
  confirmedDidNotPrepare: boolean,
  confirmedNoConflictOfInterest: boolean
): Promise<AnnulmentRegistration> => {
  if (!confirmedDidNotPrepare || !confirmedNoConflictOfInterest) {
    throw new Error("You must confirm you did not prepare this case and declare no conflict of interest before approving it.");
  }
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");

    const { allowed, reasons } = canApproveAnnulmentCase(actorId, reg);
    if (!allowed) throw new Error(`Cannot approve this registration: ${reasons.join(" ")}`);
    if (!reg.legalEffect.confirmedClassification) {
      throw new Error("The legal-effect classification must be confirmed before this registration can be approved.");
    }

    assertTransitionAnnulmentRegistration(reg.status, "APPROVED");
    const now = new Date().toISOString();
    reg.status = "APPROVED";
    reg.approvedAt = now;
    reg.approvedBy = actorId;
    reg.approvedByName = actorName;
    reg.approvalNote = note;
    reg.reviewDecisions.push({
      type: "APPROVE",
      decidedBy: actorName,
      decidedAt: now,
      note,
      confirmedDidNotPrepare: true,
      confirmedNoConflictOfInterest: true,
    });

    if (!reg.legalEffect.lockedAt) {
      reg.legalEffect.lockedAt = now;
      const latest = reg.legalEffect.classificationHistory[reg.legalEffect.classificationHistory.length - 1];
      if (latest && !latest.locked) latest.locked = true;
    }

    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "APPROVED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "approved", "crvs.annulment_review", reg.reference, "Approved; legal-effect classification locked; awaiting final registration.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

export const demoRejectAnnulmentRegistration = async (
  id: string,
  reason: string,
  explanation: string,
  actorId: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, "REJECTED");
    const now = new Date().toISOString();
    reg.status = "REJECTED";
    reg.rejectedAt = now;
    reg.rejectedBy = actorId;
    reg.rejectionReason = { reason, explanation, evidenceRefs: [], applicantsNotified: false };
    reg.reviewDecisions.push({ type: "REJECT", decidedBy: actorName, decidedAt: now, reason });
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "rejected", "crvs.annulment_review", reg.reference, reason);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

/** Reassignment always creates its own audit event, independent of any
 * status transition (spec: "reassignment must create an audit event"). */
export const demoReassignAnnulmentCase = async (
  id: string,
  newOfficerId: string,
  newOfficerName: string,
  reason: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.reviewerId = newOfficerId;
    reg.reviewerName = newOfficerName;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "reassigned", "crvs.annulment_reassignment", reg.reference, `Reassigned to ${newOfficerName}: ${reason}`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;
};

/**
 * Records the final REGISTERED transition (spec §22 "Register annulment").
 * In one mutation cycle:
 *  1. Generates the immutable annulment registration number.
 *  2. Sets status REGISTERED.
 *  3. Annotates the linked MarriageApplication as annulled — status stays
 *     REGISTERED (its own registration is an immutable historical fact);
 *     only the additive `annulment` field is set, and the annulment
 *     reference is recorded, never the marriage's original registration
 *     data touched or the record deleted (spec §1, §16, §22).
 *  4. Computes the existing marriage certificate's forward-looking
 *     consequence (never deletes/auto-revokes it).
 *  5. Sets record/certificate eligibility to NOT_CHECKED (assessed
 *     separately once SDID sync resolves).
 *  6. Writes the audit event.
 * SDID sync is enqueued in a second, separate updateDemoData() cycle
 * (enqueueAnnulmentSdidSync) — a synchronization failure must never reverse
 * this registration; registration and sync are separate, irreversible-once-
 * done steps.
 */
export const demoRegisterAnnulment = async (
  id: string,
  effectiveDate: string,
  actorId: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  const registered = updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === id);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (!reg.legalEffect.confirmedClassification) {
      throw new Error("The legal-effect classification must be confirmed before this annulment can be registered.");
    }
    assertTransitionAnnulmentRegistration(reg.status, "REGISTERED");
    const now = new Date().toISOString();

    const marriageId = reg.existingMarriage.selected?.marriageApplicationId;
    const marriage = marriageId ? db.crvsMarriageApplications.find((m) => m.id === marriageId) : undefined;
    const previousCivilStatus = marriage ? deriveMarriageCivilStatus(marriage, { annulmentRegistrations: db.crvsAnnulmentRegistrations }) : undefined;

    reg.status = "REGISTERED";
    reg.registeredAt = now;
    reg.legalEffect.effectiveDate = reg.legalEffect.effectiveDate || effectiveDate;
    const registrationNumber = nextAnnulmentRegistrationNumber(db);
    reg.registrationEvent = {
      id: nextId("ARE"),
      registrationNumber,
      registeredAt: now,
      registeredBy: actorId,
      registeredByName: actorName,
      officeId: reg.processingOffice.selectedProcessingOfficeId,
      officeName: reg.processingOffice.selectedProcessingOfficeName,
      effectiveDate,
      courtCaseNumber: reg.decision.courtCaseNumber,
      decisionNumber: reg.decision.decisionNumber,
      marriageRegistrationReference: reg.existingMarriage.selected?.registrationNumber || "",
      legalEffectClassification: reg.legalEffect.confirmedClassification,
      party1Summary: { firstName: reg.affectedParty1.firstName, lastName: reg.affectedParty1.lastName },
      party2Summary: { firstName: reg.affectedParty2.firstName, lastName: reg.affectedParty2.lastName },
    };

    if (marriage) {
      marriage.annulment = {
        annulmentRegistrationId: reg.id,
        annulmentRegistrationReference: reg.reference,
        legalEffectClassification: reg.legalEffect.confirmedClassification,
        effectiveDate,
        recordedAt: now,
        recordedBy: actorName,
      };
      marriage.updatedAt = now;
      marriage.version += 1;
      logCrvsAudit(
        db,
        actorName,
        "annotated as annulled",
        "crvs.annulment_marriage_status_update",
        marriage.reference,
        `Marked ANNULLED by ${reg.reference}; original registration data preserved.`
      );
    }
    reg.marriageAnnulmentUpdate = {
      applied: true,
      marriageApplicationId: marriage?.id,
      marriageApplicationReference: marriage?.reference,
      previousCivilStatus,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: reg.legalEffect.confirmedClassification,
      updatedAt: now,
      annulmentRegistrationReference: reg.reference,
    };

    reg.existingMarriageCertificateConsequence = assessExistingMarriageCertificateConsequence({ registration: reg });
    reg.recordEligibility = { status: "NOT_CHECKED", reasons: [] };
    reg.certificateEligibility = { status: "NOT_CHECKED", reasons: [] };
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REGISTERED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "registered", "crvs.annulment_registration_event", reg.reference, `Annulment registration ${registrationNumber} created.`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === id)!;

  // enqueueAnnulmentSdidSync runs its own updateDemoData() cycle — re-fetch
  // rather than returning the stale in-closure snapshot.
  await enqueueAnnulmentSdidSync(registered.id);
  return getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === registered.id)!;
};

/** Late-registration flag used by the wizard/review screens (spec §7, §21,
 * §30) — read-only, never itself blocks a status transition; the reviewer
 * decides whether to route to exception review. */
export const isAnnulmentLateRegistration = (registration: Pick<AnnulmentRegistration, "decision" | "submittedAt">): boolean => {
  if (!registration.decision.finalityDate || !registration.submittedAt) return false;
  return isLateAnnulmentRegistration(registration.decision.finalityDate, registration.submittedAt);
};

export const runAnnulmentDuplicateCheck = async (
  input: { marriageApplicationId?: string; courtCaseNumber?: string; decisionNumber?: string },
  excludeId?: string
): Promise<{ candidates: AnnulmentDuplicateCandidate[]; overallMatchLevel: ReturnType<typeof overallAnnulmentMatchLevel> }> => {
  const db = getDemoData();
  const candidates = findAnnulmentDuplicateCandidates(input, db.crvsAnnulmentRegistrations, excludeId);
  return demoDelay({ candidates, overallMatchLevel: overallAnnulmentMatchLevel(candidates) });
};

// Re-exported so callers evaluating decision verification / exception rules
// can also check for an active annulment referencing the same marriage
// without importing the domain module directly.
export const findAnnulmentConflictsForMarriage = (marriageApplicationId: string | undefined, excludeId?: string) =>
  findExistingAnnulmentConflicts(marriageApplicationId, getDemoData().crvsAnnulmentRegistrations, excludeId);
