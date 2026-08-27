import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { DivorceRegistration } from "@/domain/crvs/types";
import { demoApproveDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { canApproveDivorceCase } from "@/utils/workspace/crvsRules";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate, formerSpousesLabel, marriageReferenceLabel } from "../../../divorceShared";

/**
 * Final, high-risk confirm step (spec §4/§17/§21). Two declarations gate the
 * confirm button — "I did not prepare this case" and "no conflict of
 * interest" — and demoApproveDivorceRegistration enforces both again, plus
 * the automatic canApproveDivorceCase() gate, on the service side.
 *
 * When canApproveDivorceCase() would reject, the modal renders a blocked
 * state naming every specific reason and leaves the confirm button disabled,
 * rather than letting the click fail with a generic error.
 *
 * Approval is legal-eligibility approval only: it does not register the
 * divorce and does not touch SDID. Registration is a separate explicit step.
 */
export default function ApproveDivorceRegistrationModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onApproved,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration | undefined;
  accountId: string;
  actorName: string;
  onApproved: (updated: DivorceRegistration) => void;
}) {
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false);
  const [didNotPrepareConfirmed, setDidNotPrepareConfirmed] = useState(false);
  const [noConflictConfirmed, setNoConflictConfirmed] = useState(false);
  const [note, setNote] = useState("");

  if (!registration) return null;

  const gate = canApproveDivorceCase(accountId, registration);

  const handleClose = () => {
    setReviewedConfirmed(false);
    setDidNotPrepareConfirmed(false);
    setNoConflictConfirmed(false);
    setNote("");
    onClose();
  };

  const handleConfirm = async () => {
    const updated = demoApproveDivorceRegistration(registration.id, accountId, actorName, didNotPrepareConfirmed, noConflictConfirmed, note.trim() || undefined);
    toastMessage("success", `${updated.reference} approved — it can now be registered.`);
    onApproved(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Approve divorce registration"
      description={registration.reference}
      confirmLabel="Approve"
      cancelLabel="Cancel"
      disabled={!gate.allowed || !reviewedConfirmed || !didNotPrepareConfirmed || !noConflictConfirmed}
      testId="approve-divorce-registration-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Former spouses</div>
            <div>{formerSpousesLabel(registration)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Marriage</div>
            <div>{marriageReferenceLabel(registration)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Judgment</div>
            <div>
              {registration.judgment.judgmentNumber || "—"} · {registration.judgment.courtOrAuthorityName || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Final on</div>
            <div>{registration.judgment.finalityDate ? formatDate(registration.judgment.finalityDate) : "Not reported"}</div>
          </div>
        </div>

        {!gate.allowed && (
          <div className="crvs-banner crvs-banner-danger" role="alert" data-testid="approve-divorce-blocked">
            <strong>You can&apos;t approve this registration.</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {gate.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="info" />
          <span>
            Approving does not register this divorce and does not change either former spouse&apos;s identity record. A separate &ldquo;Register divorce&rdquo; action creates the registration number,
            annotates the marriage record as dissolved, and starts SDID synchronization.
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)" }}>
          By approving, I declare that I have reviewed every section of this case and that the court decision recorded here is final and correctly identified.
        </p>
        <Checkbox
          label="I confirm the above and want to approve this divorce registration."
          checked={reviewedConfirmed}
          disabled={!gate.allowed}
          onChange={() => setReviewedConfirmed((c) => !c)}
          testId="approve-divorce-review-confirm"
        />
        <Checkbox
          label="I confirm that I did not prepare this case."
          checked={didNotPrepareConfirmed}
          disabled={!gate.allowed}
          onChange={() => setDidNotPrepareConfirmed((c) => !c)}
          testId="approve-divorce-did-not-prepare"
        />
        <Checkbox
          label="I declare that I have no conflict of interest in this case."
          checked={noConflictConfirmed}
          disabled={!gate.allowed}
          onChange={() => setNoConflictConfirmed((c) => !c)}
          testId="approve-divorce-no-conflict"
        />

        <div className="crvs-form-group">
          <label htmlFor="approve-divorce-note">Approval note (optional)</label>
          <textarea id="approve-divorce-note" rows={2} value={note} disabled={!gate.allowed} onChange={(e) => setNote(e.target.value)} data-testid="approve-divorce-note" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}
