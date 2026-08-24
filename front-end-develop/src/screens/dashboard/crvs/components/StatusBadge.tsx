import Icon from "@/components/icon";
import {
  BirthNotificationStatus,
  BirthRegistrationStatus,
  SdidSyncStatus,
  VerificationState,
  BirthCertificateRequestStatus,
  BirthCertificateStatus,
  DeathNotificationStatus,
  DeathRegistrationStatus,
  DeathSdidSyncStatus,
} from "@/domain/crvs/types";
import {
  NOTIFICATION_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  SYNC_STATUS_LABELS,
  CERTIFICATE_REQUEST_STATUS_LABELS,
  CERTIFICATE_STATUS_LABELS,
  DEATH_NOTIFICATION_STATUS_LABELS,
  DEATH_REGISTRATION_STATUS_LABELS,
  DEATH_SYNC_STATUS_LABELS,
} from "@/domain/crvs/statusMachines";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const NOTIFICATION_TONE: Record<BirthNotificationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  RETURNED: "warning",
  ACCEPTED: "success",
  CANCELLED: "neutral",
};

const NOTIFICATION_ICON: Record<BirthNotificationStatus, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  RETURNED: "undo",
  ACCEPTED: "check_circle",
  CANCELLED: "block",
};

const REGISTRATION_TONE: Record<BirthRegistrationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warning",
  RESUBMITTED: "info",
  LATE_REGISTRATION_REVIEW: "warning",
  EXCEPTION_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REGISTERED: "success",
  CANCELLED: "neutral",
};

const REGISTRATION_ICON: Record<BirthRegistrationStatus, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  UNDER_REVIEW: "search",
  CORRECTION_REQUIRED: "edit",
  RESUBMITTED: "outgoing_mail",
  LATE_REGISTRATION_REVIEW: "schedule",
  EXCEPTION_REVIEW: "report",
  APPROVED: "check_circle",
  REJECTED: "cancel",
  REGISTERED: "verified",
  CANCELLED: "block",
};

const SYNC_TONE: Record<SdidSyncStatus, Tone> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_CREATED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

const SYNC_ICON: Record<SdidSyncStatus, string> = {
  NOT_READY: "hourglass_empty",
  PENDING: "schedule",
  IN_PROGRESS: "sync",
  IDENTITY_CREATED: "fingerprint",
  FAILED: "error",
  MANUAL_REVIEW: "flag",
};

const VERIFICATION_TONE: Record<VerificationState, Tone> = {
  NOT_VERIFIED: "neutral",
  VERIFIED: "success",
  UNVERIFIED_PROVIDED: "warning",
  MANUAL_REVIEW_REQUIRED: "warning",
};

const VERIFICATION_LABEL: Record<VerificationState, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  UNVERIFIED_PROVIDED: "Provided, unverified",
  MANUAL_REVIEW_REQUIRED: "Manual review required",
};

const VERIFICATION_ICON: Record<VerificationState, string> = {
  NOT_VERIFIED: "help",
  VERIFIED: "check_circle",
  UNVERIFIED_PROVIDED: "info",
  MANUAL_REVIEW_REQUIRED: "flag",
};

const CERTIFICATE_REQUEST_TONE: Record<BirthCertificateRequestStatus, Tone> = {
  DRAFT: "neutral",
  IDENTITY_VERIFICATION_REQUIRED: "info",
  RECORD_LOOKUP_REQUIRED: "info",
  RECORD_NOT_FOUND: "danger",
  ELIGIBILITY_CHECK: "info",
  MANUAL_REVIEW: "warning",
  PAYMENT_PENDING: "warning",
  PAYMENT_FAILED: "danger",
  PAID: "info",
  APPROVED: "success",
  REJECTED: "danger",
  ISSUING: "info",
  ISSUED: "success",
  DELIVERY_PENDING: "info",
  DELIVERED: "success",
  DELIVERY_FAILED: "danger",
  CANCELLED: "neutral",
};

const CERTIFICATE_REQUEST_ICON: Record<BirthCertificateRequestStatus, string> = {
  DRAFT: "edit_note",
  IDENTITY_VERIFICATION_REQUIRED: "verified_user",
  RECORD_LOOKUP_REQUIRED: "search",
  RECORD_NOT_FOUND: "search_off",
  ELIGIBILITY_CHECK: "fact_check",
  MANUAL_REVIEW: "flag",
  PAYMENT_PENDING: "payments",
  PAYMENT_FAILED: "error",
  PAID: "receipt_long",
  APPROVED: "check_circle",
  REJECTED: "cancel",
  ISSUING: "hourglass_top",
  ISSUED: "workspace_premium",
  DELIVERY_PENDING: "local_shipping",
  DELIVERED: "mark_email_read",
  DELIVERY_FAILED: "report",
  CANCELLED: "block",
};

const CERTIFICATE_TONE: Record<BirthCertificateStatus, Tone> = {
  ACTIVE: "success",
  REVOKED: "danger",
  SUPERSEDED: "neutral",
};

