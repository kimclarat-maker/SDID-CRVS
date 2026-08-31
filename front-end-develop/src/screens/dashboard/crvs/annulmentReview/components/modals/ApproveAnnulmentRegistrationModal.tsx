import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoApproveAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { canApproveAnnulmentCase } from "@/utils/workspace/crvsRules";
import toastMessage from "@/utils/common/toastMessage";
import { affectedPartiesLabel, formatDate, marriageReferenceLabel, LEGAL_EFFECT_CLASSIFICATION_LABELS } from "../../../annulmentShared";

/**
 * Final, high-risk legal-eligibility approve step (spec §5/§18/§22). Two
 * declarations gate the confirm button — "I did not prepare this case" and
 * "no conflict of interest" — and demoApproveAnnulmentRegistration enforces
 * both again, plus the automatic canApproveAnnulmentCase() gate (which
 * itself already blocks while the legal-effect classification is
 * unconfirmed), on the service side.
 *
 * When the legal-effect classification hasn't been confirmed yet, this modal
 * blocks with a clear, specific message rather than letting the submit call
 * fail generically — the classification decision must happen first, on the
 * Legal Effect tab.
 *
 * Approval is legal-eligibility approval only: it does not register the
 * annulment and does not touch SDID or the marriage record. Registration is
 * a separate, explicit step (RegisterAnnulmentModal).
 */
export default function ApproveAnnulmentRegistrationModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onApproved,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration | undefined;
  accountId: string;
  actorName: string;
  onApproved: (updated: AnnulmentRegistration) => void;
}) {
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false);
  const [didNotPrepareConfirmed, setDidNotPrepareConfirmed] = useState(false);
  const [noConflictConfirmed, setNoConflictConfirmed] = useState(false);
  const [note, setNote] = useState("");

  if (!registration) return null;

  const gate = canApproveAnnulmentCase(accountId, registration);
  const classification = registration.legalEffect.confirmedClassification;
  const canSubmit = gate.allowed && reviewedConfirmed && didNotPrepareConfirmed && noConflictConfirmed && note.trim().length > 0;

  const handleClose = () => {
    setReviewedConfirmed(false);
    setDidNotPrepareConfirmed(false);
    setNoConflictConfirmed(false);
    setNote("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!note.trim()) throw new Error("An approval note is required.");
    const updated = await demoApproveAnnulmentRegistration(registration.id, accountId, actorName, note.trim(), didNotPrepareConfirmed, noConflictConfirmed);
    toastMessage("success", `${updated.reference} approved — it can now be registered.`);
    onApproved(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Approve annulment registration"
      description={registration.reference}
      confirmLabel="Approve"
      cancelLabel="Cancel"
      disabled={!canSubmit}
      testId="approve-annulment-registration-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Affected persons</div>
            <div>{affectedPartiesLabel(registration)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Marriage</div>
            <div>{marriageReferenceLabel(registration)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Decision</div>
            <div>
              {registration.decision.decisionNumber || "—"} · {registration.decision.courtOrAuthorityName || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Final on</div>
            <div>{registration.decision.finalityDate ? formatDate(registration.decision.finalityDate) : "Not reported"}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Effective date</div>
            <div>{registration.legalEffect.effectiveDate ? formatDate(registration.legalEffect.effectiveDate) : "Not confirmed"}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Legal-effect classification</div>
            <div>{classification ? LEGAL_EFFECT_CLASSIFICATION_LABELS[classification] : "Not confirmed"}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Marriage-status consequence</div>
            <div>{registration.legalEffect.marriageStatusResult === "ANNULLED" ? "Marked annulled" : "Requires manual review"}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Certificate consequence</div>
            <div>{registration.legalEffect.certificateConsequence.replace(/_/g, " ").toLowerCase()}</div>
          </div>
        </div>

        <div className="crvs-banner crvs-banner-info">
          <strong>Proposed SDID consequences</strong>
          <div>Affected party 1: {registration.legalEffect.proposedSdid.party1.proposedCivilStatus.replace(/_/g, " ").toLowerCase()} — {registration.legalEffect.proposedSdid.party1.rationale}</div>
          <div>Affected party 2: {registration.legalEffect.proposedSdid.party2.proposedCivilStatus.replace(/_/g, " ").toLowerCase()} — {registration.legalEffect.proposedSdid.party2.rationale}</div>
        </div>

        {!classification && (
          <div className="crvs-banner crvs-banner-danger" role="alert" data-testid="approve-annulment-blocked-legal-effect">
            <strong>You can&apos;t approve this registration yet.</strong>
            <p style={{ margin: "4px 0 0" }}>The legal-effect classification has not been confirmed. Open the Legal Effect tab and confirm a classification before approving.</p>
          </div>
        )}

        {!gate.allowed && (
          <div className="crvs-banner crvs-banner-danger" role="alert" data-testid="approve-annulment-blocked">
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
            Approving does not register this annulment and does not change either affected party&apos;s identity record or the marriage record. A separate &ldquo;Register annulment&rdquo; action creates
            the registration number, annotates the marriage record as annulled, and starts SDID synchronization.
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)" }}>
          By approving, I declare that I have reviewed every section of this case, that the decision recorded here is final and correctly identified, and that the confirmed legal-effect classification is
          supported by the evidence on file.
        </p>
        <Checkbox
          label="I confirm the above and want to approve this annulment registration."
          checked={reviewedConfirmed}
          disabled={!gate.allowed || !classification}
          onChange={() => setReviewedConfirmed((c) => !c)}
          testId="approve-annulment-review-confirm"
        />
        <Checkbox
          label="I confirm that I did not prepare this case."
          checked={didNotPrepareConfirmed}
          disabled={!gate.allowed || !classification}
          onChange={() => setDidNotPrepareConfirmed((c) => !c)}
          testId="approve-annulment-did-not-prepare"
        />
        <Checkbox
          label="I declare that I have no conflict of interest in this case."
          checked={noConflictConfirmed}
          disabled={!gate.allowed || !classification}
          onChange={() => setNoConflictConfirmed((c) => !c)}
          testId="approve-annulment-no-conflict"
        />

        <div className="crvs-form-group">
          <label htmlFor="approve-annulment-note">Approval note (required)</label>
          <textarea id="approve-annulment-note" rows={2} value={note} disabled={!gate.allowed || !classification} onChange={(e) => setNote(e.target.value)} data-testid="approve-annulment-note" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}
