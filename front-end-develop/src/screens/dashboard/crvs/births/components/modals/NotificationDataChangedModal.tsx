import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";

export type NotificationFieldChange = {
  field: string;
  originalValue: string;
  newValue: string;
};

export type NotificationDataChangedModalProps = {
  show: boolean;
  changes: NotificationFieldChange[];
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

/** Shown when child details edited during a from-notification registration
 * diverge from the original notification. A reason is required before the
 * edit is accepted, and is recorded into registrationCase.notificationValueChanges. */
export default function NotificationDataChangedModal({ show, changes, onCancel, onConfirm }: NotificationDataChangedModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (changes.length === 0) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("A reason for this change is required.");
      return;
    }
    onConfirm(reason.trim());
    setReason("");
    setError(undefined);
  };

  return (
    <Modal show={show} handleClose={onCancel} title="Confirm change from notification" size="sm" testId="notification-data-changed-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint" style={{ marginTop: 0 }}>
          The following field{changes.length > 1 ? "s" : ""} differ from the original birth notification. Explain why
          before continuing.
        </p>
        <div className="crvs-table-scroll">
          <table className="crvs-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Original value</th>
                <th>New value</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.field}>
                  <td>{c.field}</td>
                  <td>{c.originalValue || "—"}</td>
                  <td>{c.newValue || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="notif-change-reason">Reason for change</label>
          <textarea id="notif-change-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <span className="crvs-form-error">{error}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Revert to notification value" appearance="ghost" onClick={onCancel} testId="notification-data-changed-cancel" />
          <Button type="button" text="Confirm change" appearance="primary" onClick={handleConfirm} testId="notification-data-changed-confirm" />
        </div>
      </div>
    </Modal>
  );
}