const CERTIFICATE_ICON: Record<BirthCertificateStatus, string> = {
  ACTIVE: "verified",
  REVOKED: "block",
  SUPERSEDED: "history",
};

const DEATH_NOTIFICATION_TONE: Record<DeathNotificationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  RETURNED: "warning",
  ACCEPTED: "success",
  CANCELLED: "neutral",
};

const DEATH_NOTIFICATION_ICON: Record<DeathNotificationStatus, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  RETURNED: "undo",
  ACCEPTED: "check_circle",
  CANCELLED: "block",
};

const DEATH_REGISTRATION_TONE: Record<DeathRegistrationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warning",
  RESUBMITTED: "info",
  LATE_REGISTRATION_REVIEW: "warning",
  MEDICO_LEGAL_REVIEW: "warning",
  UNIDENTIFIED_PERSON_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REGISTERED: "success",
  CANCELLED: "neutral",
};

const DEATH_REGISTRATION_ICON: Record<DeathRegistrationStatus, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  UNDER_REVIEW: "search",
  CORRECTION_REQUIRED: "edit",
  RESUBMITTED: "outgoing_mail",
  LATE_REGISTRATION_REVIEW: "schedule",
  MEDICO_LEGAL_REVIEW: "gavel",
  UNIDENTIFIED_PERSON_REVIEW: "person_search",
  APPROVED: "check_circle",
  REJECTED: "cancel",
  REGISTERED: "verified",
  CANCELLED: "block",
};

const DEATH_SYNC_TONE: Record<DeathSdidSyncStatus, Tone> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_MARKED_DECEASED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

const DEATH_SYNC_ICON: Record<DeathSdidSyncStatus, string> = {
  NOT_READY: "hourglass_empty",
  PENDING: "schedule",
  IN_PROGRESS: "sync",
  IDENTITY_MARKED_DECEASED: "fingerprint",
  FAILED: "error",
  MANUAL_REVIEW: "flag",
};

type StatusBadgeProps =
  | { kind: "notification"; status: BirthNotificationStatus }
  | { kind: "registration"; status: BirthRegistrationStatus }
  | { kind: "sync"; status: SdidSyncStatus }
  | { kind: "verification"; status: VerificationState }
  | { kind: "certificateRequest"; status: BirthCertificateRequestStatus }
  | { kind: "certificate"; status: BirthCertificateStatus }
  | { kind: "deathNotification"; status: DeathNotificationStatus }
  | { kind: "deathRegistration"; status: DeathRegistrationStatus }
  | { kind: "deathSync"; status: DeathSdidSyncStatus };

/** Icon + human label status pill. Never renders raw enum text and never
 * relies on colour alone (spec §25). */
export default function StatusBadge(props: StatusBadgeProps) {
  let label: string;
  let tone: Tone;
  let icon: string;

  if (props.kind === "notification") {
    label = NOTIFICATION_STATUS_LABELS[props.status];
    tone = NOTIFICATION_TONE[props.status];
    icon = NOTIFICATION_ICON[props.status];
  } else if (props.kind === "registration") {
    label = REGISTRATION_STATUS_LABELS[props.status];
    tone = REGISTRATION_TONE[props.status];
    icon = REGISTRATION_ICON[props.status];
  } else if (props.kind === "sync") {
    label = SYNC_STATUS_LABELS[props.status];
    tone = SYNC_TONE[props.status];
    icon = SYNC_ICON[props.status];
  } else if (props.kind === "certificateRequest") {
    label = CERTIFICATE_REQUEST_STATUS_LABELS[props.status];
    tone = CERTIFICATE_REQUEST_TONE[props.status];
    icon = CERTIFICATE_REQUEST_ICON[props.status];
  } else if (props.kind === "certificate") {
    label = CERTIFICATE_STATUS_LABELS[props.status];
    tone = CERTIFICATE_TONE[props.status];
    icon = CERTIFICATE_ICON[props.status];
  } else if (props.kind === "deathNotification") {
    label = DEATH_NOTIFICATION_STATUS_LABELS[props.status];
    tone = DEATH_NOTIFICATION_TONE[props.status];
    icon = DEATH_NOTIFICATION_ICON[props.status];
  } else if (props.kind === "deathRegistration") {
    label = DEATH_REGISTRATION_STATUS_LABELS[props.status];
    tone = DEATH_REGISTRATION_TONE[props.status];
    icon = DEATH_REGISTRATION_ICON[props.status];
  } else if (props.kind === "deathSync") {
    label = DEATH_SYNC_STATUS_LABELS[props.status];
    tone = DEATH_SYNC_TONE[props.status];
    icon = DEATH_SYNC_ICON[props.status];
  } else {
    label = VERIFICATION_LABEL[props.status];
    tone = VERIFICATION_TONE[props.status];
    icon = VERIFICATION_ICON[props.status];
  }

  return (
    <span className={`crvs-status-pill crvs-status-${tone} crvs-status-icon-label`}>
      <Icon name={icon} />
      {label}
    </span>
  );
}
