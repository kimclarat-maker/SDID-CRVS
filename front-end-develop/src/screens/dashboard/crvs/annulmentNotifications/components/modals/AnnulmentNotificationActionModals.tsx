import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { AnnulmentNotification, AnnulmentRegistration } from "@/domain/crvs/types";
import {
  demoAssignAnnulmentNotification,
  demoConvertAnnulmentNotificationToRegistration,
  demoMarkAnnulmentNotificationDuplicate,
  demoReturnAnnulmentNotification,
  demoValidateAnnulmentNotification,
} from "@/demo/services/crvsAnnulmentNotifications";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate } from "../../../annulmentShared";

/**
 * Every court-notification action, consolidated onto the two shared modal
 * primitives (ConfirmActionModal / StructuredReasonModal) rather than built
 * as bespoke components — mirrors DivorceNotificationActionModals.tsx. Each
 * export is a thin wrapper supplying its own copy, fields and service call;
 * none of them re-implements submit/disable/error handling.
 */

function NotificationSummary({ notification }: { notification: AnnulmentNotification }) {
  return (
    <div className="crvs-form-grid" style={{ marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Court or authority</div>
        <div>{notification.courtName}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Court case number</div>
        <div>{notification.courtCaseNumber}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Decision number</div>
        <div>{notification.decisionNumber}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Decision date</div>
        <div>{formatDate(notification.decisionDate)}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Affected persons as reported</div>
        <div>{notification.applicantNamesAsReported}</div>
      </div>
    </div>
  );
}

export function AssignAnnulmentNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  defaultOfficerId,
  defaultOfficerName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorName: string;
  defaultOfficerId?: string;
  defaultOfficerName?: string;
  onAssigned: (updated: AnnulmentNotification) => void;
}) {
  const [officerId, setOfficerId] = useState("");
  const [officerName, setOfficerName] = useState("");

  if (!notification) return null;

  const handleClose = () => {
    setOfficerId("");
    setOfficerName("");
    onClose();
  };

  const handleConfirm = async () => {
    const resolvedId = officerId.trim() || defaultOfficerId;
    const resolvedName = officerName.trim() || defaultOfficerName;
    if (!resolvedId || !resolvedName) {
      throw new Error("Enter the officer's account and display name before assigning.");
    }
    const updated = demoAssignAnnulmentNotification(notification.id, resolvedId, resolvedName, actorName);
    toastMessage("success", `${updated.reference} assigned to ${resolvedName}.`);
    onAssigned(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Assign court notification"
      description={notification.reference}
      confirmLabel="Assign"
      testId="assign-annulment-notification-modal"
    >
      <NotificationSummary notification={notification} />
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        Assigning makes this officer responsible for validating the notification and converting it into a registration. It does not change the notification&apos;s status.
      </p>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="assign-an-name">Officer name</label>
          <input id="assign-an-name" value={officerName} placeholder={defaultOfficerName || "Annulment Registration Officer"} onChange={(e) => setOfficerName(e.target.value)} data-testid="assign-an-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="assign-an-id">Officer account</label>
          <input id="assign-an-id" value={officerId} placeholder={defaultOfficerId || "annulment.officer@demo.identity.local"} onChange={(e) => setOfficerId(e.target.value)} data-testid="assign-an-id" />
        </div>
      </div>
      <p className="crvs-form-hint">Leave both blank to assign this notification to yourself.</p>
    </ConfirmActionModal>
  );
}

export function ValidateAnnulmentNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onValidated,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorName: string;
  onValidated: (updated: AnnulmentNotification) => void;
}) {
  if (!notification) return null;

  const handleConfirm = async () => {
    const updated = await demoValidateAnnulmentNotification(notification.id, actorName);
    toastMessage(
      updated.marriageMatch.status === "MATCHED" ? "success" : "info",
      `${updated.reference} validated — marriage match: ${updated.marriageMatch.status.replace(/_/g, " ").toLowerCase()}.`
    );
    onValidated(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Validate court notification"
      description={notification.reference}
      confirmLabel="Run validation"
      testId="validate-annulment-notification-modal"
    >
      <NotificationSummary notification={notification} />
      <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="search" />
        <span>
          Validation searches the marriage registry using the reported marriage reference and affected-persons names, then records every candidate on the notification. A single confident candidate marks the
          notification validated; anything else leaves it pending so an officer can decide.
        </span>
      </div>
    </ConfirmActionModal>
  );
}

const RETURN_REASON_OPTIONS: ReasonOption[] = [
  { value: "Incomplete court details", label: "Incomplete court details" },
  { value: "Decision number missing or unreadable", label: "Decision number missing or unreadable" },
  { value: "Decision not yet final", label: "Decision not yet final" },
  { value: "Affected persons cannot be identified", label: "Affected persons cannot be identified" },
  { value: "Signed decision document missing", label: "Signed decision document missing" },
  { value: "Other", label: "Other" },
];

export function ReturnAnnulmentNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onReturned,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorName: string;
  onReturned: (updated: AnnulmentNotification) => void;
}) {
  if (!notification) return null;

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Return notification to the court"
      description={`${notification.reference} — the simulated court contact is asked to resend a corrected notification.`}
      reasonOptions={RETURN_REASON_OPTIONS}
      noteLabel="Detail for the court contact"
      noteRequired
      submitLabel="Return notification"
      testId="return-annulment-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoReturnAnnulmentNotification(notification.id, note ? `${reason}: ${note}` : reason, actorName);
        toastMessage("success", `${updated.reference} returned to ${notification.courtName}.`);
        onReturned(updated);
      }}
    >
      <NotificationSummary notification={notification} />
    </StructuredReasonModal>
  );
}

