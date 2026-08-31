import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Icon from "@/components/icon";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoRegisterAnnulment } from "@/demo/services/crvsAnnulmentRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { affectedPartiesLabel, formatDate, marriageReferenceLabel, todayIsoDate } from "../../../annulmentShared";

/**
 * The separate, final registration step (spec §22). Only reachable once the
 * case is APPROVED. Explains exactly what registering will do — spelled out
 * plainly rather than implied — and never shows a celebratory/decorative
 * animation on success, just a plain confirmation (spec: this is a permanent
 * legal record, not a moment to celebrate visually).
 */
export default function RegisterAnnulmentModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onRegistered,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration | undefined;
  accountId: string;
  actorName: string;
  onRegistered: (updated: AnnulmentRegistration) => void;
}) {
  const navigate = useNavigate();
  const [effectiveDate, setEffectiveDate] = useState(
    registration?.legalEffect.effectiveDate?.slice(0, 10) || registration?.decision.finalityDate?.slice(0, 10) || todayIsoDate()
  );
  const [registered, setRegistered] = useState<AnnulmentRegistration | undefined>();

  if (!registration) return null;

  const handleConfirm = async () => {
    if (!effectiveDate) throw new Error("An effective date is required to register this annulment.");
    if (registration.decision.decisionDate && effectiveDate < registration.decision.decisionDate.slice(0, 10)) {
      throw new Error("The effective date cannot precede the decision date.");
    }
    const updated = await demoRegisterAnnulment(registration.id, effectiveDate, accountId, actorName);
    toastMessage("success", `Annulment ${updated.registrationEvent?.registrationNumber || updated.reference} registered.`);
    onRegistered(updated);
    setRegistered(updated);
    onClose();
  };

  return (
    <>
      <ConfirmActionModal
        show={show}
        onClose={onClose}
        onConfirm={handleConfirm}
        title="Register annulment"
        description={registration.reference}
        confirmLabel="Register annulment"
        cancelLabel="Not yet"
        testId="register-annulment-modal"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="crvs-form-grid">
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Affected persons</div>
              <div>{affectedPartiesLabel(registration)}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Marriage to be annulled</div>
              <div>{marriageReferenceLabel(registration)}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Decision</div>
              <div>{registration.decision.decisionNumber || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Final on</div>
              <div>{registration.decision.finalityDate ? formatDate(registration.decision.finalityDate) : "Not reported"}</div>
            </div>
          </div>

          <div className="crvs-form-group">
            <label htmlFor="register-annulment-effective-date">Effective date of the annulment</label>
            <input id="register-annulment-effective-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} data-testid="register-annulment-effective-date" />
          </div>

          <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Icon name="warning" />
            <div>
              <p style={{ margin: 0 }}>Registering is final and cannot be undone from this screen. It will:</p>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                <li>Create an immutable annulment registration record.</li>
                <li>Change the marriage&apos;s civil status to annulled, while preserving its full original registration history — nothing is deleted or overwritten.</li>
                <li>Trigger two separate SDID identity updates, one for each affected party, each independently synchronized and independently retryable.</li>
                <li>Change the existing marriage certificate&apos;s eligibility going forward.</li>
                <li>Create permanent audit events for every one of the above.</li>
              </ul>
            </div>
          </div>
        </div>
      </ConfirmActionModal>

      <SuccessModal
        show={!!registered}
        onClose={() => setRegistered(undefined)}
        title="Annulment registered"
        description={`${registered?.registrationEvent?.registrationNumber || ""} — ${affectedPartiesLabel(registration)}`}
        primaryLabel="Back to review queue"
        onPrimary={() => {
          setRegistered(undefined);
          navigate("/dashboard/crvs/annulment-review");
        }}
        testId="register-annulment-success-modal"
      >
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Identity synchronization runs independently for each affected party. Any failure appears in the SDID tab and can be retried per party.
        </p>
      </SuccessModal>
    </>
  );
}
