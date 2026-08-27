import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoAssignMarriageManualReview, MarriageSpouseKey } from "@/demo/services/crvsMarriageSdidSync";
import toastMessage from "@/utils/common/toastMessage";

const SPOUSE_LABEL: Record<MarriageSpouseKey, string> = { applicant1: "applicant 1", applicant2: "applicant 2" };

/** Assigns manual review to one spouse's sync sub-record (or, when
 * spouseKey is omitted, both) — mirrors DeathManualReviewModal's shape,
 * generalized over "which spouse" via the service's optional spouseKey
 * param. */
export default function MarriageManualReviewModal({
  show,
  onClose,
  application,
  spouseKey,
  actorName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  spouseKey?: MarriageSpouseKey;
  actorName: string;
  onAssigned: (updated: MarriageApplication) => void;
}) {
  const failureCode = spouseKey ? application.sdid[spouseKey].lastFailureCode : undefined;
  const [reason, setReason] = useState(failureCode ? `Synchronization failed: ${failureCode}` : "");
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
      demoAssignMarriageManualReview(application.id, { reason: reason.trim(), assignedTo: assignedTo.trim(), priority, notes: notes.trim() || undefined }, actorName, spouseKey);
      const updated = await demoGetMarriageApplication(application.id);
      toastMessage("success", spouseKey ? `${SPOUSE_LABEL[spouseKey]} placed into manual review.` : "Case placed into manual review.");
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
    <Modal title="Assign manual review" show={show} handleClose={handleClose} size="sm" testId="marriage-manual-review-modal">
      <div style={{ padding: "0 24px 24px" }}>
        {spouseKey && <p className="crvs-form-hint">Scoped to {SPOUSE_LABEL[spouseKey]} only — the other spouse's synchronization is unaffected.</p>}
        <div className="crvs-form-group">
          <label htmlFor="mr-manual-review-reason">Review reason</label>
          <textarea id="mr-manual-review-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="crvs-form-grid" style={{ marginTop: 12 }}>
          <div className="crvs-form-group">
            <label htmlFor="mr-manual-review-assignee">Assigned staff</label>
            <input id="mr-manual-review-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name of reviewing supervisor" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mr-manual-review-priority">Priority</label>
            <select id="mr-manual-review-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="mr-manual-review-notes">Notes (optional)</label>
          <textarea id="mr-manual-review-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="marriage-manual-review-cancel" />
          <Button text="Assign" appearance="primary" onClick={handleSubmit} loading={submitting} testId="marriage-manual-review-confirm" />
        </div>
      </div>
    </Modal>
  );
}
