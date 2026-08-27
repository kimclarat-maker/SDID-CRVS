// Core CRUD + submit/correction/resubmit/review/approve/reject service for
// marriage applications — mirrors crvsDeathRegistrations.ts's shape closely,
// but every review decision runs through the two-party
// canApproveMarriageCase() gate instead of the single-subject
// canApproveDeathCase(), and there is no pathway-driven exception escalation
// on submit (marriage has no equivalent of death's late/medico-legal/
// unidentified branches at the application level — see statusMachines.ts's
// modeling notes for why exceptions are a side-record here instead).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  MarriageApplication,
  MarriageCorrectionRequest,
  MarriageReviewSectionKey,
  ReviewSectionStatus,
  MarriageRejectionReason,
  MarriageExceptionRecord,
  emptyMarriageReviewSections,
} from "@/domain/crvs/types";
import { assertTransitionMarriageApplication } from "@/domain/crvs/statusMachines";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { canApproveMarriageCase } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { enqueueMarriageSdidSync } from "./crvsMarriageSdidSync";

export type MarriageApplicationListParams = {
  search?: string;
  status?: string;
  officeId?: string;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedOfficerId?: string;
  paymentStatus?: string;
  nationalityCategory?: string;
  offset?: number;
  limit?: number;
};

export const demoListMarriageApplications = async (params: MarriageApplicationListParams) => {
  const db = getDemoData();
  let results = db.crvsMarriageApplications;

  if (params.status) results = results.filter((a) => a.status === params.status!.toUpperCase());
  if (params.officeId) results = results.filter((a) => a.officeId === params.officeId);
  if (params.jurisdiction) results = results.filter((a) => a.jurisdiction === params.jurisdiction);
  if (params.paymentStatus) results = results.filter((a) => a.payment.status === params.paymentStatus!.toUpperCase());
  if (params.nationalityCategory)
    results = results.filter(
      (a) => a.applicant1.nationalityCategory === params.nationalityCategory || a.applicant2.nationalityCategory === params.nationalityCategory
    );
  if (params.assignedOfficerId)
    results = results.filter((a) => a.officerId === params.assignedOfficerId || a.reviewerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((a) => (a.proposedMarriageDate || "") >= params.dateFrom!);
  if (params.dateTo) results = results.filter((a) => (a.proposedMarriageDate || "") <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (a) =>
        a.reference.toLowerCase().includes(term) ||
        `${a.applicant1.firstName || ""} ${a.applicant1.lastName || ""}`.toLowerCase().includes(term) ||
        `${a.applicant2.firstName || ""} ${a.applicant2.lastName || ""}`.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetMarriageApplication = async (id: string): Promise<MarriageApplication | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsMarriageApplications.find((a) => a.id === id || a.reference === id));
};

const nextMarriageApplicationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsMarriageApplications.length + 1;
  return `MR-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextMarriageRegistrationNumber = (db: ReturnType<typeof getDemoData>) => {
  const registeredCount = db.crvsMarriageApplications.filter((a) => a.registrationEvent).length + 1;
  return `CRVS-MARRIAGE-DEMO-${registeredCount.toString().padStart(4, "0")}`;
};

const randomToken = () => Math.random().toString(36).slice(2, 10);

export type CreateMarriageApplicationInput = {
  officeId: string;
  officeName: string;
  officeType: MarriageApplication["officeType"];
  jurisdiction: string;
  applicant1: MarriageApplication["applicant1"];
  applicant2: MarriageApplication["applicant2"];
  proposedMarriageDate?: string;
  preferredTimeWindow?: string;
  ceremonyType: MarriageApplication["ceremonyType"];
  propertyRegime?: MarriageApplication["propertyRegime"];
  languageOrAccessibilityNote?: string;
  isSpecialDayRequest: boolean;
};

export const demoCreateMarriageApplicationDraft = (
  input: CreateMarriageApplicationInput,
  actorId: string,
  actorName: string
): MarriageApplication =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const draft: MarriageApplication = {
      id: nextId("MR"),
      reference: nextMarriageApplicationReference(db),
      status: "DRAFT",
      officeId: input.officeId,
      officeName: input.officeName,
      officeType: input.officeType,
      jurisdiction: input.jurisdiction,
      applicant1: input.applicant1,
      applicant2: input.applicant2,
      proposedMarriageDate: input.proposedMarriageDate,
      preferredTimeWindow: input.preferredTimeWindow,
      ceremonyType: input.ceremonyType,
      propertyRegime: input.propertyRegime,
      languageOrAccessibilityNote: input.languageOrAccessibilityNote,
      isSpecialDayRequest: input.isSpecialDayRequest,
      evidence: [],
      witnesses: [],
      payment: { status: "NOT_REQUIRED", amount: 0, currency: "RWF", isSpecialDayFee: false, attempts: [] },
      reviewSections: emptyMarriageReviewSections(),
      reviewDecisions: [],
      correctionRequests: [],
      officerId: actorId,
      officerName: actorName,
      declarationConfirmed: false,
      consentToVerification: false,
      privacyAcknowledged: false,
      createdAt: now,
      updatedAt: now,
      sdid: {
        status: "NOT_READY",
        applicant1: { status: "NOT_READY", attempts: [] },
        applicant2: { status: "NOT_READY", attempts: [] },
      },
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsMarriageApplications.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.marriage_application", draft.reference, "Created a marriage declaration draft.");
    return db;
  }).crvsMarriageApplications[0];

export const demoUpdateMarriageApplicationDraft = (
  id: string,
  patch: Partial<MarriageApplication>,
  actorName: string,
  expectedVersion?: number
): MarriageApplication => {
  let updated: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    if (expectedVersion !== undefined && app.version !== expectedVersion) {
      throw new ConcurrencyError("This marriage application");
    }
    Object.assign(app, patch);
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    updated = app;
    return db;
  });
  return updated!;
};

export const demoCancelMarriageApplication = (id: string, reason: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "CANCELLED");
    const now = new Date().toISOString();
    app.status = "CANCELLED";
    app.cancelledAt = now;
    app.cancellationReason = reason;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.marriage_application", app.reference, reason);
    result = app;
    return db;
  });
  return result!;
};

/** Sends the second applicant their /respond/:token invite and moves the
 * draft to PARTNER_VERIFICATION_REQUIRED — separate from submission itself,
 * since a partner who hasn't confirmed must never be able to reach
 * SUBMITTED (spec §2 "identity and civil-status verification" stage). */
export const demoRequestMarriagePartnerVerification = (id: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "PARTNER_VERIFICATION_REQUIRED");
    const now = new Date().toISOString();
    app.status = "PARTNER_VERIFICATION_REQUIRED";
    app.applicant2.partnerConfirmationStatus = "PENDING";
    app.partnerResponseToken = app.partnerResponseToken || `resp-tok-${app.id.toLowerCase()}-${randomToken()}`;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "PARTNER_VERIFICATION_REQUIRED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "requested partner verification", "crvs.marriage_application", app.reference, "Sent applicant 2 a participation-confirmation invite.");
    result = app;
    return db;
  });
  return result!;
};

/** Submits (or resubmits after correction) a marriage application. Blocks
 * submission if applicant 2 has not confirmed participation, or if an exact
 * duplicate-declaration match exists — mirroring death's exact-duplicate
 * submission block. */
export const demoSubmitMarriageApplication = (id: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");

    if (app.status !== "CORRECTION_REQUIRED" && app.applicant2.partnerConfirmationStatus !== "CONFIRMED") {
      throw new Error("Applicant 2 must confirm participation before this declaration can be submitted.");
    }
    if (app.status === "DRAFT" && app.duplicateCheck?.overallLevel === "EXACT") {
      throw new Error("An exact duplicate match blocks submission. Resolve the duplicate first.");
    }

    const now = new Date().toISOString();
    app.submittedAt = app.submittedAt || now;
    app.updatedAt = now;
    app.version += 1;

    if (app.status === "CORRECTION_REQUIRED") {
      assertTransitionMarriageApplication(app.status, "RESUBMITTED");
      app.status = "RESUBMITTED";
      app.correctionRequests
        .filter((c) => !c.resolvedAt)
        .forEach((c) => {
          c.resolvedAt = now;
          c.items.forEach((item) => (item.addressed = true));
        });
      app.statusHistory.push({ status: "RESUBMITTED", at: now, by: actorName });
    } else {
      assertTransitionMarriageApplication(app.status, "SUBMITTED");
      app.status = "SUBMITTED";
      app.statusHistory.push({ status: "SUBMITTED", at: now, by: actorName });
    }

    logCrvsAudit(db, actorName, "submitted", "crvs.marriage_application", app.reference, `Submitted; now ${app.status}.`);
    result = app;
    return db;
  });
  return result!;
};

/** Locks the application to this reviewer and moves SUBMITTED/RESUBMITTED
 * into ELIGIBILITY_REVIEW — mirrors demoStartDeathReview()'s locking
 * pattern. */
export const demoStartMarriageEligibilityReview = (id: string, actorId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    if (app.reviewerId && app.reviewerId !== actorId) {
      throw new Error(`This application is already being reviewed by ${app.reviewerName}.`);
    }
    assertTransitionMarriageApplication(app.status, "ELIGIBILITY_REVIEW");
    const now = new Date().toISOString();
    app.status = "ELIGIBILITY_REVIEW";
    app.reviewerId = actorId;
    app.reviewerName = actorName;
    app.reviewLockedAt = now;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "ELIGIBILITY_REVIEW", at: now, by: actorName });
    logCrvsAudit(db, actorName, "started eligibility review", "crvs.marriage_review", app.reference, "Started review — application locked to this reviewer.");
    result = app;
    return db;
  });
  return result!;
};

export const demoSetMarriageReviewSectionStatus = (
  id: string,
  section: MarriageReviewSectionKey,
  status: ReviewSectionStatus,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    app.reviewSections[section] = status;
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "reviewed section", "crvs.marriage_review", app.reference, `${section}: ${status}`);
    result = app;
    return db;
  });
  return result!;
};

export const demoRequestMarriageCorrection = (
  id: string,
  correction: Omit<MarriageCorrectionRequest, "id" | "requestedAt" | "responseToken">,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "CORRECTION_REQUIRED");
    const now = new Date().toISOString();
    app.status = "CORRECTION_REQUIRED";
    app.correctionRequests.push({
      ...correction,
      id: nextId("MCR"),
      requestedAt: now,
      responseToken: `resp-tok-${app.id.toLowerCase()}-${randomToken()}`,
    });
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "CORRECTION_REQUIRED", at: now, by: actorName, note: correction.items[0]?.reason });
    logCrvsAudit(db, actorName, "requested correction", "crvs.marriage_correction", app.reference, correction.items.map((i) => i.reason).join("; "));
    result = app;
    return db;
  });
  return result!;
};

/**
 * Approves a marriage application (eligibility approval only — this does
 * NOT register the marriage; registration only happens after a successful
 * ceremony outcome, per spec §1 "submitting a declaration must never
 * automatically create a registration"). `confirmedNoConflict` is the
 * approver's explicit maker-checker checkbox, required in addition to (not
 * instead of) the automatic canApproveMarriageCase() gate.
 */
export const demoApproveMarriageApplication = (
  id: string,
  actorId: string,
  actorName: string,
  confirmedNoConflict: boolean,
  ceremonyOfficiantId?: string
): MarriageApplication => {
  if (!confirmedNoConflict) {
    throw new Error("You must confirm that you did not prepare this application before approving it.");
  }
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");

    const { allowed, reasons } = canApproveMarriageCase(actorId, app, ceremonyOfficiantId);
    if (!allowed) throw new Error(`Cannot approve this application: ${reasons.join(" ")}`);

    const paymentSettled = app.payment.status === "PAID" || app.payment.status === "WAIVED" || app.payment.status === "NOT_REQUIRED";
    const nextStatus = marriagePolicyConfig.payment.required && !paymentSettled ? "PAYMENT_PENDING" : "APPROVED";
    assertTransitionMarriageApplication(app.status, nextStatus === "PAYMENT_PENDING" ? "PAYMENT_PENDING" : "APPROVED");
    const now = new Date().toISOString();
    app.status = nextStatus;
    if (nextStatus === "APPROVED") {
      app.approvedAt = now;
      app.approvedBy = actorId;
      app.approvedByName = actorName;
    }
    app.reviewDecisions.push({ type: "APPROVE", decidedBy: actorName, decidedAt: now, confirmedNoConflict: true });
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: nextStatus, at: now, by: actorName });
    logCrvsAudit(db, actorName, "approved", "crvs.marriage_review", app.reference, `Approved; now ${nextStatus}.`);
    result = app;
    return db;
  });
  return result!;
};

/** Once payment is confirmed PAID (or waived), moves PAYMENT_PENDING -> PAID
 * -> APPROVED in one step — called by crvsMarriagePayment.ts after a
 * successful demo payment. */
export const demoApproveMarriageApplicationAfterPayment = (id: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    assertTransitionMarriageApplication(app.status, "PAID");
    app.status = "PAID";
    app.statusHistory.push({ status: "PAID", at: now, by: actorName });
    assertTransitionMarriageApplication(app.status, "APPROVED");
    app.status = "APPROVED";
    app.approvedAt = now;
    app.approvedBy = app.reviewerId;
    app.approvedByName = app.reviewerName;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "APPROVED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "approved after payment", "crvs.marriage_review", app.reference, "Payment confirmed; application approved.");
    result = app;
    return db;
  });
  return result!;
};

export const demoRejectMarriageApplication = (
  id: string,
  reason: MarriageRejectionReason,
  actorId: string,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "REJECTED");
    const now = new Date().toISOString();
    app.status = "REJECTED";
    app.rejectedAt = now;
    app.rejectedBy = actorId;
    app.rejectionReason = reason;
    app.reviewDecisions.push({ type: "REJECT", decidedBy: actorName, decidedAt: now, reason: reason.reason });
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "rejected", "crvs.marriage_review", app.reference, reason.reason);
    result = app;
    return db;
  });
  return result!;
};

export const demoReassignMarriageCase = (
  id: string,
  newAssigneeId: string,
  newAssigneeName: string,
  reason: string,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    app.reviewerId = newAssigneeId;
    app.reviewerName = newAssigneeName;
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "reassigned", "crvs.marriage_reassignment", app.reference, `Reassigned to ${newAssigneeName}: ${reason}`);
    result = app;
    return db;
  });
  return result!;
};

export type MarriageExceptionInput = Pick<MarriageExceptionRecord, "type" | "reason" | "triggeringRule">;

/** Routes an ELIGIBILITY_REVIEW application into supervisor exception
 * review — unlike death, this does NOT change the top-level status (there
 * is no dedicated exception-review application status, per
 * statusMachines.ts's modeling notes); it attaches a side-record that
 * canApproveMarriageCase() blocks against via the open-correction-style
 * check, mirrored here for exceptions. */
export const demoRouteMarriageToException = (id: string, input: MarriageExceptionInput, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    app.exception = { ...input, status: "OPEN" };
    app.reviewDecisions.push({ type: "ROUTE_EXCEPTION", decidedBy: actorName, decidedAt: new Date().toISOString(), reason: input.reason });
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "routed for exception review", "crvs.marriage_exception", app.reference, `${input.type}: ${input.reason}`);
    result = app;
    return db;
  });
  return result!;
};

export type MarriageExceptionResolutionInput = {
  type: string;
  reason: string;
  note?: string;
};

export const demoResolveMarriageException = (id: string, resolution: MarriageExceptionResolutionInput, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    if (app.exception) {
      const now = new Date().toISOString();
      app.exception.status = "RESOLVED";
      app.exception.resolution = { ...resolution, nextStatus: app.status, resolvedBy: actorName, resolvedAt: now };
    }
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "resolved exception review", "crvs.marriage_exception", app.reference, `${resolution.type}: ${resolution.reason}`);
    result = app;
    return db;
  });
  return result!;
};

/**
 * Records the ceremony's REGISTERED transition — only ever called from
 * crvsMarriageCeremony.ts after a COMPLETED outcome, never invoked directly
 * by a review/approval action (spec §1 "a marriage may be registered only
 * after ... an authorized Civil Registrar records a successful ceremony
 * outcome").
 */
export const demoRegisterMarriage = (
  id: string,
  ceremonyId: string,
  appointmentId: string,
  actorId: string,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === id);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "REGISTERED");
    const now = new Date().toISOString();
    app.status = "REGISTERED";
    app.registeredAt = now;
    app.ceremonyId = ceremonyId;
    const registrationNumber = nextMarriageRegistrationNumber(db);
    app.registrationEvent = {
      id: nextId("MRE"),
      registrationNumber,
      registeredAt: now,
      registeredBy: actorId,
      registeredByName: actorName,
      officeId: app.officeId,
      officeName: app.officeName,
      ceremonyId,
      appointmentId,
      marriageDate: app.proposedMarriageDate || now,
      spouse1Summary: { firstName: app.applicant1.firstName, lastName: app.applicant1.lastName, sex: app.applicant1.sex },
      spouse2Summary: { firstName: app.applicant2.firstName, lastName: app.applicant2.lastName, sex: app.applicant2.sex },
      propertyRegime: app.propertyRegime,
    };
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "REGISTERED", at: now, by: actorName });
    logCrvsAudit(db, actorName, "registered", "crvs.marriage_registration", app.reference, `Marriage registration ${registrationNumber} created.`);
    result = app;
    return db;
  });

  // enqueueMarriageSdidSync runs its own updateDemoData() cycle — re-fetch
  // rather than returning the stale in-closure snapshot, same reasoning as
  // demoApproveDeathRegistration's equivalent re-fetch.
  enqueueMarriageSdidSync(result!.id);
  return getDemoData().crvsMarriageApplications.find((a) => a.id === result!.id)!;
};
