// Local status-pill renderer scoped to annulmentReview — StatusBadge.tsx is a
// shared file outside this module's lane and does not (yet) carry
// annulment-specific status kinds, so this mirrors its exact shape (icon +
// human label, tone never carrying meaning alone) without touching it.
import Icon from "@/components/icon";
import {
  AnnulmentRegistrationStatus,
  AnnulmentDecisionVerificationStatus,
  AnnulmentPartySdidSyncStatus,
  AnnulmentSdidSyncStatus,
  ForeignAnnulmentRecognitionStatus,
  MarriageCivilStatus,
} from "@/domain/crvs/types";
import {
  ANNULMENT_REGISTRATION_STATUS_LABELS,
  ANNULMENT_DECISION_VERIFICATION_STATUS_LABELS,
  ANNULMENT_PARTY_SYNC_STATUS_LABELS,
  ANNULMENT_SYNC_STATUS_LABELS,
} from "@/domain/crvs/statusMachines";
import { FOREIGN_RECOGNITION_STATUS_LABELS } from "../../annulmentShared";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const REGISTRATION_TONE: Record<AnnulmentRegistrationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warning",
  RESUBMITTED: "info",
  DECISION_VERIFICATION: "info",
  LEGAL_EFFECT_REVIEW: "warning",
  FOREIGN_DECISION_REVIEW: "warning",
  EXCEPTION_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REGISTERED: "success",
  CANCELLED: "neutral",
};

const REGISTRATION_ICON: Record<AnnulmentRegistrationStatus, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  UNDER_REVIEW: "search",
  CORRECTION_REQUIRED: "edit",
  RESUBMITTED: "outgoing_mail",
  DECISION_VERIFICATION: "gavel",
  LEGAL_EFFECT_REVIEW: "balance",
  FOREIGN_DECISION_REVIEW: "public",
  EXCEPTION_REVIEW: "report",
  APPROVED: "check_circle",
  REJECTED: "cancel",
  REGISTERED: "verified",
  CANCELLED: "block",
};

const DECISION_VERIFICATION_TONE: Record<AnnulmentDecisionVerificationStatus, Tone> = {
  NOT_STARTED: "neutral",
  PENDING: "info",
  VERIFIED: "success",
  UNVERIFIED: "warning",
  CONFLICT_FOUND: "danger",
  MANUAL_REVIEW: "warning",
};

const DECISION_VERIFICATION_ICON: Record<AnnulmentDecisionVerificationStatus, string> = {
  NOT_STARTED: "hourglass_empty",
  PENDING: "schedule",
  VERIFIED: "check_circle",
  UNVERIFIED: "help",
  CONFLICT_FOUND: "error",
  MANUAL_REVIEW: "flag",
};

const PARTY_SYNC_TONE: Record<AnnulmentPartySdidSyncStatus, Tone> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_UPDATED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

const PARTY_SYNC_ICON: Record<AnnulmentPartySdidSyncStatus, string> = {
  NOT_READY: "hourglass_empty",
  PENDING: "schedule",
  IN_PROGRESS: "sync",
  IDENTITY_UPDATED: "fingerprint",
  FAILED: "error",
  MANUAL_REVIEW: "flag",
};

const SYNC_TONE: Record<AnnulmentSdidSyncStatus, Tone> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  BOTH_IDENTITIES_UPDATED: "success",
  PARTIAL_FAILURE: "warning",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

const SYNC_ICON: Record<AnnulmentSdidSyncStatus, string> = {
  NOT_READY: "hourglass_empty",
  PENDING: "schedule",
  IN_PROGRESS: "sync",
  BOTH_IDENTITIES_UPDATED: "fingerprint",
  PARTIAL_FAILURE: "sync_problem",
  FAILED: "error",
  MANUAL_REVIEW: "flag",
};

const FOREIGN_TONE: Record<ForeignAnnulmentRecognitionStatus, Tone> = {
  NOT_APPLICABLE: "neutral",
  PENDING: "info",
  REQUIREMENTS_SATISFIED: "success",
  REQUIRES_LEGAL_REVIEW: "warning",
  REJECTED: "danger",
};

