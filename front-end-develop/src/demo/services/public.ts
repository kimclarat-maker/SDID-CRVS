import { getDemoData } from "../storage/demoStore";
import { DemoApplicationStatus } from "../types";

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
