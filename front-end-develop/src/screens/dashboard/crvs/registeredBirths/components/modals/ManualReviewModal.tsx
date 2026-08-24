import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { demoAssignManualReview } from "@/demo/services/crvsSdidSync";
import toastMessage from "@/utils/common/toastMessage";

/** Places a FAILED (or already-failed) synchronization into manual review.
 * No real staff directory exists for this demo — "assigned staff" is free
 * text, same convention as ReassignCaseModal. */
export default function ManualReviewModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  onAssigned: (updated: BirthRegistrationCase) => void;
}) {
  const [reason, setReason] = useState(registrationCase.sdid.lastFailureCode ? `Synchronization failed: ${registrationCase.sdid.lastFailureCode}` : "");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

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
      await demoAssignManualReview(
        registrationCase.id,
        { reason: reason.trim(), assignedTo: assignedTo.trim(), priority, notes: notes.trim() || undefined },
        actorName
      );
      const updated = await demoGetRegistration(registrationCase.id);
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
    <Modal title="Assign manual review" show={show} handleClose={handleClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-group">
          <label htmlFor="manual-review-reason">Review reason</label>
          <textarea id="manual-review-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="crvs-form-grid" style={{ marginTop: 12 }}>
          <div className="crvs-form-group">
            <label htmlFor="manual-review-assignee">Assigned staff</label>
            <input
              id="manual-review-assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Name of reviewing officer"
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="manual-review-priority">Priority</label>
            <select id="manual-review-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="manual-review-notes">Notes (optional)</label>
          <textarea id="manual-review-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="manual-review-cancel" />
          <Button text="Assign" appearance="primary" onClick={handleSubmit} loading={submitting} testId="manual-review-confirm" />
        </div>
      </div>
    </Modal>
  );
}
