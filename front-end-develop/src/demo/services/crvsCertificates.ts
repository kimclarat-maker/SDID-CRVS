// Demo service layer for the birth-certificate request/issuance/delivery/
// verification lifecycle (spec §9-§34). Follows the exact conventions
// already established by crvsRegistrations.ts: reads are async + demoDelay,
// writes are synchronous updateDemoData()+assertTransitionX()+logCrvsAudit()
// +version++, and every reference number is generated from the current
// collection length rather than a random id.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  ActorReference,
  BirthCertificateRequest,
  BirthCertificateRequestStatus,
  CertificateDeliveryMethod,
  CertificateProcessingOffice,
  CertificateRequestChannel,
  CertificateRequesterType,
  DemoBirthCertificate,
  IdentityDocumentType,
} from "@/domain/crvs/types";
import {
  assertTransitionCertificate,
  assertTransitionCertificateRequest,
} from "@/domain/crvs/statusMachines";
import { assessCertificateEligibility, isReadyForAutomaticApproval } from "@/domain/crvs/certificateEligibility";
import { buildCertificateDigest, buildVerificationQrPayload } from "@/domain/crvs/certificateDocument";
import { canApproveCertificateRequest } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

const maskTail = (value: string, keep = 3) =>
  `${value.slice(0, keep)}${"*".repeat(Math.max(value.length - keep, 3))}`;

const addHoursIso = (iso: string, hours: number) =>
  new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();

const findReq = (db: ReturnType<typeof getDemoData>, id: string) =>
  db.crvsCertificateRequests.find((r) => r.id === id || r.applicationReference === id);

const nextApplicationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsCertificateRequests.length + 1;
  return `CERTREQ-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextBillingReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsCertificateRequests.filter((r) => r.payment.billingReference).length + 1;
  return `BILL-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextReceiptReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsCertificateRequests.filter((r) => r.payment.receiptReference).length + 1;
  return `RCPT-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextCertificateNumber = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsCertificates.length + 1;
  return `BCERT-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

const nextVerificationToken = (db: ReturnType<typeof getDemoData>) =>
  `VERIFY-DEMO-${(db.crvsCertificates.length + 1).toString().padStart(4, "0")}`;

