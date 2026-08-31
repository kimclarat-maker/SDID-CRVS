import Icon from "@/components/icon";
import { AnnulmentPartySdidSyncStatus, AnnulmentRegistrationStatus, AnnulmentSdidSyncStatus, ForeignAnnulmentRecognitionStatus } from "@/domain/crvs/types";
import {
  ANNULMENT_PARTY_SYNC_STATUS_LABELS,
  ANNULMENT_REGISTRATION_STATUS_LABELS,
  ANNULMENT_SYNC_STATUS_LABELS,
} from "@/domain/crvs/statusMachines";
import { FOREIGN_RECOGNITION_STATUS_LABELS } from "../../annulmentShared";

// StatusBadge.tsx (src/screens/dashboard/crvs/components/StatusBadge.tsx) is
// owned by another workstream and doesn't yet carry annulment "kind" entries
// — rather than add a dependency on a file this module doesn't own, every
// annulment queue/detail screen renders its status pills from here instead.
// Same icon+label-pill visual contract as StatusBadge (spec §25: never color
// alone), reused verbatim across annulmentCorrections, annulmentExceptions,
// foreignAnnulments, registeredAnnulments, annulmentSyncFailures and
// annulmentAudit.

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const REGISTRATION_TONE: Record<AnnulmentRegistrationStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warning",
  RESUBMITTED: "info",
  DECISION_VERIFICATION: "info",
  LEGAL_EFFECT_REVIEW: "info",
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

const RECOGNITION_TONE: Record<ForeignAnnulmentRecognitionStatus, Tone> = {
  NOT_APPLICABLE: "neutral",
  PENDING: "info",
  REQUIREMENTS_SATISFIED: "success",
  REQUIRES_LEGAL_REVIEW: "warning",
  REJECTED: "danger",
};

const RECOGNITION_ICON: Record<ForeignAnnulmentRecognitionStatus, string> = {
  NOT_APPLICABLE: "remove_circle_outline",
  PENDING: "schedule",
  REQUIREMENTS_SATISFIED: "check_circle",
  REQUIRES_LEGAL_REVIEW: "gavel",
  REJECTED: "cancel",
};

export function AnnulmentRegistrationStatusPill({ status }: { status: AnnulmentRegistrationStatus }) {
  return (
    <span className={`crvs-status-pill crvs-status-${REGISTRATION_TONE[status]} crvs-status-icon-label`}>
      <Icon name={REGISTRATION_ICON[status]} />
      {ANNULMENT_REGISTRATION_STATUS_LABELS[status]}
    </span>
  );
}

export function AnnulmentSyncStatusPill({ status }: { status: AnnulmentSdidSyncStatus }) {
  return (
    <span className={`crvs-status-pill crvs-status-${SYNC_TONE[status]} crvs-status-icon-label`}>
      <Icon name={SYNC_ICON[status]} />
      {ANNULMENT_SYNC_STATUS_LABELS[status]}
    </span>
  );
}

export function AnnulmentPartySyncStatusPill({ status }: { status: AnnulmentPartySdidSyncStatus }) {
  return (
    <span className={`crvs-status-pill crvs-status-${PARTY_SYNC_TONE[status]} crvs-status-icon-label`}>
      <Icon name={PARTY_SYNC_ICON[status]} />
      {ANNULMENT_PARTY_SYNC_STATUS_LABELS[status]}
    </span>
  );
}

export function ForeignAnnulmentRecognitionStatusPill({ status }: { status: ForeignAnnulmentRecognitionStatus }) {
  return (
    <span className={`crvs-status-pill crvs-status-${RECOGNITION_TONE[status]} crvs-status-icon-label`}>
      <Icon name={RECOGNITION_ICON[status]} />
      {FOREIGN_RECOGNITION_STATUS_LABELS[status]}
    </span>
  );
}