const DUPLICATE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Same court case number already received", label: "Same court case number already received" },
  { value: "Same decision number already received", label: "Same decision number already received" },
  { value: "Already converted to a registration", label: "Already converted to a registration" },
  { value: "Other", label: "Other" },
];

export function MarkAnnulmentNotificationDuplicateModal({
  show,
  onClose,
  notification,
  actorName,
  onMarked,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorName: string;
  onMarked: (updated: AnnulmentNotification) => void;
}) {
  if (!notification) return null;

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Mark notification as a duplicate"
      description={`${notification.reference} — this closes the notification permanently. It can never be converted into a registration afterwards.`}
      reasonOptions={DUPLICATE_REASON_OPTIONS}
      noteLabel="Which existing case is this a duplicate of?"
      noteRequired
      requireConfirmation
      confirmationLabel="I confirm this notification duplicates an existing case and should be closed."
      submitLabel="Mark duplicate"
      destructive
      testId="mark-annulment-notification-duplicate-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoMarkAnnulmentNotificationDuplicate(notification.id, note ? `${reason}: ${note}` : reason, actorName);
        toastMessage("success", `${updated.reference} marked as a duplicate.`);
        onMarked(updated);
      }}
    >
      <NotificationSummary notification={notification} />
    </StructuredReasonModal>
  );
}

export function ConvertAnnulmentNotificationModal({
  show,
  onClose,
  notification,
  actorId,
  actorName,
  defaultOfficeId,
  defaultOfficeName,
  onConverted,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorId: string;
  actorName: string;
  defaultOfficeId: string;
  defaultOfficeName: string;
  onConverted: (created: AnnulmentRegistration) => void;
}) {
  const [officeId, setOfficeId] = useState(defaultOfficeId);
  const [officeName, setOfficeName] = useState(defaultOfficeName);

  if (!notification) return null;

  const handleConfirm = async () => {
    if (!officeId.trim() || !officeName.trim()) {
      throw new Error("A processing office is required before this notification can become a registration.");
    }
    const created = demoConvertAnnulmentNotificationToRegistration(notification.id, officeId.trim(), officeName.trim(), actorId, actorName);
    toastMessage("success", `${notification.reference} converted to registration ${created.reference}.`);
    onConverted(created);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Convert to an annulment registration"
      description={notification.reference}
      confirmLabel="Convert to registration"
      testId="convert-annulment-notification-modal"
    >
      <NotificationSummary notification={notification} />
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        A new draft registration is created with the court decision, signed decision document and matched marriage already filled in. The notification is closed as converted and cannot be reused.
      </p>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="convert-an-office-name">Processing office</label>
          <input id="convert-an-office-name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} data-testid="convert-an-office-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="convert-an-office-id">Processing office ID</label>
          <input id="convert-an-office-id" value={officeId} onChange={(e) => setOfficeId(e.target.value)} data-testid="convert-an-office-id" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}

const ESCALATE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Court details cannot be verified", label: "Court details cannot be verified" },
  { value: "Conflicting notification on record", label: "Conflicting notification on record" },
  { value: "Requires supervisor judgement", label: "Requires supervisor judgement" },
  { value: "Other", label: "Other" },
];

/**
 * Escalation on a notification has no dedicated service call — a notification
 * is not a case yet, so there is nothing to reassign. It records the concern
 * by returning the notification to the court with an escalation note, which
 * is the only state transition the notification machine allows here (mirrors
 * EscalateDivorceNotificationModal).
 */
export function EscalateAnnulmentNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onEscalated,
}: {
  show: boolean;
  onClose: () => void;
  notification: AnnulmentNotification | undefined;
  actorName: string;
  onEscalated: (updated: AnnulmentNotification) => void;
}) {
  if (!notification) return null;

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Escalate to a supervisor"
      description={`${notification.reference} — records the escalation and returns the notification to ${notification.courtName} pending supervisor guidance.`}
      reasonOptions={ESCALATE_REASON_OPTIONS}
      noteLabel="What should the supervisor look at?"
      noteRequired
      submitLabel="Escalate"
      testId="escalate-annulment-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoReturnAnnulmentNotification(notification.id, `Escalated — ${reason}: ${note}`, actorName);
        toastMessage("success", `${updated.reference} escalated for supervisor review.`);
        onEscalated(updated);
      }}
    >
      <NotificationSummary notification={notification} />
    </StructuredReasonModal>
  );
}
