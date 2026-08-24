import { getDemoData } from "../storage/demoStore";
import { DemoApplicationStatus } from "../types";
import { BirthRegistrationStatus, BirthCertificateRequestStatus } from "@/domain/crvs/types";

export const DEMO_TRACKING_REFERENCE = "APP-DEMO-2026-0001";
export const DEMO_TRACKING_CODE = "246810";
export const DEMO_VERIFY_DOCUMENT_NUMBER = "CERT-DEMO-2026-0001";
export const DEMO_VERIFY_CODE = "135790";

const STAGE_LABELS = [
  "Submitted",
  "Under review",
  "Additional information requested",
  "Approved",
  "Completed",
];

const STAGE_INDEX: Record<DemoApplicationStatus, number> = {
  draft: 0,
  submitted: 0,
  pendingReview: 1,
  inProgress: 1,
  awaitingInfo: 2,
  exception: 2,
  approved: 3,
  rejected: 3,
  offlinePending: 1,
  rolledBack: 1,
  completed: 4,
};

const OUTSTANDING_ACTION: Partial<Record<DemoApplicationStatus, string>> = {
  awaitingInfo: "Please provide the requested supporting document.",
  exception: "Your application is being reviewed for a data-quality exception.",
  rejected: "This application was not approved. Contact your service centre for next steps.",
};

export type DemoTrackingResult = {
  applicationType: string;
  status: string;
  submittedAt: string;
  centerName?: string;
  stages: string[];
  currentStageIndex: number;
  outstandingAction?: string;
  nextAppointment?: { date: string; time: string } | null;
};

export const demoTrackApplication = (
  reference: string,
  code: string
): DemoTrackingResult | null => {
  if (
    reference.trim().toUpperCase() !== DEMO_TRACKING_REFERENCE ||
    code.trim() !== DEMO_TRACKING_CODE
  ) {
    return null;
  }

  const db = getDemoData();
  const application = db.applications.find(
    (a) => a.reference === DEMO_TRACKING_REFERENCE
  );
  if (!application) return null;

  const center = db.centers.find((c) => c.id === application.centerId);
  const appointment = db.appointments.find(
    (a) => a.applicationId === application.id && a.status === "scheduled"
  );

  return {
    applicationType: application.type,
    status: application.status,
    submittedAt: application.submittedAt,
    centerName: center?.name,
    stages: STAGE_LABELS,
    currentStageIndex: STAGE_INDEX[application.status],
    outstandingAction: OUTSTANDING_ACTION[application.status],
    nextAppointment: appointment
      ? { date: appointment.date, time: appointment.time }
      : null,
  };
};

// Birth-registration tracking (spec §20). A separate, fixed demo
// reference/code pair from the SDID application tracker above — the public
// /track page tries both lookups against whatever the visitor enters.
export const DEMO_BIRTH_TRACKING_REFERENCE = "BR-DEMO-2026-0002";
export const DEMO_BIRTH_TRACKING_CODE = "135791";

const BIRTH_STAGE_LABELS = [
  "Application submitted",
  "Under review",
  "Correction required",
  "Approved",
  "Birth registered",
  "Identity creation pending",
  "Completed",
];

const BIRTH_STAGE_INDEX: Record<BirthRegistrationStatus, number> = {
  DRAFT: 0,
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  RESUBMITTED: 1,
  LATE_REGISTRATION_REVIEW: 1,
  EXCEPTION_REVIEW: 1,
  CORRECTION_REQUIRED: 2,
  APPROVED: 3,
  REJECTED: 3,
  REGISTERED: 4,
  CANCELLED: 0,
};

const BIRTH_OUTSTANDING_ACTION: Partial<Record<BirthRegistrationStatus, string>> = {
  CORRECTION_REQUIRED: "The registration office has requested a correction. Please contact them for details.",
  REJECTED: "This registration was not approved. Contact your registration office for next steps.",
};

export type DemoBirthTrackingResult = {
  reference: string;
  status: string;
  submittedAt?: string;
  processingOffice?: string;
  stages: string[];
  currentStageIndex: number;
  outstandingAction?: string;
  identityCreationComplete: boolean;
};

// Only restricted, safe-for-public fields are ever returned here — no child
// record, no parent identity numbers, no evidence, no internal review notes,
// no staff identities, no audit logs (spec §20).
export const demoTrackBirthRegistration = (
  reference: string,
  code: string
): DemoBirthTrackingResult | null => {
  if (
    reference.trim().toUpperCase() !== DEMO_BIRTH_TRACKING_REFERENCE ||
    code.trim() !== DEMO_BIRTH_TRACKING_CODE
  ) {
    return null;
  }

  const db = getDemoData();
  const registrationCase = db.crvsRegistrations.find(
    (c) => c.reference === DEMO_BIRTH_TRACKING_REFERENCE
  );
  if (!registrationCase) return null;

  let stageIndex = BIRTH_STAGE_INDEX[registrationCase.status];
  const identityCreationComplete = registrationCase.sdid.status === "IDENTITY_CREATED";
  if (registrationCase.status === "REGISTERED") {
    stageIndex = identityCreationComplete ? 6 : 5;
  }

  return {
    reference: registrationCase.reference,
    status: registrationCase.status,
    submittedAt: registrationCase.submittedAt,
    processingOffice: registrationCase.processingOfficeName,
    stages: BIRTH_STAGE_LABELS,
    currentStageIndex: stageIndex,
    outstandingAction: BIRTH_OUTSTANDING_ACTION[registrationCase.status],
    identityCreationComplete,
  };
};

