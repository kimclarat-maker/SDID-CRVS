import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { AnnulmentLegalEffectClassification, AnnulmentRegistration } from "@/domain/crvs/types";
import { demoConfirmAnnulmentLegalEffectClassification } from "@/demo/services/crvsAnnulmentLegalEffect";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

const CLASSIFICATION_KEYS = Object.keys(annulmentPolicyConfig.legalEffectClassifications) as AnnulmentLegalEffectClassification[];

/**
 * The single place a legal-effect classification becomes authoritative
 * (spec §2/§17) — gated on annulment.legal_effect.classify. When the chosen
 * classification's requiresSupervisorReview flag (annulmentPolicyConfig) is
 * true, this surfaces that clearly rather than silently confirming it.
 */
export default function SelectLegalEffectClassificationModal({
  show,
  onClose,
  registration,
  actorName,
  onConfirmed,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration | undefined;
  actorName: string;
  onConfirmed: (updated: AnnulmentRegistration) => void;
}) {
  const [classification, setClassification] = useState<AnnulmentLegalEffectClassification | "">("");
  const [note, setNote] = useState("");

  if (!registration) return null;

  const locked = !!registration.legalEffect.lockedAt;
  const selectedMeta = classification ? annulmentPolicyConfig.legalEffectClassifications[classification] : undefined;

  const handleClose = () => {
    setClassification("");
    setNote("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!classification) throw new Error("Select a legal-effect classification.");
    const updated = await demoConfirmAnnulmentLegalEffectClassification(registration.id, classification, actorName, note.trim() || undefined);
    toastMessage("success", `Legal-effect classification confirmed for ${updated.reference}.`);
    onConfirmed(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Confirm legal-effect classification"
      description={registration.reference}
      confirmLabel="Confirm classification"
      disabled={!classification || locked}
      testId="select-legal-effect-classification-modal"
    >
      {locked ? (
        <div className="crvs-banner crvs-banner-warning">
          The legal-effect classification is locked because this case has already been approved. It can no longer be changed.
        </div>
      ) : (
        <>
          {registration.legalEffect.wordingFromDecision && (
            <div className="crvs-banner crvs-banner-info" style={{ marginBottom: 12 }}>
              <strong>Wording from the decision:</strong> &ldquo;{registration.legalEffect.wordingFromDecision}&rdquo;
            </div>
          )}
          {registration.legalEffect.proposedClassification && (
            <p className="crvs-form-hint" style={{ margin: "0 0 12px" }}>
              Proposed (suggestion only, not authoritative): {annulmentPolicyConfig.legalEffectClassifications[registration.legalEffect.proposedClassification].label}.
            </p>
          )}
          <div className="crvs-form-group">
            <label htmlFor="select-legal-effect-classification">Legal-effect classification</label>
            <select
              id="select-legal-effect-classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value as AnnulmentLegalEffectClassification)}
              data-testid="select-legal-effect-classification"
            >
              <option value="">Select a classification…</option>
              {CLASSIFICATION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {annulmentPolicyConfig.legalEffectClassifications[key].label}
                </option>
              ))}
            </select>
          </div>
          {selectedMeta?.requiresSupervisorReview && (
            <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Icon name="warning" />
              <span>This classification requires supervisor legal review before the case can proceed.</span>
            </div>
          )}
          <div className="crvs-form-group" style={{ marginTop: 12 }}>
            <label htmlFor="select-legal-effect-classification-note">Note (optional)</label>
            <textarea id="select-legal-effect-classification-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-testid="select-legal-effect-classification-note" />
          </div>
        </>
      )}
    </ConfirmActionModal>
  );
}
