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
  MarriageApplicationStatus,
  MarriageAppointmentStatus,
  MarriageCeremonyOutcome,
  MarriageSpouseSdidSyncStatus,
  MarriageSdidSyncStatus,
  MarriageObjectionStatus,
  DivorceNotificationStatus,
  DivorceRegistrationStatus,
  JudgmentVerificationStatus,
  DivorceSpouseSdidSyncStatus,
  DivorceSdidSyncStatus,
  AnnulmentNotificationStatus,
  AnnulmentRegistrationStatus,
  AnnulmentDecisionVerificationStatus,
  AnnulmentPartySdidSyncStatus,
  AnnulmentSdidSyncStatus,
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

// ---------------------------------------------------------------------------
// Marriage-application / marriage-appointment / marriage-ceremony /
// marriage-SDID-sync / marriage-objection state machines. Same "no direct
// status assignment" rule as birth/death — every write goes through
// canTransitionMarriage*()/assertTransitionMarriage*(). Five separate small
// machines rather than one giant enum, mirroring how DeathSdidSyncStatus is
// kept independent of DeathRegistrationStatus — appointment/ceremony/sync
// each have their own lifecycle instead of exploding the application enum
// with composite values.
//
// Modeling notes:
// - CONSENT_DECLINED at the ceremony level maps the application to REJECTED
//   (via rejectionReason.ceremonyConsentDeclined), keeping the application
//   enum at exactly the spec's 17 values rather than adding a dedicated
//   terminal status.
// - NO_SHOW/POSTPONED are reachable from both APPOINTMENT_SCHEDULED (nobody
//   showed at all) and READY_FOR_CEREMONY (check-in was underway but the
//   ceremony still didn't proceed).
// - Rescheduling after NO_SHOW/POSTPONED always creates a fresh
//   MarriageAppointment record rather than reopening the old one, mirroring
//   the immutable-attempt approach used for ceremony/registration events.
// - An open MarriageObjection sits alongside ELIGIBILITY_REVIEW/
//   CORRECTION_REQUIRED as a blocking side-record checked by
//   canApproveMarriageCase() — it does not get its own top-level
//   application status branch, unlike death's three exception-review
//   branches.

const MARRIAGE_APPLICATION_TRANSITIONS: Record<MarriageApplicationStatus, MarriageApplicationStatus[]> = {
  DRAFT: ["PARTNER_VERIFICATION_REQUIRED", "SUBMITTED", "CANCELLED"],
  PARTNER_VERIFICATION_REQUIRED: ["SUBMITTED", "REJECTED", "CANCELLED"],
  SUBMITTED: ["ELIGIBILITY_REVIEW", "CANCELLED"],
  ELIGIBILITY_REVIEW: ["CORRECTION_REQUIRED", "PAYMENT_PENDING", "APPROVED", "REJECTED", "CANCELLED"],
  CORRECTION_REQUIRED: ["RESUBMITTED", "CANCELLED"],
  RESUBMITTED: ["ELIGIBILITY_REVIEW"],
  PAYMENT_PENDING: ["PAID", "CANCELLED"],
  PAID: ["APPROVED", "REJECTED"],
  APPROVED: ["APPOINTMENT_SCHEDULED", "CANCELLED"],
  REJECTED: [],
  // REJECTED is reachable directly from APPOINTMENT_SCHEDULED as well as
  // READY_FOR_CEREMONY — consent can be declined as soon as both applicants
  // are physically present, even before every witness has finished
  // checking in (see crvsMarriageCeremony.ts's demoRecordMarriageConsent).
  APPOINTMENT_SCHEDULED: ["READY_FOR_CEREMONY", "NO_SHOW", "POSTPONED", "CANCELLED", "REJECTED"],
  READY_FOR_CEREMONY: ["CEREMONY_COMPLETED", "NO_SHOW", "POSTPONED", "REJECTED", "CANCELLED"],
  CEREMONY_COMPLETED: ["REGISTERED"],
  NO_SHOW: ["APPOINTMENT_SCHEDULED", "CANCELLED"],
  POSTPONED: ["APPOINTMENT_SCHEDULED", "CANCELLED"],
  CANCELLED: [],
  REGISTERED: [],
};

