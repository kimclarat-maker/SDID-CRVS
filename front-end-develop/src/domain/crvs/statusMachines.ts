// Centralized transition tables for the three CRVS state machines. Per the
// milestone spec, no component/service may assign a status field directly —
// every write goes through canTransition()/assertTransition() here so illegal
// jumps (e.g. DRAFT straight to REGISTERED) are impossible by construction.
import {
  BirthNotificationStatus,
  BirthRegistrationStatus,
  SdidSyncStatus,
  BirthCertificateRequestStatus,
  BirthCertificateStatus,
  DeathNotificationStatus,
  DeathRegistrationStatus,
  DeathSdidSyncStatus,
} from "./types";

const NOTIFICATION_TRANSITIONS: Record<BirthNotificationStatus, BirthNotificationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["RETURNED", "ACCEPTED"],
  RETURNED: ["SUBMITTED"],
  ACCEPTED: [],
  CANCELLED: [],
};

const REGISTRATION_TRANSITIONS: Record<BirthRegistrationStatus, BirthRegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "LATE_REGISTRATION_REVIEW", "EXCEPTION_REVIEW"],
  UNDER_REVIEW: ["CORRECTION_REQUIRED", "APPROVED", "REJECTED", "EXCEPTION_REVIEW"],
  CORRECTION_REQUIRED: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  LATE_REGISTRATION_REVIEW: ["UNDER_REVIEW", "EXCEPTION_REVIEW", "CORRECTION_REQUIRED"],
  EXCEPTION_REVIEW: ["UNDER_REVIEW", "LATE_REGISTRATION_REVIEW", "REJECTED"],
  APPROVED: ["REGISTERED"],
  REJECTED: [],
  REGISTERED: [],
  CANCELLED: [],
};

const SYNC_TRANSITIONS: Record<SdidSyncStatus, SdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_CREATED", "FAILED"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_CREATED: [],
};

