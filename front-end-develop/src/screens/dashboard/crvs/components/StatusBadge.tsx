import Icon from "@/components/icon";
import { BirthNotificationStatus, BirthRegistrationStatus, SdidSyncStatus } from "@/domain/crvs/types";
import {
  NOTIFICATION_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  SYNC_STATUS_LABELS,
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

type StatusBadgeProps =
  | { kind: "notification"; status: BirthNotificationStatus }
  | { kind: "registration"; status: BirthRegistrationStatus }
  | { kind: "sync"; status: SdidSyncStatus };

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
  } else {
    label = SYNC_STATUS_LABELS[props.status];
    tone = SYNC_TONE[props.status];
    icon = SYNC_ICON[props.status];
  }

  return (
    <span className={`crvs-status-pill crvs-status-${tone} crvs-status-icon-label`}>
      <Icon name={icon} />
      {label}
    </span>
  );
}
