import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoUpdateAnnulmentRegistrationDraft } from "@/demo/services/crvsAnnulmentRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { todayIsoDate } from "../../../annulmentShared";

/**
 * Sets the staff-confirmed registration-facing effective date on the Legal
 * Effect tab (distinct from AnnulmentDecision.effectiveDate, the raw value
 * as first reported on the decision). There is no dedicated
 * "confirm-effective-date" service export yet, so this uses the existing
 * generic demoUpdateAnnulmentRegistrationDraft() patch — the same primitive
 * demoRegisterAnnulment() itself falls back to if no effective date was ever
 * confirmed here.
 */
export default function ConfirmEffectiveDateModal({
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
  const [effectiveDate, setEffectiveDate] = useState(
    registration?.legalEffect.effectiveDate?.slice(0, 10) || registration?.decision.effectiveDate?.slice(0, 10) || registration?.decision.finalityDate?.slice(0, 10) || todayIsoDate()
  );

  if (!registration) return null;

  const locked = !!registration.legalEffect.lockedAt;

  const handleConfirm = async () => {
    if (!effectiveDate) throw new Error("An effective date is required.");
    if (registration.decision.decisionDate && effectiveDate < registration.decision.decisionDate.slice(0, 10)) {
      throw new Error("The effective date cannot precede the decision date.");
    }
    const updated = await demoUpdateAnnulmentRegistrationDraft(registration.id, { legalEffect: { ...registration.legalEffect, effectiveDate } }, actorName);
    toastMessage("success", `Effective date confirmed for ${updated.reference}.`);
    onConfirmed(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Confirm effective date"
      description={registration.reference}
      confirmLabel="Confirm effective date"
      disabled={locked}
      testId="confirm-effective-date-modal"
    >
      {locked ? (
        <div className="crvs-banner crvs-banner-warning">The legal-effect classification is locked because this case has already been approved. The effective date can no longer be changed here.</div>
      ) : (
        <div className="crvs-form-group">
          <label htmlFor="confirm-effective-date-input">Effective date</label>
          <input id="confirm-effective-date-input" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} data-testid="confirm-effective-date-input" />
          <p className="crvs-form-hint">This is the registration-facing effective date used when the annulment is registered. It cannot precede the decision date.</p>
        </div>
      )}
    </ConfirmActionModal>
  );
}
