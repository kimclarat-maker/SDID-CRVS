import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { demoAssignDeathManualReview } from "@/demo/services/crvsDeathSdidSync";
import toastMessage from "@/utils/common/toastMessage";

export default function DeathManualReviewModal({
  show,
  onClose,
  deathCase,
  actorName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  actorName: string;
  onAssigned: (updated: DeathRegistrationCase) => void;
}) {
  const [reason, setReason] = useState(deathCase.sdid.lastFailureCode ? `Synchronization failed: ${deathCase.sdid.lastFailureCode}` : "");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const reset = () => {
    setReason("");
    setAssignedTo("");
    setPriority("MEDIUM");
    setNotes("");
    setFormError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setFormError("A review reason is required.");
      return;
    }
    if (!assignedTo.trim()) {
      setFormError("Assign this review to someone before continuing.");
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      demoAssignDeathManualReview(deathCase.id, { reason: reason.trim(), assignedTo: assignedTo.trim(), priority, notes: notes.trim() || undefined }, actorName);
      const updated = await demoGetDeathRegistration(deathCase.id);
      toastMessage("success", "Case placed into manual review.");
      if (updated) onAssigned(updated);
      reset();
      onClose();
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Assign manual review" show={show} handleClose={handleClose} size="sm" testId="death-manual-review-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-group">
          <label htmlFor="death-manual-review-reason">Review reason</label>
          <textarea id="death-manual-review-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="crvs-form-grid" style={{ marginTop: 12 }}>
          <div className="crvs-form-group">
            <label htmlFor="death-manual-review-assignee">Assigned staff</label>
            <input id="death-manual-review-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name of reviewing supervisor" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="death-manual-review-priority">Priority</label>
            <select id="death-manual-review-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="death-manual-review-notes">Notes (optional)</label>
          <textarea id="death-manual-review-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="death-manual-review-cancel" />
          <Button text="Assign" appearance="primary" onClick={handleSubmit} loading={submitting} testId="death-manual-review-confirm" />
        </div>
      </div>
    </Modal>
  );
}