const MARRIAGE_APPOINTMENT_TRANSITIONS: Record<MarriageAppointmentStatus, MarriageAppointmentStatus[]> = {
  SCHEDULED: ["RESCHEDULE_REQUESTED", "CANCEL_REQUESTED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  RESCHEDULE_REQUESTED: ["SCHEDULED", "CANCELLED"],
  CANCEL_REQUESTED: ["SCHEDULED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

const MARRIAGE_CEREMONY_TRANSITIONS: Record<MarriageCeremonyOutcome, MarriageCeremonyOutcome[]> = {
  NOT_STARTED: ["COMPLETED", "POSTPONED", "NO_SHOW", "CONSENT_DECLINED", "CANCELLED"],
  COMPLETED: [],
  POSTPONED: [],
  NO_SHOW: [],
  CONSENT_DECLINED: [],
  CANCELLED: [],
};

const MARRIAGE_SPOUSE_SYNC_TRANSITIONS: Record<MarriageSpouseSdidSyncStatus, MarriageSpouseSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_UPDATED", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_UPDATED: [],
};

const MARRIAGE_SYNC_TRANSITIONS: Record<MarriageSdidSyncStatus, MarriageSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"],
  PARTIAL_FAILURE: ["IN_PROGRESS", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  BOTH_IDENTITIES_UPDATED: [],
};

const MARRIAGE_OBJECTION_TRANSITIONS: Record<MarriageObjectionStatus, MarriageObjectionStatus[]> = {
  NONE: ["PENDING"],
  PENDING: ["UPHELD", "DISMISSED", "WITHDRAWN"],
  UPHELD: [],
  DISMISSED: [],
  WITHDRAWN: [],
};

export function canTransitionMarriageApplication(from: MarriageApplicationStatus, to: MarriageApplicationStatus): boolean {
  return MARRIAGE_APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageApplication(from: MarriageApplicationStatus, to: MarriageApplicationStatus): void {
  if (!canTransitionMarriageApplication(from, to)) {
    throw new IllegalTransitionError("marriage application", from, to);
  }
}

export function canTransitionMarriageAppointment(from: MarriageAppointmentStatus, to: MarriageAppointmentStatus): boolean {
  return MARRIAGE_APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageAppointment(from: MarriageAppointmentStatus, to: MarriageAppointmentStatus): void {
  if (!canTransitionMarriageAppointment(from, to)) {
    throw new IllegalTransitionError("marriage appointment", from, to);
  }
}

export function canTransitionMarriageCeremony(from: MarriageCeremonyOutcome, to: MarriageCeremonyOutcome): boolean {
  return MARRIAGE_CEREMONY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageCeremony(from: MarriageCeremonyOutcome, to: MarriageCeremonyOutcome): void {
  if (!canTransitionMarriageCeremony(from, to)) {
    throw new IllegalTransitionError("marriage ceremony", from, to);
  }
}

export function canTransitionMarriageSpouseSync(from: MarriageSpouseSdidSyncStatus, to: MarriageSpouseSdidSyncStatus): boolean {
  return MARRIAGE_SPOUSE_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageSpouseSync(from: MarriageSpouseSdidSyncStatus, to: MarriageSpouseSdidSyncStatus): void {
  if (!canTransitionMarriageSpouseSync(from, to)) {
    throw new IllegalTransitionError("marriage spouse sync", from, to);
  }
}

export function canTransitionMarriageSync(from: MarriageSdidSyncStatus, to: MarriageSdidSyncStatus): boolean {
  return MARRIAGE_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageSync(from: MarriageSdidSyncStatus, to: MarriageSdidSyncStatus): void {
  if (!canTransitionMarriageSync(from, to)) {
    throw new IllegalTransitionError("marriage sync", from, to);
  }
}

export function canTransitionMarriageObjection(from: MarriageObjectionStatus, to: MarriageObjectionStatus): boolean {
  return MARRIAGE_OBJECTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionMarriageObjection(from: MarriageObjectionStatus, to: MarriageObjectionStatus): void {
  if (!canTransitionMarriageObjection(from, to)) {
    throw new IllegalTransitionError("marriage objection", from, to);
  }
}

export const MARRIAGE_APPLICATION_STATUS_LABELS: Record<MarriageApplicationStatus, string> = {
  DRAFT: "Draft",
  PARTNER_VERIFICATION_REQUIRED: "Partner verification required",
  SUBMITTED: "Submitted",
  ELIGIBILITY_REVIEW: "Eligibility review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  APPOINTMENT_SCHEDULED: "Appointment scheduled",
  READY_FOR_CEREMONY: "Ready for ceremony",
  CEREMONY_COMPLETED: "Ceremony completed",
  NO_SHOW: "No-show",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  REGISTERED: "Registered",
};

export const MARRIAGE_APPOINTMENT_STATUS_LABELS: Record<MarriageAppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  RESCHEDULE_REQUESTED: "Reschedule requested",
  CANCEL_REQUESTED: "Cancellation requested",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export const MARRIAGE_CEREMONY_OUTCOME_LABELS: Record<MarriageCeremonyOutcome, string> = {
  NOT_STARTED: "Not started",
  COMPLETED: "Completed",
  POSTPONED: "Postponed",
  NO_SHOW: "No-show",
  CONSENT_DECLINED: "Consent declined",
  CANCELLED: "Cancelled",
};

export const MARRIAGE_SYNC_STATUS_LABELS: Record<MarriageSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  BOTH_IDENTITIES_UPDATED: "Both identities updated",
  PARTIAL_FAILURE: "Partial synchronization failure",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const MARRIAGE_SPOUSE_SYNC_STATUS_LABELS: Record<MarriageSpouseSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_UPDATED: "Identity updated",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const MARRIAGE_OBJECTION_STATUS_LABELS: Record<MarriageObjectionStatus, string> = {
  NONE: "No objection",
  PENDING: "Pending",
  UPHELD: "Upheld",
  DISMISSED: "Dismissed",
  WITHDRAWN: "Withdrawn",
};

export const MARRIAGE_APPLICATION_TIMELINE_ORDER: MarriageApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "ELIGIBILITY_REVIEW",
  "PAYMENT_PENDING",
  "PAID",
  "APPROVED",
  "APPOINTMENT_SCHEDULED",
  "READY_FOR_CEREMONY",
  "CEREMONY_COMPLETED",
  "REGISTERED",
];

/** Pure aggregator: combines both spouses' independent sync sub-statuses
 * into the case-level MarriageSdidSyncStatus (spec §8) — never influenced by
 * one spouse's random outcome affecting the other's. */
export function aggregateMarriageSyncStatus(
  applicant1: MarriageSpouseSdidSyncStatus,
  applicant2: MarriageSpouseSdidSyncStatus
): MarriageSdidSyncStatus {
  if (applicant1 === "IDENTITY_UPDATED" && applicant2 === "IDENTITY_UPDATED") return "BOTH_IDENTITIES_UPDATED";
  if (
    (applicant1 === "IDENTITY_UPDATED" && applicant2 === "FAILED") ||
    (applicant2 === "IDENTITY_UPDATED" && applicant1 === "FAILED")
  ) {
    return "PARTIAL_FAILURE";
  }
  if (applicant1 === "FAILED" && applicant2 === "FAILED") return "FAILED";
  if (applicant1 === "MANUAL_REVIEW" || applicant2 === "MANUAL_REVIEW") return "MANUAL_REVIEW";
  if (applicant1 === "IN_PROGRESS" || applicant2 === "IN_PROGRESS") return "IN_PROGRESS";
  if (applicant1 === "PENDING" || applicant2 === "PENDING") return "PENDING";
  return "NOT_READY";
}

// ---------------------------------------------------------------------------
// Divorce-notification / divorce-registration / divorce-SDID-sync state
// machines. Same "no direct status assignment" rule as every machine above.
//
// Modeling notes:
// - DivorceNotificationStatus mirrors DeathNotificationStatus's shape
//   (RECEIVED here standing in for DRAFT — a court notification always
//   arrives already "submitted" by the mock integration, spec §5A) plus two
//   states death/birth notifications don't need: DUPLICATE (a notification
//   can be flagged a duplicate of an existing case without ever being
//   returned) and the terminal CONVERTED_TO_REGISTRATION.
// - DivorceRegistrationStatus's three review-style branches
//   (JUDGMENT_VERIFICATION, FOREIGN_JUDGMENT_REVIEW, EXCEPTION_REVIEW) mirror
//   DeathRegistrationStatus's LATE_REGISTRATION_REVIEW/MEDICO_LEGAL_REVIEW/
//   UNIDENTIFIED_PERSON_REVIEW three-way split exactly — reachable from
//   SUBMITTED/RESUBMITTED and from UNDER_REVIEW, each routing back to
//   UNDER_REVIEW, CORRECTION_REQUIRED or REJECTED once resolved.
// - No direct DRAFT -> REGISTERED, CORRECTION_REQUIRED -> APPROVED, or any
//   other status-skipping jump is reachable — every path funnels back
//   through UNDER_REVIEW before APPROVED (spec §4 "no user may directly
//   change a registered divorce back to draft" is likewise structurally
//   impossible: REGISTERED has no outgoing transitions at all).

const DIVORCE_NOTIFICATION_TRANSITIONS: Record<DivorceNotificationStatus, DivorceNotificationStatus[]> = {
  RECEIVED: ["VALIDATION_PENDING", "DUPLICATE", "CANCELLED"],
  VALIDATION_PENDING: ["VALIDATED", "RETURNED", "DUPLICATE", "CANCELLED"],
  VALIDATED: ["CONVERTED_TO_REGISTRATION", "CANCELLED"],
  RETURNED: ["VALIDATION_PENDING", "CANCELLED"],
  CONVERTED_TO_REGISTRATION: [],
  DUPLICATE: [],
  CANCELLED: [],
};

const DIVORCE_REGISTRATION_TRANSITIONS: Record<DivorceRegistrationStatus, DivorceRegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "JUDGMENT_VERIFICATION", "FOREIGN_JUDGMENT_REVIEW", "EXCEPTION_REVIEW", "CANCELLED"],
  UNDER_REVIEW: [
    "CORRECTION_REQUIRED",
    "JUDGMENT_VERIFICATION",
    "FOREIGN_JUDGMENT_REVIEW",
    "EXCEPTION_REVIEW",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ],
  CORRECTION_REQUIRED: ["RESUBMITTED", "CANCELLED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  JUDGMENT_VERIFICATION: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "FOREIGN_JUDGMENT_REVIEW", "EXCEPTION_REVIEW", "REJECTED"],
  FOREIGN_JUDGMENT_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "EXCEPTION_REVIEW", "REJECTED"],
  EXCEPTION_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "REJECTED"],
  APPROVED: ["REGISTERED", "CANCELLED"],
  REJECTED: [],
  REGISTERED: [],
  CANCELLED: [],
};

const DIVORCE_JUDGMENT_VERIFICATION_TRANSITIONS: Record<JudgmentVerificationStatus, JudgmentVerificationStatus[]> = {
  NOT_STARTED: ["PENDING"],
  PENDING: ["VERIFIED", "UNVERIFIED", "CONFLICT_FOUND", "MANUAL_REVIEW"],
  UNVERIFIED: ["PENDING", "MANUAL_REVIEW"],
  CONFLICT_FOUND: ["PENDING", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["PENDING"],
  VERIFIED: [],
};

const DIVORCE_SPOUSE_SYNC_TRANSITIONS: Record<DivorceSpouseSdidSyncStatus, DivorceSpouseSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_UPDATED", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_UPDATED: [],
};

const DIVORCE_SYNC_TRANSITIONS: Record<DivorceSdidSyncStatus, DivorceSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"],
  PARTIAL_FAILURE: ["IN_PROGRESS", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  BOTH_IDENTITIES_UPDATED: [],
};

export function canTransitionDivorceNotification(from: DivorceNotificationStatus, to: DivorceNotificationStatus): boolean {
  return DIVORCE_NOTIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDivorceNotification(from: DivorceNotificationStatus, to: DivorceNotificationStatus): void {
  if (!canTransitionDivorceNotification(from, to)) {
    throw new IllegalTransitionError("divorce notification", from, to);
  }
}

export function canTransitionDivorceRegistration(from: DivorceRegistrationStatus, to: DivorceRegistrationStatus): boolean {
  return DIVORCE_REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDivorceRegistration(from: DivorceRegistrationStatus, to: DivorceRegistrationStatus): void {
  if (!canTransitionDivorceRegistration(from, to)) {
    throw new IllegalTransitionError("divorce registration", from, to);
  }
}

export function canTransitionDivorceJudgmentVerification(from: JudgmentVerificationStatus, to: JudgmentVerificationStatus): boolean {
  return DIVORCE_JUDGMENT_VERIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDivorceJudgmentVerification(from: JudgmentVerificationStatus, to: JudgmentVerificationStatus): void {
  if (!canTransitionDivorceJudgmentVerification(from, to)) {
    throw new IllegalTransitionError("divorce judgment verification", from, to);
  }
}

export function canTransitionDivorceSpouseSync(from: DivorceSpouseSdidSyncStatus, to: DivorceSpouseSdidSyncStatus): boolean {
  return DIVORCE_SPOUSE_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDivorceSpouseSync(from: DivorceSpouseSdidSyncStatus, to: DivorceSpouseSdidSyncStatus): void {
  if (!canTransitionDivorceSpouseSync(from, to)) {
    throw new IllegalTransitionError("divorce spouse sync", from, to);
  }
}

export function canTransitionDivorceSync(from: DivorceSdidSyncStatus, to: DivorceSdidSyncStatus): boolean {
  return DIVORCE_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionDivorceSync(from: DivorceSdidSyncStatus, to: DivorceSdidSyncStatus): void {
  if (!canTransitionDivorceSync(from, to)) {
    throw new IllegalTransitionError("divorce sync", from, to);
  }
}

export const DIVORCE_NOTIFICATION_STATUS_LABELS: Record<DivorceNotificationStatus, string> = {
  RECEIVED: "Received",
  VALIDATION_PENDING: "Validation pending",
  VALIDATED: "Validated",
  RETURNED: "Returned",
  CONVERTED_TO_REGISTRATION: "Converted to registration",
  DUPLICATE: "Duplicate",
  CANCELLED: "Cancelled",
};

export const DIVORCE_REGISTRATION_STATUS_LABELS: Record<DivorceRegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  JUDGMENT_VERIFICATION: "Judgment verification",
  FOREIGN_JUDGMENT_REVIEW: "Foreign judgment review",
  EXCEPTION_REVIEW: "Exception review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGISTERED: "Registered",
  CANCELLED: "Cancelled",
};

export const DIVORCE_JUDGMENT_VERIFICATION_STATUS_LABELS: Record<JudgmentVerificationStatus, string> = {
  NOT_STARTED: "Not started",
  PENDING: "Pending",
  VERIFIED: "Verified",
  UNVERIFIED: "Unverified",
  CONFLICT_FOUND: "Conflict found",
  MANUAL_REVIEW: "Manual review",
};

export const DIVORCE_SYNC_STATUS_LABELS: Record<DivorceSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  BOTH_IDENTITIES_UPDATED: "Both identities updated",
  PARTIAL_FAILURE: "Partial synchronization failure",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const DIVORCE_SPOUSE_SYNC_STATUS_LABELS: Record<DivorceSpouseSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_UPDATED: "Identity updated",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const DIVORCE_REGISTRATION_TIMELINE_ORDER: DivorceRegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REGISTERED",
];

/** Pure aggregator: combines both former spouses' independent sync
 * sub-statuses into the case-level DivorceSdidSyncStatus (spec §23) — never
 * lets one spouse's random outcome affect the other's. Identical shape to
 * aggregateMarriageSyncStatus(). */
export function aggregateDivorceSyncStatus(
  spouse1: DivorceSpouseSdidSyncStatus,
  spouse2: DivorceSpouseSdidSyncStatus
): DivorceSdidSyncStatus {
  if (spouse1 === "IDENTITY_UPDATED" && spouse2 === "IDENTITY_UPDATED") return "BOTH_IDENTITIES_UPDATED";
  if ((spouse1 === "IDENTITY_UPDATED" && spouse2 === "FAILED") || (spouse2 === "IDENTITY_UPDATED" && spouse1 === "FAILED")) {
    return "PARTIAL_FAILURE";
  }
  if (spouse1 === "FAILED" && spouse2 === "FAILED") return "FAILED";
  if (spouse1 === "MANUAL_REVIEW" || spouse2 === "MANUAL_REVIEW") return "MANUAL_REVIEW";
  if (spouse1 === "IN_PROGRESS" || spouse2 === "IN_PROGRESS") return "IN_PROGRESS";
  if (spouse1 === "PENDING" || spouse2 === "PENDING") return "PENDING";
  return "NOT_READY";
}

// ---------------------------------------------------------------------------
// Marriage-annulment-notification / annulment-registration / annulment-SDID-
// sync state machines. Same "no direct status assignment" rule as every
// machine above, and the same shape as the divorce block, plus one extra
// review branch: LEGAL_EFFECT_REVIEW (annulment's legal-effect classification
// has no divorce analog — see AnnulmentLegalEffect in types.ts). As with
// divorce, REGISTERED has no outgoing transitions at all, so "no user may
// return a registered annulment directly to draft" is structurally
// impossible, and every path to APPROVED funnels through UNDER_REVIEW.

const ANNULMENT_NOTIFICATION_TRANSITIONS: Record<AnnulmentNotificationStatus, AnnulmentNotificationStatus[]> = {
  RECEIVED: ["VALIDATION_PENDING", "DUPLICATE", "CANCELLED"],
  VALIDATION_PENDING: ["VALIDATED", "RETURNED", "DUPLICATE", "CANCELLED"],
  VALIDATED: ["CONVERTED_TO_REGISTRATION", "CANCELLED"],
  RETURNED: ["VALIDATION_PENDING", "CANCELLED"],
  CONVERTED_TO_REGISTRATION: [],
  DUPLICATE: [],
  CANCELLED: [],
};

const ANNULMENT_REGISTRATION_TRANSITIONS: Record<AnnulmentRegistrationStatus, AnnulmentRegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: [
    "UNDER_REVIEW",
    "DECISION_VERIFICATION",
    "LEGAL_EFFECT_REVIEW",
    "FOREIGN_DECISION_REVIEW",
    "EXCEPTION_REVIEW",
    "CANCELLED",
  ],
  UNDER_REVIEW: [
    "CORRECTION_REQUIRED",
    "DECISION_VERIFICATION",
    "LEGAL_EFFECT_REVIEW",
    "FOREIGN_DECISION_REVIEW",
    "EXCEPTION_REVIEW",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ],
  CORRECTION_REQUIRED: ["RESUBMITTED", "CANCELLED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  DECISION_VERIFICATION: [
    "UNDER_REVIEW",
    "CORRECTION_REQUIRED",
    "LEGAL_EFFECT_REVIEW",
    "FOREIGN_DECISION_REVIEW",
    "EXCEPTION_REVIEW",
    "REJECTED",
  ],
  LEGAL_EFFECT_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "FOREIGN_DECISION_REVIEW", "EXCEPTION_REVIEW", "REJECTED"],
  FOREIGN_DECISION_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "LEGAL_EFFECT_REVIEW", "EXCEPTION_REVIEW", "REJECTED"],
  EXCEPTION_REVIEW: ["UNDER_REVIEW", "CORRECTION_REQUIRED", "REJECTED"],
  APPROVED: ["REGISTERED", "CANCELLED"],
  REJECTED: [],
  REGISTERED: [],
  CANCELLED: [],
};

const ANNULMENT_DECISION_VERIFICATION_TRANSITIONS: Record<AnnulmentDecisionVerificationStatus, AnnulmentDecisionVerificationStatus[]> = {
  NOT_STARTED: ["PENDING"],
  PENDING: ["VERIFIED", "UNVERIFIED", "CONFLICT_FOUND", "MANUAL_REVIEW"],
  UNVERIFIED: ["PENDING", "MANUAL_REVIEW"],
  CONFLICT_FOUND: ["PENDING", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["PENDING"],
  VERIFIED: [],
};

const ANNULMENT_PARTY_SYNC_TRANSITIONS: Record<AnnulmentPartySdidSyncStatus, AnnulmentPartySdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_UPDATED", "FAILED", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_UPDATED: [],
};

const ANNULMENT_SYNC_TRANSITIONS: Record<AnnulmentSdidSyncStatus, AnnulmentSdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"],
  PARTIAL_FAILURE: ["IN_PROGRESS", "MANUAL_REVIEW"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  BOTH_IDENTITIES_UPDATED: [],
};

export function canTransitionAnnulmentNotification(from: AnnulmentNotificationStatus, to: AnnulmentNotificationStatus): boolean {
  return ANNULMENT_NOTIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAnnulmentNotification(from: AnnulmentNotificationStatus, to: AnnulmentNotificationStatus): void {
  if (!canTransitionAnnulmentNotification(from, to)) {
    throw new IllegalTransitionError("annulment notification", from, to);
  }
}

export function canTransitionAnnulmentRegistration(from: AnnulmentRegistrationStatus, to: AnnulmentRegistrationStatus): boolean {
  return ANNULMENT_REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAnnulmentRegistration(from: AnnulmentRegistrationStatus, to: AnnulmentRegistrationStatus): void {
  if (!canTransitionAnnulmentRegistration(from, to)) {
    throw new IllegalTransitionError("annulment registration", from, to);
  }
}

export function canTransitionAnnulmentDecisionVerification(
  from: AnnulmentDecisionVerificationStatus,
  to: AnnulmentDecisionVerificationStatus
): boolean {
  return ANNULMENT_DECISION_VERIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAnnulmentDecisionVerification(
  from: AnnulmentDecisionVerificationStatus,
  to: AnnulmentDecisionVerificationStatus
): void {
  if (!canTransitionAnnulmentDecisionVerification(from, to)) {
    throw new IllegalTransitionError("annulment decision verification", from, to);
  }
}

export function canTransitionAnnulmentPartySync(from: AnnulmentPartySdidSyncStatus, to: AnnulmentPartySdidSyncStatus): boolean {
  return ANNULMENT_PARTY_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAnnulmentPartySync(from: AnnulmentPartySdidSyncStatus, to: AnnulmentPartySdidSyncStatus): void {
  if (!canTransitionAnnulmentPartySync(from, to)) {
    throw new IllegalTransitionError("annulment party sync", from, to);
  }
}

export function canTransitionAnnulmentSync(from: AnnulmentSdidSyncStatus, to: AnnulmentSdidSyncStatus): boolean {
  return ANNULMENT_SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAnnulmentSync(from: AnnulmentSdidSyncStatus, to: AnnulmentSdidSyncStatus): void {
  if (!canTransitionAnnulmentSync(from, to)) {
    throw new IllegalTransitionError("annulment sync", from, to);
  }
}

export const ANNULMENT_NOTIFICATION_STATUS_LABELS: Record<AnnulmentNotificationStatus, string> = {
  RECEIVED: "Received",
  VALIDATION_PENDING: "Validation pending",
  VALIDATED: "Validated",
  RETURNED: "Returned",
  CONVERTED_TO_REGISTRATION: "Converted to registration",
  DUPLICATE: "Duplicate",
  CANCELLED: "Cancelled",
};

export const ANNULMENT_REGISTRATION_STATUS_LABELS: Record<AnnulmentRegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  DECISION_VERIFICATION: "Decision verification",
  LEGAL_EFFECT_REVIEW: "Legal-effect review",
  FOREIGN_DECISION_REVIEW: "Foreign decision review",
  EXCEPTION_REVIEW: "Exception review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGISTERED: "Registered",
  CANCELLED: "Cancelled",
};

export const ANNULMENT_DECISION_VERIFICATION_STATUS_LABELS: Record<AnnulmentDecisionVerificationStatus, string> = {
  NOT_STARTED: "Not started",
  PENDING: "Pending",
  VERIFIED: "Verified",
  UNVERIFIED: "Unverified",
  CONFLICT_FOUND: "Conflict found",
  MANUAL_REVIEW: "Manual review",
};

export const ANNULMENT_SYNC_STATUS_LABELS: Record<AnnulmentSdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  BOTH_IDENTITIES_UPDATED: "Both identities updated",
  PARTIAL_FAILURE: "Partial synchronization failure",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const ANNULMENT_PARTY_SYNC_STATUS_LABELS: Record<AnnulmentPartySdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_UPDATED: "Identity updated",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

export const ANNULMENT_REGISTRATION_TIMELINE_ORDER: AnnulmentRegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REGISTERED",
];

/** Pure aggregator: combines both affected parties' independent sync
 * sub-statuses into the case-level AnnulmentSdidSyncStatus (spec §18/§24) —
 * never lets one party's outcome affect the other's. Identical shape to
 * aggregateDivorceSyncStatus(). */
export function aggregateAnnulmentSyncStatus(
  party1: AnnulmentPartySdidSyncStatus,
  party2: AnnulmentPartySdidSyncStatus
): AnnulmentSdidSyncStatus {
  if (party1 === "IDENTITY_UPDATED" && party2 === "IDENTITY_UPDATED") return "BOTH_IDENTITIES_UPDATED";
  if ((party1 === "IDENTITY_UPDATED" && party2 === "FAILED") || (party2 === "IDENTITY_UPDATED" && party1 === "FAILED")) {
    return "PARTIAL_FAILURE";
  }
  if (party1 === "FAILED" && party2 === "FAILED") return "FAILED";
  if (party1 === "MANUAL_REVIEW" || party2 === "MANUAL_REVIEW") return "MANUAL_REVIEW";
  if (party1 === "IN_PROGRESS" || party2 === "IN_PROGRESS") return "IN_PROGRESS";
  if (party1 === "PENDING" || party2 === "PENDING") return "PENDING";
  return "NOT_READY";
}