const nextDownloadToken = () =>
  `DLTOKEN-DEMO-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

// ---------------------------------------------------------------------------
// Reads

export type CertificateRequestListParams = {
  search?: string;
  status?: BirthCertificateRequestStatus;
  channel?: CertificateRequestChannel;
  offset?: number;
  limit?: number;
};

export const demoListCertificateRequests = async (params: CertificateRequestListParams = {}) => {
  const db = getDemoData();
  let results = db.crvsCertificateRequests;
  if (params.status) results = results.filter((r) => r.status === params.status);
  if (params.channel) results = results.filter((r) => r.channel === params.channel);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.applicationReference.toLowerCase().includes(term) ||
        `${r.requester.firstName} ${r.requester.lastName}`.toLowerCase().includes(term) ||
        r.subject.birthRecordNumber.toLowerCase().includes(term)
    );
  }
  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetCertificateRequest = async (id: string): Promise<BirthCertificateRequest | undefined> => {
  const db = getDemoData();
  return demoDelay(findReq(db, id));
};

export const demoGetCertificate = async (id: string): Promise<DemoBirthCertificate | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsCertificates.find((c) => c.id === id || c.certificateNumber === id));
};

// ---------------------------------------------------------------------------
// Draft, identity verification, record lookup

export type CreateCertificateRequestInput = {
  requesterType: CertificateRequesterType;
  firstName: string;
  lastName: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  phoneNumber?: string;
  email?: string;
  processingOffice?: CertificateProcessingOffice;
};

export const demoCreateCertificateRequest = (
  input: CreateCertificateRequestInput,
  channel: CertificateRequestChannel,
  actor: ActorReference
): BirthCertificateRequest =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    // Staff have already verified the requester in person (spec §2/§16), so
    // a staff-assisted request skips straight to the lookup step instead of
    // sitting in DRAFT with nothing left to advance it there.
    const initialStatus = channel === "STAFF_ASSISTED" ? "RECORD_LOOKUP_REQUIRED" : "DRAFT";
    const draft: BirthCertificateRequest = {
      id: nextId("CERTREQ"),
      applicationReference: nextApplicationReference(db),
      channel,
      status: initialStatus,
      requester: {
        requesterType: input.requesterType,
        firstName: input.firstName,
        lastName: input.lastName,
        documentType: input.documentType,
        documentNumberMasked: maskTail(input.documentNumber),
        phoneNumberMasked: input.phoneNumber ? maskTail(input.phoneNumber, 8) : undefined,
        emailMasked: input.email ? maskTail(input.email, 3) : undefined,
        verificationStatus: channel === "STAFF_ASSISTED" ? "VERIFIED" : "NOT_STARTED",
      },
      subject: { birthRecordId: "", birthRecordNumber: "", dateOfBirth: "", placeOfBirthSummary: "" },
      purpose: "GENERAL_PROOF",
      processingOffice: input.processingOffice,
      eligibility: { status: "NOT_CHECKED", reasons: [] },
      payment: { status: "NOT_REQUIRED", amount: db.crvsCertificateConfig.fee, currency: db.crvsCertificateConfig.currency },
      delivery: { method: "SECURE_DOWNLOAD", status: "NOT_STARTED", attempts: [] },
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
      statusHistory: [{ status: initialStatus, at: now, by: actor.name }],
      version: 1,
    };
    db.crvsCertificateRequests.unshift(draft);
    logCrvsAudit(db, actor.name, "created request", "crvs.certificate", draft.applicationReference, `Created a ${channel.toLowerCase()} certificate request.`);
    return db;
  }).crvsCertificateRequests[0];

export const demoUpdateCertificateRequestDraft = (
  id: string,
  patch: Partial<BirthCertificateRequest>,
  actorName: string,
  expectedVersion?: number
): BirthCertificateRequest => {
  let updated: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    if (expectedVersion !== undefined && request.version !== expectedVersion) {
      throw new ConcurrencyError("This certificate request");
    }
    Object.assign(request, patch);
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    updated = request;
    return db;
  });
  return updated!;
};

export const demoCancelCertificateRequest = (id: string, reason: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "CANCELLED");
    const now = new Date().toISOString();
    request.status = "CANCELLED";
    request.updatedAt = now;
    request.version += 1;
    request.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled request", "crvs.certificate", request.applicationReference, reason);
    result = request;
    return db;
  });
  return result!;
};

export const DEMO_CERT_OTP_CODE = "246813";

export const demoSendVerificationOtp = (id: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    const now = new Date().toISOString();
    if (request.status === "DRAFT") {
      assertTransitionCertificateRequest(request.status, "IDENTITY_VERIFICATION_REQUIRED");
      request.status = "IDENTITY_VERIFICATION_REQUIRED";
      request.statusHistory.push({ status: "IDENTITY_VERIFICATION_REQUIRED", at: now, by: actorName });
    }
    request.requester.verificationStatus = "OTP_REQUIRED";
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "sent verification code", "crvs.certificate", request.applicationReference, "Demo one-time verification code sent.");
    result = request;
    return db;
  });
  return result!;
};

export const demoVerifyRequesterOtp = (id: string, code: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    const now = new Date().toISOString();
    if (code.trim() !== DEMO_CERT_OTP_CODE) {
      request.requester.verificationStatus = "MISMATCH";
      request.updatedAt = now;
      request.version += 1;
      logCrvsAudit(db, actorName, "verification code mismatch", "crvs.certificate", request.applicationReference, "Requester entered an incorrect demo verification code.");
      result = request;
      return db;
    }
    request.requester.verificationStatus = "VERIFIED";
    if (request.status === "IDENTITY_VERIFICATION_REQUIRED") {
      assertTransitionCertificateRequest(request.status, "RECORD_LOOKUP_REQUIRED");
      request.status = "RECORD_LOOKUP_REQUIRED";
      request.statusHistory.push({ status: "RECORD_LOOKUP_REQUIRED", at: now, by: actorName });
    }
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "verified requester identity", "crvs.certificate", request.applicationReference, "Requester identity verified via demo one-time code.");
    result = request;
    return db;
  });
  return result!;
};

export type BirthRecordLookupParams = {
  identifierType: "NIN" | "CITIZEN_APPLICATION_NUMBER" | "BIRTH_RECORD_NUMBER";
  identifierValue: string;
  dateOfBirth?: string;
  relationship?: string;
};

export type BirthRecordLookupOutcome =
  | "FOUND"
  | "RELATIONSHIP_REQUIRED"
  | "NOT_FOUND"
  | "MULTIPLE_MATCHES"
  | "RESTRICTED"
  | "MANUAL_REVIEW";

/** Never exposes unrelated records — only the single matched (or restricted/
 * ambiguous) outcome is ever written back onto the request (spec §14/§15). */
export const demoLookupBirthRecord = (
  id: string,
  params: BirthRecordLookupParams,
  actorName: string
): { outcome: BirthRecordLookupOutcome; request: BirthCertificateRequest } => {
  let outcome: BirthRecordLookupOutcome = "NOT_FOUND";
  let result: BirthCertificateRequest | undefined;

  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");

    let candidates = db.crvsRegistrations;
    if (params.identifierType === "BIRTH_RECORD_NUMBER") {
      const value = params.identifierValue.trim();
      candidates = candidates.filter((c) => c.officialBirthRecordNumber === value || c.reference === value);
    } else if (params.identifierType === "NIN") {
      const identity = db.crvsFoundationalIdentities.find((f) => f.fictionalNin === params.identifierValue.trim());
      candidates = identity ? candidates.filter((c) => c.sdid.foundationalIdentityId === identity.id) : [];
    } else {
      candidates = candidates.filter((c) => c.notificationReference === params.identifierValue.trim());
    }
    if (params.dateOfBirth) {
      candidates = candidates.filter((c) => c.dateOfBirth.slice(0, 10) === params.dateOfBirth!.slice(0, 10));
    }

    const now = new Date().toISOString();

    if (candidates.length === 0) {
      outcome = "NOT_FOUND";
      assertTransitionCertificateRequest(request.status, "RECORD_NOT_FOUND");
      request.status = "RECORD_NOT_FOUND";
      request.statusHistory.push({ status: "RECORD_NOT_FOUND", at: now, by: actorName });
      logCrvsAudit(db, actorName, "searched record — no match", "crvs.certificate", request.applicationReference, "No eligible registered birth record matched the supplied identifiers.");
    } else if (candidates.length > 1) {
      outcome = "MULTIPLE_MATCHES";
      assertTransitionCertificateRequest(request.status, "MANUAL_REVIEW");
      request.status = "MANUAL_REVIEW";
      request.statusHistory.push({ status: "MANUAL_REVIEW", at: now, by: "System", note: "Multiple possible record matches." });
      logCrvsAudit(db, actorName, "searched record — multiple matches", "crvs.certificate", request.applicationReference, `${candidates.length} possible matches; routed to manual review.`);
    } else {
      const match = candidates[0];
      if (match.status !== "REGISTERED") {
        outcome = "RESTRICTED";
        assertTransitionCertificateRequest(request.status, "MANUAL_REVIEW");
        request.status = "MANUAL_REVIEW";
        request.statusHistory.push({ status: "MANUAL_REVIEW", at: now, by: "System", note: "Matched record is not yet in a registered, active state." });
        logCrvsAudit(db, actorName, "searched record — restricted", "crvs.certificate", request.applicationReference, `${match.reference} is not currently in a registered state.`);
      } else if (request.requester.requesterType !== "SELF" && !params.relationship) {
        outcome = "RELATIONSHIP_REQUIRED";
      } else {
        const identity = db.crvsFoundationalIdentities.find((f) => f.id === match.sdid.foundationalIdentityId);
        outcome = "FOUND";
        request.subject = {
          birthRecordId: match.id,
          birthRecordNumber: match.officialBirthRecordNumber || match.reference,
          foundationalIdentityId: identity?.id,
          ninMasked: identity ? maskTail(identity.fictionalNin, 8) : undefined,
          firstName: match.child.firstName,
          middleName: match.child.middleName,
          lastName: match.child.lastName,
          dateOfBirth: match.child.dateOfBirth,
          placeOfBirthSummary: match.placeOfBirth,
        };
        request.requester.matchedIdentityId = identity?.id;
        if (params.relationship) request.requester.relationshipToSubject = params.relationship;
        logCrvsAudit(db, actorName, "matched record", "crvs.certificate", request.applicationReference, `Matched ${request.subject.birthRecordNumber}.`);
      }
    }

    request.updatedAt = now;
    request.version += 1;
    result = request;
    return db;
  });

  return { outcome, request: result! };
};

// ---------------------------------------------------------------------------
// Submission, eligibility, payment

export const demoSubmitCertificateRequest = (id: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    if (!request.subject.birthRecordId) throw new Error("A birth record must be matched before submitting.");

    const now = new Date().toISOString();
    request.submittedAt = request.submittedAt || now;

    assertTransitionCertificateRequest(request.status, "ELIGIBILITY_CHECK");
    request.status = "ELIGIBILITY_CHECK";
    request.statusHistory.push({ status: "ELIGIBILITY_CHECK", at: now, by: actorName });

    const registrationCase = db.crvsRegistrations.find((c) => c.id === request.subject.birthRecordId);
    const foundationalIdentity = db.crvsFoundationalIdentities.find((f) => f.id === request.subject.foundationalIdentityId);
    const existingActiveCertificates = db.crvsCertificates.filter((c) => c.status === "ACTIVE");
    const verdict = assessCertificateEligibility({ request, registrationCase, foundationalIdentity, existingActiveCertificates });
    request.eligibility = { status: verdict.status, checkedAt: now, reasons: verdict.reasons };
    logCrvsAudit(db, actorName, "checked eligibility", "crvs.certificate", request.applicationReference, `Eligibility: ${verdict.status}.`);

    if (verdict.status === "ELIGIBLE") {
      request.payment.amount = db.crvsCertificateConfig.fee;
      request.payment.currency = db.crvsCertificateConfig.currency;
      if (request.payment.status !== "WAIVED") {
        request.payment.status = "PENDING";
        request.payment.billingReference = request.payment.billingReference || nextBillingReference(db);
      }
      assertTransitionCertificateRequest(request.status, request.payment.status === "WAIVED" ? "PAID" : "PAYMENT_PENDING");
      request.status = request.payment.status === "WAIVED" ? "PAID" : "PAYMENT_PENDING";
      request.statusHistory.push({ status: request.status, at: now, by: actorName });
      if (request.status === "PAYMENT_PENDING") {
        logCrvsAudit(db, actorName, "generated billing reference", "crvs.certificate.payment", request.payment.billingReference!, `For ${request.applicationReference}.`);
      }
    } else {
      assertTransitionCertificateRequest(request.status, "MANUAL_REVIEW");
      request.status = "MANUAL_REVIEW";
      request.statusHistory.push({ status: "MANUAL_REVIEW", at: now, by: "System", note: verdict.reasons.join(" ") });
    }

    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "submitted request", "crvs.certificate", request.applicationReference, `Now ${request.status}.`);
    result = request;
    return db;
  });
  return result!;
};

export const demoSimulatePaymentSuccess = (id: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  let shouldIssue = false;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "PAID");
    const now = new Date().toISOString();
    request.status = "PAID";
    request.payment.status = "PAID";
    request.payment.paidAt = now;
    request.payment.method = request.payment.method || "Demo card ending 4242";
    request.payment.receiptReference = request.payment.receiptReference || nextReceiptReference(db);
    request.statusHistory.push({ status: "PAID", at: now, by: actorName });
    logCrvsAudit(db, actorName, "payment completed", "crvs.certificate.payment", request.applicationReference, `Billing reference ${request.payment.billingReference || "—"}.`);

    if (isReadyForAutomaticApproval(request) && db.crvsCertificateConfig.automaticIssuanceEnabled) {
      assertTransitionCertificateRequest(request.status, "APPROVED");
      request.status = "APPROVED";
      request.approvedAt = now;
      request.statusHistory.push({ status: "APPROVED", at: now, by: "System" });
      logCrvsAudit(db, "System", "auto-approved request", "crvs.certificate", request.applicationReference, "Eligible request auto-approved after payment.");
      shouldIssue = true;
    }

    request.updatedAt = now;
    request.version += 1;
    result = request;
    return db;
  });
  if (shouldIssue) {
    return demoIssueCertificate(result!.id, { id: "system", name: "System" }, "Automated issuance");
  }
  return result!;
};

export const demoSimulatePaymentFailure = (
  id: string,
  actorName: string,
  reason = "Demo payment simulator returned a declined transaction."
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "PAYMENT_FAILED");
    const now = new Date().toISOString();
    request.status = "PAYMENT_FAILED";
    request.payment.status = "FAILED";
    request.payment.failureReason = reason;
    request.statusHistory.push({ status: "PAYMENT_FAILED", at: now, by: actorName, note: reason });
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "payment failed", "crvs.certificate.payment", request.applicationReference, reason);
    result = request;
    return db;
  });
  return result!;
};

export const demoRetryPayment = (id: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "PAYMENT_PENDING");
    const now = new Date().toISOString();
    request.status = "PAYMENT_PENDING";
    request.payment.status = "PENDING";
    request.payment.failureReason = undefined;
    request.statusHistory.push({ status: "PAYMENT_PENDING", at: now, by: actorName });
    request.updatedAt = now;
    request.version += 1;
    result = request;
    return db;
  });
  return result!;
};

export type FeeWaiverInput = { category: string; reason: string; note?: string };

export const demoWaiveFee = (id: string, input: FeeWaiverInput, actor: ActorReference): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    if (!["PAYMENT_PENDING", "PAYMENT_FAILED", "MANUAL_REVIEW"].includes(request.status)) {
      throw new Error("A fee can only be waived while payment is outstanding.");
    }
    const now = new Date().toISOString();
    request.payment.status = "WAIVED";
    request.payment.waivedReason = input.reason;
    request.payment.waivedCategory = input.category;
    request.payment.waivedBy = actor;
    request.payment.waivedAt = now;
    request.payment.failureReason = undefined;
    assertTransitionCertificateRequest(request.status, "PAID");
    request.status = "PAID";
    request.statusHistory.push({ status: "PAID", at: now, by: actor.name, note: `Fee waived: ${input.reason}` });
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actor.name, "waived fee", "crvs.certificate.payment", request.applicationReference, `${input.category}: ${input.reason}`);
    result = request;
    return db;
  });
  return result!;
};

// ---------------------------------------------------------------------------
// Manual review

export const demoStartCertificateReview = (id: string, actor: ActorReference): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    if (request.status !== "MANUAL_REVIEW") throw new Error("Only requests in manual review can be started.");
    if (request.assignedRegistrar && request.assignedRegistrar.id !== actor.id) {
      throw new Error(`This request is already being reviewed by ${request.assignedRegistrar.name}.`);
    }
    request.assignedRegistrar = actor;
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    logCrvsAudit(db, actor.name, "started review", "crvs.certificate", request.applicationReference, "Started review — request locked to this reviewer.");
    result = request;
    return db;
  });
  return result!;
};

export type InformationRequestInput = { note: string; evidence?: string; dueDate?: string };

export const demoRequestCertificateInformation = (
  id: string,
  input: InformationRequestInput,
  actorName: string
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    const now = new Date().toISOString();
    request.informationRequested = { ...input, at: now, by: actorName };
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "requested more information", "crvs.certificate", request.applicationReference, input.note);
    result = request;
    return db;
  });
  return result!;
};

export type HoldInput = { reason: string; reviewDate?: string; note?: string };

export const demoHoldCertificateRequest = (id: string, input: HoldInput, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    request.holdReason = input.reason;
    request.holdReviewDate = input.reviewDate;
    request.holdNote = input.note;
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    logCrvsAudit(db, actorName, "placed request on hold", "crvs.certificate", request.applicationReference, input.reason);
    result = request;
    return db;
  });
  return result!;
};

export const demoReassignCertificateRequest = (
  id: string,
  assignee: ActorReference,
  target: "OFFICER" | "REGISTRAR" | "SUPERVISOR",
  reason: string,
  actorName: string
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    if (target === "OFFICER") request.assignedOfficer = assignee;
    else if (target === "REGISTRAR") request.assignedRegistrar = assignee;
    else request.assignedSupervisor = assignee;
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    logCrvsAudit(db, actorName, "reassigned request", "crvs.certificate", request.applicationReference, `Reassigned to ${assignee.name}: ${reason}`);
    result = request;
    return db;
  });
  return result!;
};

export const demoApproveCertificateRequest = (id: string, actor: ActorReference): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    const { allowed, reasons } = canApproveCertificateRequest(actor.id, request);
    if (!allowed) throw new Error(`Cannot approve this request: ${reasons.join(" ")}`);
    if (request.payment.status !== "PAID" && request.payment.status !== "WAIVED" && request.payment.status !== "NOT_REQUIRED") {
      throw new Error("Payment must be completed or waived before this request can be approved.");
    }
    assertTransitionCertificateRequest(request.status, "APPROVED");
    const now = new Date().toISOString();
    request.status = "APPROVED";
    request.approvedAt = now;
    request.updatedAt = now;
    request.version += 1;
    request.statusHistory.push({ status: "APPROVED", at: now, by: actor.name });
    logCrvsAudit(db, actor.name, "approved certificate request", "crvs.certificate", request.applicationReference, "Approved for issuance.");
    result = request;
    return db;
  });
  return demoIssueCertificate(result!.id, actor, "Civil Registrar");
};

export type CertificateRejectionInput = { reason: string; explanation: string; applicantNotified: boolean };

export const demoRejectCertificateRequest = (
  id: string,
  input: CertificateRejectionInput,
  actor: ActorReference
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, id);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "REJECTED");
    const now = new Date().toISOString();
    request.status = "REJECTED";
    request.rejectionReason = input;
    request.updatedAt = now;
    request.version += 1;
    request.statusHistory.push({ status: "REJECTED", at: now, by: actor.name, note: input.reason });
    logCrvsAudit(db, actor.name, "rejected certificate request", "crvs.certificate", request.applicationReference, input.reason);
    result = request;
    return db;
  });
  return result!;
};

// ---------------------------------------------------------------------------
// Issuance

/** Idempotent — repeated calls for a request that already has a certificateId
 * simply return the existing state rather than issuing a duplicate (spec
 * §41 "idempotency"). */
export const demoIssueCertificate = (
  requestId: string,
  actor: ActorReference,
  signerRole = "Civil Registrar"
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, requestId);
    if (!request) throw new NotFoundError("Certificate request");

    if (request.certificateId) {
      result = request;
      return db;
    }

    const now = new Date().toISOString();
    if (request.status === "APPROVED") {
      assertTransitionCertificateRequest(request.status, "ISSUING");
      request.status = "ISSUING";
      request.statusHistory.push({ status: "ISSUING", at: now, by: actor.name });
    }

    const registrationCase = db.crvsRegistrations.find((c) => c.id === request.subject.birthRecordId);
    if (!registrationCase) throw new Error("The underlying birth record could not be found.");
    const foundationalIdentity = db.crvsFoundationalIdentities.find((f) => f.id === request.subject.foundationalIdentityId);

    const certificateNumber = nextCertificateNumber(db);
    const token = nextVerificationToken(db);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const digest = buildCertificateDigest({
      certificateNumber,
      birthRecordNumber: request.subject.birthRecordNumber,
      issuedAt: now,
      subjectLastName: request.subject.lastName,
      templateVersion: db.crvsCertificateConfig.templateVersion,
    });

    const certificate: DemoBirthCertificate = {
      id: nextId("CERT"),
      certificateNumber,
      requestId: request.id,
      birthRecordId: registrationCase.id,
      birthRecordNumber: registrationCase.officialBirthRecordNumber || request.subject.birthRecordNumber,
      foundationalIdentityId: foundationalIdentity?.id,
      ninMasked: request.subject.ninMasked,
      status: "ACTIVE",
      issuedAt: now,
      issuedBy: actor,
      issuingAuthority: db.crvsCertificateConfig.issuingAuthorityLabel,
      subject: {
        firstName: registrationCase.child.firstName,
        middleName: registrationCase.child.middleName,
        lastName: registrationCase.child.lastName,
        sex: registrationCase.child.sex,
        dateOfBirth: registrationCase.child.dateOfBirth,
        placeOfBirth: registrationCase.placeOfBirth,
      },
      parentSummary: {
        motherName: `${registrationCase.mother.firstName} ${registrationCase.mother.lastName}`,
        fatherName: registrationCase.father.firstName
          ? `${registrationCase.father.firstName} ${registrationCase.father.lastName}`
          : undefined,
      },
      verification: {
        publicVerificationToken: token,
        verificationCode,
        qrPayload: buildVerificationQrPayload(token),
      },
      signature: {
        mode: "DEMO_SIMULATED",
        signedAt: now,
        signerName: actor.name,
        signerRole,
        digest,
        notice: "Demo signature — not legally valid",
      },
      document: {
        fileName: `${certificateNumber}.pdf`,
        mimeType: "application/pdf",
        generatedAt: now,
        templateVersion: db.crvsCertificateConfig.templateVersion,
        demoWatermark: true,
      },
      download: {
        accessToken: nextDownloadToken(),
        accessTokenExpiresAt: addHoursIso(now, db.crvsCertificateConfig.downloadLinkExpiryHours),
      },
      downloadCount: 0,
      createdAt: now,
      version: 1,
    };
    db.crvsCertificates.unshift(certificate);

    // A replacement request's target certificate is only superseded once
    // the replacement is actually issued — not the moment replacement is
    // requested — so a certificate is never left in limbo if payment for
    // the replacement is still outstanding (spec §34).
    if (request.replacementIndicator && request.replacedCertificateNumber) {
      const oldCertificate = db.crvsCertificates.find(
        (c) => c.certificateNumber === request.replacedCertificateNumber && c.status === "ACTIVE"
      );
      if (oldCertificate) {
        assertTransitionCertificate(oldCertificate.status, "SUPERSEDED");
        oldCertificate.status = "SUPERSEDED";
        oldCertificate.supersededByCertificateId = certificate.id;
        oldCertificate.version += 1;
        certificate.previousCertificateId = oldCertificate.id;
        logCrvsAudit(db, actor.name, "superseded by replacement", "crvs.certificate", oldCertificate.certificateNumber, `Superseded by ${certificate.certificateNumber}.`);
      }
    }

    assertTransitionCertificateRequest(request.status, "ISSUED");
    request.status = "ISSUED";
    request.certificateId = certificate.id;
    request.issuedAt = now;
    request.statusHistory.push({ status: "ISSUED", at: now, by: actor.name });
    logCrvsAudit(db, actor.name, "issued certificate", "crvs.certificate", request.applicationReference, `${certificateNumber} issued.`);
    logCrvsAudit(db, actor.name, "generated signature metadata", "crvs.certificate", certificateNumber, "Demo signature metadata generated.");
    logCrvsAudit(db, actor.name, "generated verification token", "crvs.certificate.verification", certificateNumber, "QR verification token generated.");

    if (request.delivery.method === "SECURE_DOWNLOAD") {
      request.delivery.status = "AVAILABLE_FOR_DOWNLOAD";
      request.delivery.attempts.push({ at: now, outcome: "SUCCESS" });
      request.delivery.lastAttemptAt = now;
      assertTransitionCertificateRequest(request.status, "DELIVERED");
      request.status = "DELIVERED";
      request.deliveredAt = now;
      request.statusHistory.push({ status: "DELIVERED", at: now, by: "System" });
    } else {
      request.delivery.status = "PENDING";
      assertTransitionCertificateRequest(request.status, "DELIVERY_PENDING");
      request.status = "DELIVERY_PENDING";
      request.statusHistory.push({ status: "DELIVERY_PENDING", at: now, by: "System" });
    }

    request.updatedAt = now;
    request.version += 1;
    result = request;
    return db;
  });
  return result!;
};

// ---------------------------------------------------------------------------
// Delivery

const DELIVERY_SUCCESS_RATE = 0.7;

export const demoSimulateDelivery = (requestId: string, actorName: string): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, requestId);
    if (!request) throw new NotFoundError("Certificate request");
    const now = new Date().toISOString();
    const succeeded = Math.random() < DELIVERY_SUCCESS_RATE;
    request.delivery.attempts.push({
      at: now,
      outcome: succeeded ? "SUCCESS" : "FAILED",
      failureReason: succeeded ? undefined : "Demo delivery simulator: recipient unreachable.",
    });
    request.delivery.lastAttemptAt = now;

    if (succeeded) {
      request.delivery.status =
        request.delivery.method === "EMAIL"
          ? "EMAIL_SENT"
          : request.delivery.method === "SMS_LINK"
          ? "SMS_LINK_SENT"
          : "AVAILABLE_FOR_DOWNLOAD";
      assertTransitionCertificateRequest(request.status, "DELIVERED");
      request.status = "DELIVERED";
      request.deliveredAt = now;
      request.statusHistory.push({ status: "DELIVERED", at: now, by: "System" });
      logCrvsAudit(db, actorName, "delivery succeeded", "crvs.certificate.delivery", request.applicationReference, request.delivery.method);
    } else {
      request.delivery.status = "FAILED";
      assertTransitionCertificateRequest(request.status, "DELIVERY_FAILED");
      request.status = "DELIVERY_FAILED";
      request.statusHistory.push({ status: "DELIVERY_FAILED", at: now, by: "System" });
      logCrvsAudit(db, actorName, "delivery failed", "crvs.certificate.delivery", request.applicationReference, "Demo delivery simulator failure.");
    }

    request.updatedAt = now;
    request.version += 1;
    result = request;
    return db;
  });
  return result!;
};

export const demoRetryDelivery = (requestId: string, actorName: string): BirthCertificateRequest => {
  updateDemoData((db) => {
    const request = findReq(db, requestId);
    if (!request) throw new NotFoundError("Certificate request");
    assertTransitionCertificateRequest(request.status, "DELIVERY_PENDING");
    const now = new Date().toISOString();
    request.status = "DELIVERY_PENDING";
    request.delivery.status = "PENDING";
    request.statusHistory.push({ status: "DELIVERY_PENDING", at: now, by: actorName, note: "Retry requested." });
    request.updatedAt = now;
    request.version += 1;
    logCrvsAudit(db, actorName, "retried delivery", "crvs.certificate.delivery", request.applicationReference, "Delivery retry requested.");
    return db;
  });
  return demoSimulateDelivery(requestId, actorName);
};

export const demoChangeDeliveryMethod = (
  requestId: string,
  method: CertificateDeliveryMethod,
  actorName: string
): BirthCertificateRequest => {
  let result: BirthCertificateRequest | undefined;
  updateDemoData((db) => {
    const request = findReq(db, requestId);
    if (!request) throw new NotFoundError("Certificate request");
    request.delivery.method = method;
    request.delivery.status = "NOT_STARTED";
    request.delivery.requiresReverification = true;
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    logCrvsAudit(db, actorName, "changed delivery method", "crvs.certificate.delivery", request.applicationReference, `Changed to ${method}.`);
    result = request;
    return db;
  });
  return result!;
};

// ---------------------------------------------------------------------------
// Download & public verification

export type DownloadAccessResult =
  | { outcome: "VALID"; certificate: DemoBirthCertificate }
  | { outcome: "EXPIRED" }
  | { outcome: "REVOKED"; certificate: DemoBirthCertificate }
  | { outcome: "NOT_FOUND" };

export const demoResolveDownloadAccessToken = async (token: string): Promise<DownloadAccessResult> => {
  const db = getDemoData();
  const certificate = db.crvsCertificates.find((c) => c.download.accessToken === token);
  if (!certificate) return demoDelay({ outcome: "NOT_FOUND" });
  if (certificate.status === "REVOKED") return demoDelay({ outcome: "REVOKED", certificate });
  if (new Date(certificate.download.accessTokenExpiresAt).getTime() < Date.now()) {
    return demoDelay({ outcome: "EXPIRED" });
  }
  return demoDelay({ outcome: "VALID", certificate });
};

export const demoRecordCertificateDownload = (certificateId: string, actorName: string): DemoBirthCertificate => {
  let result: DemoBirthCertificate | undefined;
  updateDemoData((db) => {
    const certificate = db.crvsCertificates.find((c) => c.id === certificateId);
    if (!certificate) throw new NotFoundError("Certificate");
    if (certificate.status !== "ACTIVE") throw new Error("This certificate is no longer available for download.");
    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date().toISOString();
    logCrvsAudit(db, actorName, "downloaded certificate", "crvs.certificate", certificate.certificateNumber, "Certificate downloaded.");
    result = certificate;
    return db;
  });
  return result!;
};

export type CertificateVerificationOutcome = "VALID" | "REVOKED" | "SUPERSEDED" | "NOT_FOUND" | "INVALID_CODE";

export type CertificateVerificationResult = {
  outcome: CertificateVerificationOutcome;
  issuingAuthority?: string;
  documentType?: string;
  status?: string;
  issueDate?: string;
  maskedHolderName?: string;
  replacementStatus?: "ORIGINAL" | "SUPERSEDED" | "REPLACEMENT";
};

const maskHolderName = (firstName?: string, lastName?: string) => {
  if (!firstName || !lastName) return "D*** A******";
  return `${firstName.charAt(0)}${"*".repeat(Math.max(firstName.length - 1, 2))} ${lastName.charAt(0)}${"*".repeat(
    Math.max(lastName.length - 1, 2)
  )}`;
};

/** Certificate number + code, or a QR token — never returns full parent
 * details, NIN, address or contact information (spec §30). */
export const demoVerifyCertificate = (input: {
  certificateNumber?: string;
  verificationCode?: string;
  token?: string;
}): CertificateVerificationResult => {
  let outcome: CertificateVerificationOutcome = "NOT_FOUND";
  let payload: CertificateVerificationResult = { outcome: "NOT_FOUND" };

  updateDemoData((db) => {
    let certificate: DemoBirthCertificate | undefined;
    if (input.token) {
      certificate = db.crvsCertificates.find((c) => c.verification.publicVerificationToken === input.token);
    } else if (input.certificateNumber) {
      certificate = db.crvsCertificates.find(
        (c) => c.certificateNumber.toUpperCase() === input.certificateNumber!.trim().toUpperCase()
      );
      if (certificate && input.verificationCode && certificate.verification.verificationCode !== input.verificationCode.trim()) {
        outcome = "INVALID_CODE";
        payload = { outcome: "INVALID_CODE" };
        logCrvsAudit(db, "Public", "verification attempted — invalid code", "crvs.certificate.verification", input.certificateNumber, "Incorrect verification code.");
        return db;
      }
    }

    if (!certificate) {
      outcome = "NOT_FOUND";
      payload = { outcome: "NOT_FOUND" };
      return db;
    }

    outcome = certificate.status === "REVOKED" ? "REVOKED" : certificate.status === "SUPERSEDED" ? "SUPERSEDED" : "VALID";
    payload = {
      outcome,
      issuingAuthority: certificate.issuingAuthority,
      documentType: "Birth certificate",
      status: certificate.status,
      issueDate: certificate.issuedAt,
      maskedHolderName: maskHolderName(certificate.subject.firstName, certificate.subject.lastName),
      replacementStatus: certificate.previousCertificateId
        ? "REPLACEMENT"
        : certificate.supersededByCertificateId
        ? "SUPERSEDED"
        : "ORIGINAL",
    };
    logCrvsAudit(db, "Public", "verified certificate", "crvs.certificate.verification", certificate.certificateNumber, `Result: ${outcome}.`);
    return db;
  });

  return payload;
};

// ---------------------------------------------------------------------------
// Revocation, replacement, reissue

export type RevocationReason =
  | "ISSUED_IN_ERROR"
  | "UNDERLYING_RECORD_INVALIDATED"
  | "SECURITY_COMPROMISE"
  | "REPLACED"
  | "OTHER";

export const demoRevokeCertificate = (
  certificateId: string,
  input: { reason: RevocationReason; note?: string; effectiveDate?: string },
  actor: ActorReference
): DemoBirthCertificate => {
  let result: DemoBirthCertificate | undefined;
  updateDemoData((db) => {
    const certificate = db.crvsCertificates.find((c) => c.id === certificateId);
    if (!certificate) throw new NotFoundError("Certificate");
    assertTransitionCertificate(certificate.status, "REVOKED");
    const now = new Date().toISOString();
    certificate.status = "REVOKED";
    certificate.revokedAt = input.effectiveDate || now;
    certificate.revokedBy = actor;
    certificate.revocationReason = input.reason;
    certificate.revocationNote = input.note;
    certificate.version += 1;
    logCrvsAudit(db, actor.name, "revoked certificate", "crvs.certificate", certificate.certificateNumber, `${input.reason}${input.note ? `: ${input.note}` : ""}`);
    result = certificate;
    return db;
  });
  return result!;
};

export type ReplacementInput = {
  reason: string;
  requiresPayment: boolean;
  deliveryMethod: CertificateDeliveryMethod;
};

export const demoReplaceCertificate = (
  oldCertificateId: string,
  input: ReplacementInput,
  actor: ActorReference
): BirthCertificateRequest => {
  let newRequestId: string | undefined;
  updateDemoData((db) => {
    const oldCertificate = db.crvsCertificates.find((c) => c.id === oldCertificateId);
    if (!oldCertificate) throw new NotFoundError("Certificate");
    const originalRequest = db.crvsCertificateRequests.find((r) => r.id === oldCertificate.requestId);
    if (!originalRequest) throw new NotFoundError("Original certificate request");
    const now = new Date().toISOString();

    // A security-compromise replacement revokes the old certificate right
    // away rather than waiting for the replacement to be issued — every
    // other reason leaves it ACTIVE until the replacement actually exists,
    // at which point demoIssueCertificate() supersedes it atomically (spec
    // §33/§34; this avoids a window where neither certificate is valid if
    // the replacement's payment is still outstanding).
    if (oldCertificate.status === "ACTIVE" && /compromis/i.test(input.reason)) {
      assertTransitionCertificate(oldCertificate.status, "REVOKED");
      oldCertificate.status = "REVOKED";
      oldCertificate.revokedAt = now;
      oldCertificate.revokedBy = actor;
      oldCertificate.revocationReason = "SECURITY_COMPROMISE";
      oldCertificate.revocationNote = input.reason;
      oldCertificate.version += 1;
    }

    const newRequest: BirthCertificateRequest = {
      id: nextId("CERTREQ"),
      applicationReference: nextApplicationReference(db),
      channel: "SYSTEM_REISSUE",
      status: input.requiresPayment ? "PAYMENT_PENDING" : "APPROVED",
      requester: originalRequest.requester,
      subject: originalRequest.subject,
      purpose: "REPLACEMENT",
      replacementIndicator: true,
      replacedCertificateNumber: oldCertificate.certificateNumber,
      eligibility: { status: "ELIGIBLE", checkedAt: now, reasons: [] },
      payment: input.requiresPayment
        ? { status: "PENDING", amount: db.crvsCertificateConfig.fee, currency: db.crvsCertificateConfig.currency, billingReference: nextBillingReference(db) }
        : {
            status: "WAIVED",
            amount: db.crvsCertificateConfig.fee,
            currency: db.crvsCertificateConfig.currency,
            waivedReason: `Replacement: ${input.reason}`,
            waivedCategory: "REPLACEMENT",
            waivedBy: actor,
            waivedAt: now,
          },
      delivery: { method: input.deliveryMethod, status: "NOT_STARTED", attempts: [] },
      assignedSupervisor: actor,
      submittedAt: now,
      approvedAt: input.requiresPayment ? undefined : now,
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
      statusHistory: [
        {
          status: input.requiresPayment ? "PAYMENT_PENDING" : "APPROVED",
          at: now,
          by: actor.name,
          note: `Replacement for ${oldCertificate.certificateNumber}: ${input.reason}`,
        },
      ],
      version: 1,
    };
    db.crvsCertificateRequests.unshift(newRequest);
    logCrvsAudit(db, actor.name, "replaced certificate", "crvs.certificate", oldCertificate.certificateNumber, `Superseded by a new certificate (${newRequest.applicationReference}).`);
    newRequestId = newRequest.id;
    return db;
  });

  if (!newRequestId) throw new Error("Replacement failed.");
  const newRequest = getDemoData().crvsCertificateRequests.find((r) => r.id === newRequestId)!;
  if (newRequest.status === "APPROVED") {
    return demoIssueCertificate(newRequest.id, actor, "CRVS Supervisor");
  }
  return newRequest;
};

export const demoReissueCertificate = (certificateId: string, actor: ActorReference): DemoBirthCertificate => {
  let result: DemoBirthCertificate | undefined;
  updateDemoData((db) => {
    const certificate = db.crvsCertificates.find((c) => c.id === certificateId);
    if (!certificate) throw new NotFoundError("Certificate");
    if (certificate.status !== "ACTIVE") throw new Error("Only an active certificate can be reissued.");
    const now = new Date().toISOString();
    const digest = buildCertificateDigest({
      certificateNumber: certificate.certificateNumber,
      birthRecordNumber: certificate.birthRecordNumber,
      issuedAt: now,
      subjectLastName: certificate.subject.lastName,
      templateVersion: db.crvsCertificateConfig.templateVersion,
    });
    certificate.signature = {
      mode: "DEMO_SIMULATED",
      signedAt: now,
      signerName: actor.name,
      signerRole: "CRVS Supervisor",
      digest,
      notice: "Demo signature — not legally valid",
    };
    certificate.document = { ...certificate.document, generatedAt: now, templateVersion: db.crvsCertificateConfig.templateVersion };
    certificate.version += 1;
    logCrvsAudit(db, actor.name, "reissued certificate document", "crvs.certificate", certificate.certificateNumber, "Document regenerated from the unchanged record.");
    result = certificate;
    return db;
  });
  return result!;
};
