import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { DivorceNotification, DivorceRegistration } from "@/domain/crvs/types";
import {
  demoAssignDivorceNotification,
  demoConvertDivorceNotificationToRegistration,
  demoMarkDivorceNotificationDuplicate,
  demoReturnDivorceNotification,
  demoValidateDivorceNotification,
} from "@/demo/services/crvsDivorceNotifications";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate } from "../../../divorceShared";

/**
 * Every court-notification action, consolidated onto the two shared modal
 * primitives (ConfirmActionModal / StructuredReasonModal) rather than built
 * as bespoke components — exactly the way the marriage review modals do it.
 * Each export is a thin wrapper supplying its own copy, fields and service
 * call; none of them re-implements submit/disable/error handling.
 */

function NotificationSummary({ notification }: { notification: DivorceNotification }) {
  return (
    <div className="crvs-form-grid" style={{ marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Court</div>
        <div>{notification.courtName}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Court case number</div>
        <div>{notification.courtCaseNumber}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Judgment number</div>
        <div>{notification.judgmentNumber}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Judgment date</div>
        <div>{formatDate(notification.judgmentDate)}</div>
      </div>
      <div>
        <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Former spouses as reported</div>
        <div>{notification.applicantNamesAsReported}</div>
      </div>
    </div>
  );
}

export function AssignDivorceNotificationModal({
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
  notification: DivorceNotification | undefined;
  actorName: string;
  defaultOfficerId?: string;
  defaultOfficerName?: string;
  onAssigned: (updated: DivorceNotification) => void;
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
    const updated = demoAssignDivorceNotification(notification.id, resolvedId, resolvedName, actorName);
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
      testId="assign-divorce-notification-modal"
    >
      <NotificationSummary notification={notification} />
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        Assigning makes this officer responsible for validating the notification and converting it into a registration. It does not change the notification&apos;s status.
      </p>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="assign-dn-name">Officer name</label>
          <input id="assign-dn-name" value={officerName} placeholder={defaultOfficerName || "Divorce Registration Officer"} onChange={(e) => setOfficerName(e.target.value)} data-testid="assign-dn-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="assign-dn-id">Officer account</label>
          <input id="assign-dn-id" value={officerId} placeholder={defaultOfficerId || "divorce.officer@demo.identity.local"} onChange={(e) => setOfficerId(e.target.value)} data-testid="assign-dn-id" />
        </div>
      </div>
      <p className="crvs-form-hint">Leave both blank to assign this notification to yourself.</p>
    </ConfirmActionModal>
  );
}

export function ValidateDivorceNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onValidated,
}: {
  show: boolean;
  onClose: () => void;
  notification: DivorceNotification | undefined;
  actorName: string;
  onValidated: (updated: DivorceNotification) => void;
}) {
  if (!notification) return null;

  const handleConfirm = async () => {
    const updated = await demoValidateDivorceNotification(notification.id, actorName);
    toastMessage(
      updated.marriageMatch.status === "MATCHED" ? "success" : "info",
      `${updated.reference} validated — marriage match: ${updated.marriageMatch.status.replace(/_/g, " ").toLowerCase()}.`
    );
    onValidated(updated);
    onClose();
  };

  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={handleConfirm} title="Validate court notification" description={notification.reference} confirmLabel="Run validation" testId="validate-divorce-notification-modal">
      <NotificationSummary notification={notification} />
      <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="search" />
        <span>
          Validation searches the marriage registry using the reported marriage reference and former-spouse names, then records every candidate on the notification. A single confident candidate marks the
          notification validated; anything else leaves it pending so an officer can decide.
        </span>
      </div>
    </ConfirmActionModal>
  );
}

const RETURN_REASON_OPTIONS: ReasonOption[] = [
  { value: "Incomplete court details", label: "Incomplete court details" },
  { value: "Judgment number missing or unreadable", label: "Judgment number missing or unreadable" },
  { value: "Judgment not yet final", label: "Judgment not yet final" },
  { value: "Former spouses cannot be identified", label: "Former spouses cannot be identified" },
  { value: "Signed judgment document missing", label: "Signed judgment document missing" },
  { value: "Other", label: "Other" },
];

export function ReturnDivorceNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onReturned,
}: {
  show: boolean;
  onClose: () => void;
  notification: DivorceNotification | undefined;
  actorName: string;
  onReturned: (updated: DivorceNotification) => void;
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
      testId="return-divorce-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoReturnDivorceNotification(notification.id, note ? `${reason}: ${note}` : reason, actorName);
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
  { value: "Same judgment number already received", label: "Same judgment number already received" },
  { value: "Already converted to a registration", label: "Already converted to a registration" },
  { value: "Other", label: "Other" },
];

export function MarkDivorceNotificationDuplicateModal({
  show,
  onClose,
  notification,
  actorName,
  onMarked,
}: {
  show: boolean;
  onClose: () => void;
  notification: DivorceNotification | undefined;
  actorName: string;
  onMarked: (updated: DivorceNotification) => void;
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
      testId="mark-divorce-notification-duplicate-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoMarkDivorceNotificationDuplicate(notification.id, note ? `${reason}: ${note}` : reason, actorName);
        toastMessage("success", `${updated.reference} marked as a duplicate.`);
        onMarked(updated);
      }}
    >
      <NotificationSummary notification={notification} />
    </StructuredReasonModal>
  );
}

export function ConvertDivorceNotificationModal({
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
  notification: DivorceNotification | undefined;
  actorId: string;
  actorName: string;
  defaultOfficeId: string;
  defaultOfficeName: string;
  onConverted: (created: DivorceRegistration) => void;
}) {
  const [officeId, setOfficeId] = useState(defaultOfficeId);
  const [officeName, setOfficeName] = useState(defaultOfficeName);

  if (!notification) return null;

  const handleConfirm = async () => {
    if (!officeId.trim() || !officeName.trim()) {
      throw new Error("A processing office is required before this notification can become a registration.");
    }
    const created = demoConvertDivorceNotificationToRegistration(notification.id, officeId.trim(), officeName.trim(), actorId, actorName);
    toastMessage("success", `${notification.reference} converted to registration ${created.reference}.`);
    onConverted(created);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Convert to a divorce registration"
      description={notification.reference}
      confirmLabel="Convert to registration"
      testId="convert-divorce-notification-modal"
    >
      <NotificationSummary notification={notification} />
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        A new draft registration is created with the court decision, signed judgment and matched marriage already filled in. The notification is closed as converted and cannot be reused.
      </p>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="convert-dn-office-name">Processing office</label>
          <input id="convert-dn-office-name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} data-testid="convert-dn-office-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="convert-dn-office-id">Processing office ID</label>
          <input id="convert-dn-office-id" value={officeId} onChange={(e) => setOfficeId(e.target.value)} data-testid="convert-dn-office-id" />
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
 * is the only state transition the notification machine allows here.
 */
export function EscalateDivorceNotificationModal({
  show,
  onClose,
  notification,
  actorName,
  onEscalated,
}: {
  show: boolean;
  onClose: () => void;
  notification: DivorceNotification | undefined;
  actorName: string;
  onEscalated: (updated: DivorceNotification) => void;
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
      testId="escalate-divorce-notification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoReturnDivorceNotification(notification.id, `Escalated — ${reason}: ${note}`, actorName);
        toastMessage("success", `${updated.reference} escalated for supervisor review.`);
        onEscalated(updated);
      }}
    >
      <NotificationSummary notification={notification} />
    </StructuredReasonModal>
  );
}
