import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthRegistrationCase, BirthRegistrationStatus } from "@/domain/crvs/types";
import { REGISTRATION_STATUS_LABELS, canTransitionRegistration } from "@/domain/crvs/statusMachines";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoResolveException, demoResolveLateRegistration } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";

const RESOLUTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "REVIEW_COMPLETE", label: "Review complete — return to Civil Registrar" },
  { value: "EVIDENCE_INSUFFICIENT", label: "Evidence insufficient — return for more evidence" },
  { value: "CLARIFICATION_NEEDED", label: "Clarification needed from declarant" },
  { value: "JURISDICTION_RESOLVED", label: "Jurisdiction conflict resolved" },
  { value: "DUPLICATE_CLEARED", label: "Duplicate concern cleared" },
  { value: "INELIGIBLE", label: "Case does not meet registration requirements" },
  { value: "OTHER", label: "Other" },
];

// Every status that could plausibly appear as the "next status" choice from
// either of the two states this modal resolves cases out of — narrowed for
// the current case down below via canTransitionRegistration() so an illegal
// transition is never offered, and REJECTED is stripped further unless the
// signed-in supervisor actually holds crvs.registration.reject (Supervisors
// don't by default — see src/constants/crvsRoles.ts).
const CANDIDATE_NEXT_STATUSES: BirthRegistrationStatus[] = [
  "UNDER_REVIEW",
  "LATE_REGISTRATION_REVIEW",
  "CORRECTION_REQUIRED",
  "REJECTED",
];

export default function ResolveExceptionModal({
  show,
  onClose,
  title,
  registrationCase,
  actorName,
  presetType,
  presetNextStatus,
  onResolved,
}: {
  show: boolean;
  onClose: () => void;
  title: string;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  /** Pre-selects (and locks) the resolution "type" — used when this modal is
   * opened from a dedicated action button (e.g. "Reject") rather than the
   * generic "Resolve exception" entry point. */
  presetType?: string;
  /** Pre-selects (and locks) the next workflow status for the same reason. */
  presetNextStatus?: BirthRegistrationStatus;
  onResolved: (updated: BirthRegistrationCase) => void;
}) {
  const allowedNextStatuses = useMemo(() => {
    return CANDIDATE_NEXT_STATUSES.filter((status) => {
      if (!canTransitionRegistration(registrationCase.status, status)) return false;
      if (status === "REJECTED" && !hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_REJECT)) {
        return false;
      }
      return true;
    });
  }, [registrationCase.status]);

  const [type, setType] = useState(presetType || RESOLUTION_TYPE_OPTIONS[0].value);
  const [nextStatus, setNextStatus] = useState<BirthRegistrationStatus>(
    presetNextStatus || allowedNextStatuses[0] || "UNDER_REVIEW"
  );
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const reset = () => {
    setType(presetType || RESOLUTION_TYPE_OPTIONS[0].value);
    setNextStatus(presetNextStatus || allowedNextStatuses[0] || "UNDER_REVIEW");
    setReason("");
    setNote("");
    setFormError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setFormError("A reason is required to resolve this case.");
      return;
    }
    if (presetNextStatus && !canTransitionRegistration(registrationCase.status, presetNextStatus)) {
      setFormError(`This case can no longer move to ${REGISTRATION_STATUS_LABELS[presetNextStatus]}.`);
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      const resolve =
        registrationCase.status === "LATE_REGISTRATION_REVIEW" ? demoResolveLateRegistration : demoResolveException;
      const updated = await resolve(
        registrationCase.id,
        { type: presetType || type, reason: reason.trim(), note: note.trim() || undefined, nextStatus: presetNextStatus || nextStatus },
        actorName
      );
      toastMessage("success", "Case resolved.");
      onResolved(updated);
      reset();
      onClose();
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} show={show} handleClose={handleClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        {!presetType && (
          <div className="crvs-form-group">
            <label htmlFor="resolve-type">Resolution type</label>
            <select id="resolve-type" value={type} onChange={(e) => setType(e.target.value)}>
              {RESOLUTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="resolve-reason">Reason</label>
          <input id="resolve-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the resolution" />
        </div>

        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="resolve-note">Supporting note (optional)</label>
          <textarea id="resolve-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {!presetNextStatus && (
          <div className="crvs-form-group" style={{ marginTop: 12 }}>
            <label htmlFor="resolve-next-status">Next workflow status</label>
            <select id="resolve-next-status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as BirthRegistrationStatus)}>
              {allowedNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {REGISTRATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {allowedNextStatuses.length === 0 && (
              <p className="crvs-form-hint">No further transition is available for this case from its current status.</p>
            )}
          </div>
        )}

        {presetNextStatus && (
          <p className="crvs-form-hint" style={{ marginTop: 12 }}>
            This will move the case to <strong>{REGISTRATION_STATUS_LABELS[presetNextStatus]}</strong>.
          </p>
        )}

        {formError && <p className="crvs-form-error" style={{ marginTop: 12 }}>{formError}</p>}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="resolve-exception-cancel" />
          <Button
            text="Confirm"
            appearance="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!presetNextStatus && allowedNextStatuses.length === 0}
            testId="resolve-exception-confirm"
          />
        </div>
      </div>
    </Modal>
  );
}
