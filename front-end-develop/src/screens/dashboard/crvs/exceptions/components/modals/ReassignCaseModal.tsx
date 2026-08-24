import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { CRVS_ROLE_LABELS } from "@/constants/crvsRoles";
import { getAssignmentForWorkspace } from "@/utils/workspace";
import { demoReassignCase } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";

const SUGGESTED_ASSIGNEES = Object.values(CRVS_ROLE_LABELS);

/** Reassigns a case to another officer/supervisor. This is a demo — there is
 * no real staff directory, so the "new assignee" is free text (optionally
 * picked from the CRVS role labels as a starting point) rather than a lookup
 * against real accounts. Jurisdiction mismatch is surfaced as a warning, not
 * a hard block (spec: "don't hard-block"). */
export default function ReassignCaseModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onReassigned,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  onReassigned: (updated: BirthRegistrationCase) => void;
}) {
  const [newAssigneeName, setNewAssigneeName] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const supervisorJurisdiction = getAssignmentForWorkspace("CRVS")?.jurisdiction;
  const jurisdictionMismatch =
    !!supervisorJurisdiction &&
    supervisorJurisdiction.level !== "NATIONAL" &&
    (supervisorJurisdiction.name || supervisorJurisdiction.id) !== registrationCase.jurisdiction;

  const reset = () => {
    setNewAssigneeName("");
    setReason("");
    setPriority("MEDIUM");
    setNote("");
    setFormError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!newAssigneeName.trim()) {
      setFormError("Enter who this case should be reassigned to.");
      return;
    }
    if (!reason.trim()) {
      setFormError("A reason for reassignment is required.");
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      const newAssigneeId = newAssigneeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
      const fullReason = `${reason.trim()}${priority ? ` [Priority: ${priority}]` : ""}${
        note.trim() ? ` — ${note.trim()}` : ""
      }`;
      const updated = await demoReassignCase(registrationCase.id, newAssigneeId, newAssigneeName.trim(), fullReason, actorName);
      toastMessage("success", `Case reassigned to ${newAssigneeName.trim()}.`);
      onReassigned(updated);
      reset();
      onClose();
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Reassign case" show={show} handleClose={handleClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        {jurisdictionMismatch && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: 16 }}>
            This case's jurisdiction ({registrationCase.jurisdiction}) differs from your assigned jurisdiction
            ({supervisorJurisdiction?.name || supervisorJurisdiction?.id}). Confirm reassignment is intended before continuing.
          </div>
        )}

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label>Current assignee</label>
            <input value={registrationCase.reviewerName || "Unassigned"} disabled readOnly />
          </div>

          <div className="crvs-form-group">
            <label htmlFor="reassign-new-assignee">New assignee</label>
            <input
              id="reassign-new-assignee"
              list="reassign-assignee-suggestions"
              value={newAssigneeName}
              onChange={(e) => setNewAssigneeName(e.target.value)}
              placeholder="Name of officer or supervisor"
            />
            <datalist id="reassign-assignee-suggestions">
              {SUGGESTED_ASSIGNEES.map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
          </div>

          <div className="crvs-form-group">
            <label htmlFor="reassign-priority">Priority</label>
            <select id="reassign-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="reassign-reason">Reason for reassignment</label>
          <input
            id="reassign-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Workload balancing, subject-matter expertise"
          />
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="reassign-note">Note (optional)</label>
          <textarea id="reassign-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="reassign-cancel" />
          <Button text="Reassign" appearance="primary" onClick={handleSubmit} loading={submitting} testId="reassign-confirm" />
        </div>
      </div>
    </Modal>
  );
}