export type DemoVerificationResult = {
  valid: boolean;
  documentType: string;
  issuingAuthority: string;
  issueDate: string;
  status: string;
  maskedHolderName: string;
};

const maskName = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${"*".repeat(Math.max(firstName.length - 1, 2))} ${lastName.charAt(0)}${"*".repeat(
    Math.max(lastName.length - 1, 2)
  )}`;

// Birth-certificate request tracking (spec §38) — a third fallback lookup
// alongside the SDID application tracker and birth-registration tracker
// above. Only restricted, safe-for-public fields are ever returned: no
// requester identity, no internal review notes, no payment method/card data.
export const DEMO_CERTIFICATE_TRACKING_REFERENCE = "CERTREQ-DEMO-2026-0004";
export const DEMO_CERTIFICATE_TRACKING_CODE = "246812";

const CERT_STAGE_LABELS = [
  "Request submitted",
  "Identity verified",
  "Payment pending",
  "Payment received",
  "Under review",
  "Approved",
  "Certificate issued",
  "Available for download",
  "Delivered",
];

const CERT_STAGE_INDEX: Record<BirthCertificateRequestStatus, number> = {
  DRAFT: 0,
  IDENTITY_VERIFICATION_REQUIRED: 0,
  RECORD_LOOKUP_REQUIRED: 1,
  RECORD_NOT_FOUND: 1,
  ELIGIBILITY_CHECK: 1,
  MANUAL_REVIEW: 4,
  PAYMENT_PENDING: 2,
  PAYMENT_FAILED: 2,
  PAID: 3,
  APPROVED: 5,
  REJECTED: 5,
  ISSUING: 6,
  ISSUED: 6,
  DELIVERY_PENDING: 7,
  DELIVERY_FAILED: 7,
  DELIVERED: 8,
  CANCELLED: 0,
};

const CERT_OUTSTANDING_ACTION: Partial<Record<BirthCertificateRequestStatus, string>> = {
  RECORD_NOT_FOUND: "No eligible birth record was found. You can search again or contact your registration office.",
  PAYMENT_FAILED: "The last payment attempt failed. Please retry payment.",
  MANUAL_REVIEW: "Your request needs manual review before it can proceed.",
  REJECTED: "This request was not approved. Contact your registration office for next steps.",
  DELIVERY_FAILED: "The last delivery attempt failed. Delivery can be retried.",
};

export type DemoCertificateTrackingResult = {
  reference: string;
  status: string;
  submittedAt?: string;
  stages: string[];
  currentStageIndex: number;
  outstandingAction?: string;
};

export const demoTrackCertificateRequest = (
  reference: string,
  code: string
): DemoCertificateTrackingResult | null => {
  if (
    reference.trim().toUpperCase() !== DEMO_CERTIFICATE_TRACKING_REFERENCE ||
    code.trim() !== DEMO_CERTIFICATE_TRACKING_CODE
  ) {
    return null;
  }

  const db = getDemoData();
  const request = db.crvsCertificateRequests.find((r) => r.applicationReference === DEMO_CERTIFICATE_TRACKING_REFERENCE);
  if (!request) return null;

  return {
    reference: request.applicationReference,
    status: request.status,
    submittedAt: request.submittedAt,
    stages: CERT_STAGE_LABELS,
    currentStageIndex: CERT_STAGE_INDEX[request.status],
    outstandingAction: CERT_OUTSTANDING_ACTION[request.status],
  };
};

export const demoVerifyDocument = (
  documentNumber: string,
  code: string
): DemoVerificationResult | null => {
  if (
    documentNumber.trim().toUpperCase() !== DEMO_VERIFY_DOCUMENT_NUMBER ||
    code.trim() !== DEMO_VERIFY_CODE
  ) {
    return null;
  }

  const db = getDemoData();
  const application = db.applications.find(
    (a) => a.reference === DEMO_TRACKING_REFERENCE
  );
  const applicant = db.applicants.find(
    (a) => a.id === application?.applicantId
  );

  return {
    valid: true,
    documentType: "Birth certificate",
    issuingAuthority: "Civil Registration Authority",
    issueDate: application?.submittedAt || new Date().toISOString(),
    status: "Active",
    maskedHolderName: applicant
      ? maskName(applicant.firstName, applicant.lastName)
      : "D*** A******",
  };
};
