import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthRegistrationCase, DuplicateResolutionType } from "@/domain/crvs/types";
import { demoResolveDuplicate } from "@/demo/services/crvsDuplicateCheck";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";

const RESOLUTION_OPTIONS: { value: DuplicateResolutionType; label: string; hint: string }[] = [
  { value: "NOT_DUPLICATE", label: "Not a duplicate", hint: "The matched candidate is a different person." },
  { value: "LINKED", label: "Confirm duplicate — link existing record", hint: "This case matches an existing registered record." },
  { value: "RETURNED_FOR_CORRECTION", label: "Return for correction", hint: "Send back for the officer to clarify or amend details." },
  { value: "ESCALATED", label: "Escalate", hint: "Refer this match for further investigation." },
];

/** Resolves a POTENTIAL/PROBABLE duplicate match found on a case. Candidate
 * summaries are already masked by the duplicate-detection service
 * (DuplicateCandidate.maskedSummary) — this never displays unmasked
 * identity fields. */
export default function PotentialDuplicateResolutionModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  onResolved: (updated: BirthRegistrationCase) => void;
}) {
  const candidates = registrationCase.duplicateCheck?.candidates || [];
  const [type, setType] = useState<DuplicateResolutionType>("NOT_DUPLICATE");
  const [linkedCaseId, setLinkedCaseId] = useState(candidates[0]?.caseId || "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const reset = () => {
    setType("NOT_DUPLICATE");
    setLinkedCaseId(candidates[0]?.caseId || "");
    setReason("");
    setFormError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setFormError("A reason is required to resolve this duplicate match.");
      return;
    }
    if (type === "LINKED" && !linkedCaseId) {
      setFormError("Select which existing record this case should be linked to.");
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      demoResolveDuplicate(
        registrationCase.id,
        { type, reason: reason.trim(), linkedCaseId: type === "LINKED" ? linkedCaseId : undefined },
        actorName
      );
      const updated = await demoGetRegistration(registrationCase.id);
      toastMessage("success", "Duplicate match resolved.");
      if (updated) onResolved(updated);
      reset();
      onClose();
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Resolve potential duplicate" show={show} handleClose={handleClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint">
          Overall match level: <strong>{registrationCase.duplicateCheck?.overallLevel || "—"}</strong>
        </p>

        <div className="crvs-card-grid" style={{ marginTop: 8, marginBottom: 16 }}>
          {candidates.map((candidate) => (
            <div key={candidate.caseId} className="crvs-case-card">
              <div className="crvs-case-card-header">
                <strong>{candidate.reference}</strong>
                <span className="crvs-status-pill crvs-status-warning">{candidate.matchLevel}</span>
              </div>
              <div>{candidate.maskedSummary}</div>
              <div className="crvs-form-hint">Matched on: {candidate.matchedFields.join(", ")}</div>
              <div className="crvs-form-hint">Existing record status: {candidate.existingRecordStatus}</div>
            </div>
          ))}
          {candidates.length === 0 && <p className="crvs-form-hint">No candidate details were recorded for this check.</p>}
        </div>

        <div className="crvs-form-group">
          <label htmlFor="duplicate-resolution-type">Resolution</label>
          <select id="duplicate-resolution-type" value={type} onChange={(e) => setType(e.target.value as DuplicateResolutionType)}>
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="crvs-form-hint">{RESOLUTION_OPTIONS.find((o) => o.value === type)?.hint}</p>
        </div>

        {type === "LINKED" && candidates.length > 0 && (
          <div className="crvs-form-group" style={{ marginTop: 12 }}>
            <label htmlFor="duplicate-linked-case">Link to existing record</label>
            <select id="duplicate-linked-case" value={linkedCaseId} onChange={(e) => setLinkedCaseId(e.target.value)}>
              {candidates.map((candidate) => (
                <option key={candidate.caseId} value={candidate.caseId}>
                  {candidate.reference}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="duplicate-reason">Reason</label>
          <textarea
            id="duplicate-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Required — explain this resolution"
          />
        </div>

        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="duplicate-resolve-cancel" />
          <Button text="Confirm" appearance="primary" onClick={handleSubmit} loading={submitting} testId="duplicate-resolve-confirm" />
        </div>
      </div>
    </Modal>
  );
}