export class IllegalTransitionError extends Error {
  constructor(machine: string, from: string, to: string) {
    super(`Illegal ${machine} transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export function canTransitionNotification(
  from: BirthNotificationStatus,
  to: BirthNotificationStatus
): boolean {
  return NOTIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionNotification(
  from: BirthNotificationStatus,
  to: BirthNotificationStatus
): void {
  if (!canTransitionNotification(from, to)) {
    throw new IllegalTransitionError("notification", from, to);
  }
}

export function canTransitionRegistration(
  from: BirthRegistrationStatus,
  to: BirthRegistrationStatus
): boolean {
  return REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionRegistration(
  from: BirthRegistrationStatus,
  to: BirthRegistrationStatus
): void {
  if (!canTransitionRegistration(from, to)) {
    throw new IllegalTransitionError("registration", from, to);
  }
}

export function canTransitionSync(from: SdidSyncStatus, to: SdidSyncStatus): boolean {
  return SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionSync(from: SdidSyncStatus, to: SdidSyncStatus): void {
  if (!canTransitionSync(from, to)) {
    throw new IllegalTransitionError("sync", from, to);
  }
}

export const NOTIFICATION_STATUS_LABELS: Record<BirthNotificationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  RETURNED: "Returned for correction",
  ACCEPTED: "Accepted",
  CANCELLED: "Cancelled",
};

export const REGISTRATION_STATUS_LABELS: Record<BirthRegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  LATE_REGISTRATION_REVIEW: "Late registration review",
  EXCEPTION_REVIEW: "Exception review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGISTERED: "Registered",
  CANCELLED: "Cancelled",
};

export const SYNC_STATUS_LABELS: Record<SdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_CREATED: "Identity created",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

// The status-timeline stages shown on the case-details page (spec §11) — only
// entries the case has actually reached (or is eligible to reach) are shown.
export const REGISTRATION_TIMELINE_ORDER: BirthRegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "APPROVED",
  "REGISTERED",
];

// Birth-certificate request lifecycle (spec §5/§20/§22). "Put on hold" /
// "request more information" mutate fields on the request without changing
// status, so they deliberately have no entry here — only true state changes
// go through assertTransitionCertificateRequest().
const CERTIFICATE_REQUEST_TRANSITIONS: Record<BirthCertificateRequestStatus, BirthCertificateRequestStatus[]> = {
  DRAFT: ["IDENTITY_VERIFICATION_REQUIRED", "RECORD_LOOKUP_REQUIRED", "CANCELLED"],
  IDENTITY_VERIFICATION_REQUIRED: ["RECORD_LOOKUP_REQUIRED", "MANUAL_REVIEW", "CANCELLED"],
  RECORD_LOOKUP_REQUIRED: ["ELIGIBILITY_CHECK", "RECORD_NOT_FOUND", "MANUAL_REVIEW", "CANCELLED"],
  RECORD_NOT_FOUND: ["RECORD_LOOKUP_REQUIRED", "CANCELLED"],
  ELIGIBILITY_CHECK: ["PAYMENT_PENDING", "MANUAL_REVIEW", "CANCELLED"],
  MANUAL_REVIEW: ["APPROVED", "REJECTED", "PAYMENT_PENDING", "PAID", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PAYMENT_PENDING", "PAID", "CANCELLED"],
  PAID: ["APPROVED", "MANUAL_REVIEW"],
  APPROVED: ["ISSUING"],
  REJECTED: [],
  ISSUING: ["ISSUED"],
  ISSUED: ["DELIVERY_PENDING", "DELIVERED"],
  DELIVERY_PENDING: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERY_FAILED: ["DELIVERY_PENDING", "DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionCertificateRequest(
  from: BirthCertificateRequestStatus,
  to: BirthCertificateRequestStatus
): boolean {
  return CERTIFICATE_REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionCertificateRequest(
  from: BirthCertificateRequestStatus,
  to: BirthCertificateRequestStatus
): void {
  if (!canTransitionCertificateRequest(from, to)) {
    throw new IllegalTransitionError("certificate request", from, to);
  }
}

export const CERTIFICATE_REQUEST_STATUS_LABELS: Record<BirthCertificateRequestStatus, string> = {
  DRAFT: "Draft",
  IDENTITY_VERIFICATION_REQUIRED: "Identity verification required",
  RECORD_LOOKUP_REQUIRED: "Birth-record lookup required",
  RECORD_NOT_FOUND: "Record not found",
  ELIGIBILITY_CHECK: "Checking eligibility",
  MANUAL_REVIEW: "Manual review",
  PAYMENT_PENDING: "Payment pending",
  PAYMENT_FAILED: "Payment failed",
  PAID: "Paid",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ISSUING: "Issuing certificate",
  ISSUED: "Certificate issued",
  DELIVERY_PENDING: "Delivery pending",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Delivery failed",
  CANCELLED: "Cancelled",
};

export const CERTIFICATE_REQUEST_TIMELINE_ORDER: BirthCertificateRequestStatus[] = [
  "DRAFT",
  "IDENTITY_VERIFICATION_REQUIRED",
  "RECORD_LOOKUP_REQUIRED",
  "ELIGIBILITY_CHECK",
  "PAYMENT_PENDING",
  "PAID",
  "APPROVED",
  "ISSUING",
  "ISSUED",
  "DELIVERY_PENDING",
  "DELIVERED",
];

// Issued-certificate lifecycle (spec §6/§33/§34) — deliberately separate from
// the request status above (spec §6: "do not mix request status, payment
// status and certificate status").
const CERTIFICATE_TRANSITIONS: Record<BirthCertificateStatus, BirthCertificateStatus[]> = {
  ACTIVE: ["REVOKED", "SUPERSEDED"],
  REVOKED: [],
  SUPERSEDED: [],
};

export function canTransitionCertificate(from: BirthCertificateStatus, to: BirthCertificateStatus): boolean {
  return CERTIFICATE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionCertificate(from: BirthCertificateStatus, to: BirthCertificateStatus): void {
  if (!canTransitionCertificate(from, to)) {
    throw new IllegalTransitionError("certificate", from, to);
  }
}

export const CERTIFICATE_STATUS_LABELS: Record<BirthCertificateStatus, string> = {
  ACTIVE: "Active",
  REVOKED: "Revoked",
  SUPERSEDED: "Superseded",
};

// ---------------------------------------------------------------------------
// Death-notification / death-registration / death-SDID-sync state machines.
// Same "no direct status assignment" rule as the birth machines above — every
// write goes through canTransitionDeath*()/assertTransitionDeath*().

const DEATH_NOTIFICATION_TRANSITIONS: Record<DeathNotificationStatus, DeathNotificationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["RETURNED", "ACCEPTED"],
  RETURNED: ["SUBMITTED"],
  ACCEPTED: [],
  CANCELLED: [],
};

// The three exception-style statuses (late/medico-legal/unidentified) are
// reachable directly from SUBMITTED (the pathway is already known when the
// case is created) as well as from UNDER_REVIEW (a reviewer discovers the
// case needs exception routing partway through), and each routes back to
// UNDER_REVIEW, CORRECTION_REQUIRED, or REJECTED once resolved — mirrors
// birth's LATE_REGISTRATION_REVIEW/EXCEPTION_REVIEW shape, split three ways.
const DEATH_REGISTRATION_TRANSITIONS: Record<DeathRegistrationStatus, DeathRegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: [
    "UNDER_REVIEW",
    "LATE_REGISTRATION_REVIEW",
    "MEDICO_LEGAL_REVIEW",
    "UNIDENTIFIED_PERSON_REVIEW",
  ],
  UNDER_REVIEW: [
    "CORRECTION_REQUIRED",
    "APPROVED",
    "REJECTED",
    "LATE_REGISTRATION_REVIEW",
    "MEDICO_LEGAL_REVIEW",
    "UNIDENTIFIED_PERSON_REVIEW",
  ],
  CORRECTION_REQUIRED: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  LATE_REGISTRATION_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "REJECTED"],
  MEDICO_LEGAL_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "REJECTED"],
  UNIDENTIFIED_PERSON_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "REJECTED"],
  APPROVED: ["REGISTERED"],
  REJECTED: [],
  REGISTERED: [],
  CANCELLED: [],
};

const DEATH_SYNC_TRANSITIONS: Record<DeathSdidSyncStatus, DeathSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_MARKED_DECEASED", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_MARKED_DECEASED: [],
};

export function canTransitionDeathNotification(
  from: DeathNotificationStatus,
  to: DeathNotificationStatus
): boolean {
  return DEATH_NOTIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDeathNotification(
  from: DeathNotificationStatus,
  to: DeathNotificationStatus
): void {
  if (!canTransitionDeathNotification(from, to)) {
    throw new IllegalTransitionError("death notification", from, to);
  }
}

export function canTransitionDeathRegistration(
  from: DeathRegistrationStatus,
  to: DeathRegistrationStatus
): boolean {
  return DEATH_REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDeathRegistration(
  from: DeathRegistrationStatus,
  to: DeathRegistrationStatus
): void {
  if (!canTransitionDeathRegistration(from, to)) {
    throw new IllegalTransitionError("death registration", from, to);
  }
}

export function canTransitionDeathSync(from: DeathSdidSyncStatus, to: DeathSdidSyncStatus): boolean {
  return DEATH_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDeathSync(from: DeathSdidSyncStatus, to: DeathSdidSyncStatus): void {
  if (!canTransitionDeathSync(from, to)) {
    throw new IllegalTransitionError("death sync", from, to);
  }
}

export const DEATH_NOTIFICATION_STATUS_LABELS: Record<DeathNotificationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  RETURNED: "Returned for correction",
  ACCEPTED: "Accepted",
  CANCELLED: "Cancelled",
};

export const DEATH_REGISTRATION_STATUS_LABELS: Record<DeathRegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  LATE_REGISTRATION_REVIEW: "Late registration review",
  MEDICO_LEGAL_REVIEW: "Medico-legal review",
  UNIDENTIFIED_PERSON_REVIEW: "Unidentified-person review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGISTERED: "Registered",
  CANCELLED: "Cancelled",
};

export const DEATH_SYNC_STATUS_LABELS: Record<DeathSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_MARKED_DECEASED: "Identity marked deceased",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const DEATH_REGISTRATION_TIMELINE_ORDER: DeathRegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "APPROVED",
  "REGISTERED",
];