const FOREIGN_ICON: Record<ForeignAnnulmentRecognitionStatus, string> = {
  NOT_APPLICABLE: "remove_circle_outline",
  PENDING: "schedule",
  REQUIREMENTS_SATISFIED: "check_circle",
  REQUIRES_LEGAL_REVIEW: "gavel",
  REJECTED: "cancel",
};

export const MARRIAGE_CIVIL_STATUS_LABELS: Record<MarriageCivilStatus, string> = {
  ACTIVE: "Active",
  DISSOLVED_BY_DIVORCE: "Dissolved by divorce",
  ANNULLED: "Annulled",
  ANNULMENT_PENDING: "Annulment pending",
  JUDICIALLY_SEPARATED: "Judicially separated",
  CORRECTION_PENDING: "Correction pending",
  STATUS_REQUIRES_REVIEW: "Status requires review",
};

const CIVIL_STATUS_TONE: Record<MarriageCivilStatus, Tone> = {
  ACTIVE: "success",
  DISSOLVED_BY_DIVORCE: "neutral",
  ANNULLED: "neutral",
  ANNULMENT_PENDING: "warning",
  JUDICIALLY_SEPARATED: "warning",
  CORRECTION_PENDING: "warning",
  STATUS_REQUIRES_REVIEW: "danger",
};

const CIVIL_STATUS_ICON: Record<MarriageCivilStatus, string> = {
  ACTIVE: "check_circle",
  DISSOLVED_BY_DIVORCE: "call_split",
  ANNULLED: "gavel",
  ANNULMENT_PENDING: "hourglass_top",
  JUDICIALLY_SEPARATED: "pause_circle",
  CORRECTION_PENDING: "edit",
  STATUS_REQUIRES_REVIEW: "flag",
};

type Props =
  | { kind: "annulmentRegistration"; status: AnnulmentRegistrationStatus }
  | { kind: "annulmentDecisionVerification"; status: AnnulmentDecisionVerificationStatus }
  | { kind: "annulmentPartySync"; status: AnnulmentPartySdidSyncStatus }
  | { kind: "annulmentSync"; status: AnnulmentSdidSyncStatus }
  | { kind: "foreignRecognition"; status: ForeignAnnulmentRecognitionStatus }
  | { kind: "marriageCivilStatus"; status: MarriageCivilStatus };

/** Icon + human label status pill, scoped to the annulment review workspace.
 * Never renders raw enum text and never relies on colour alone (spec §25). */
export default function AnnulmentStatusPill(props: Props) {
  let label: string;
  let tone: Tone;
  let icon: string;

  if (props.kind === "annulmentRegistration") {
    label = ANNULMENT_REGISTRATION_STATUS_LABELS[props.status];
    tone = REGISTRATION_TONE[props.status];
    icon = REGISTRATION_ICON[props.status];
  } else if (props.kind === "annulmentDecisionVerification") {
    label = ANNULMENT_DECISION_VERIFICATION_STATUS_LABELS[props.status];
    tone = DECISION_VERIFICATION_TONE[props.status];
    icon = DECISION_VERIFICATION_ICON[props.status];
  } else if (props.kind === "annulmentPartySync") {
    label = ANNULMENT_PARTY_SYNC_STATUS_LABELS[props.status];
    tone = PARTY_SYNC_TONE[props.status];
    icon = PARTY_SYNC_ICON[props.status];
  } else if (props.kind === "annulmentSync") {
    label = ANNULMENT_SYNC_STATUS_LABELS[props.status];
    tone = SYNC_TONE[props.status];
    icon = SYNC_ICON[props.status];
  } else if (props.kind === "foreignRecognition") {
    label = FOREIGN_RECOGNITION_STATUS_LABELS[props.status];
    tone = FOREIGN_TONE[props.status];
    icon = FOREIGN_ICON[props.status];
  } else {
    label = MARRIAGE_CIVIL_STATUS_LABELS[props.status];
    tone = CIVIL_STATUS_TONE[props.status];
    icon = CIVIL_STATUS_ICON[props.status];
  }

  return (
    <span className={`crvs-status-pill crvs-status-${tone} crvs-status-icon-label`}>
      <Icon name={icon} />
      {label}
    </span>
  );
}
