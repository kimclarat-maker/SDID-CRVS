import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Icon from "@/components/icon";
import { DivorceRegistration } from "@/domain/crvs/types";
import { demoRegisterDivorce } from "@/demo/services/crvsDivorceRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate, formerSpousesLabel, marriageReferenceLabel, todayIsoDate } from "../../../divorceShared";

/**
 * The separate, final registration step (spec §21) — only reachable once the
 * case is APPROVED. This is the point at which the registration number is
 * created, the existing marriage record is annotated as dissolved (never
 * deleted or overwritten), and SDID synchronization is enqueued for both
 * former spouses.
 */
export default function RegisterDivorceModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onRegistered,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration | undefined;
  accountId: string;
  actorName: string;
  onRegistered: (updated: DivorceRegistration) => void;
}) {
  const navigate = useNavigate();
  const [effectiveDate, setEffectiveDate] = useState(registration?.judgment.registrationEffectiveDate?.slice(0, 10) || registration?.judgment.finalityDate?.slice(0, 10) || todayIsoDate());
  const [registered, setRegistered] = useState<DivorceRegistration | undefined>();

  if (!registration) return null;

  const handleConfirm = async () => {
    if (!effectiveDate) throw new Error("An effective date is required to register this divorce.");
    if (registration.judgment.judgmentDate && effectiveDate < registration.judgment.judgmentDate.slice(0, 10)) {
      throw new Error("The effective date cannot precede the judgment date.");
    }
    const updated = demoRegisterDivorce(registration.id, effectiveDate, accountId, actorName);
    toastMessage("success", `Divorce ${updated.registrationEvent?.registrationNumber || updated.reference} registered.`);
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
        title="Register divorce"
        description={registration.reference}
        confirmLabel="Register divorce"
        cancelLabel="Not yet"
        testId="register-divorce-modal"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="crvs-form-grid">
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Former spouses</div>
              <div>{formerSpousesLabel(registration)}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Marriage to be dissolved</div>
              <div>{marriageReferenceLabel(registration)}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Judgment</div>
              <div>{registration.judgment.judgmentNumber || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Final on</div>
              <div>{registration.judgment.finalityDate ? formatDate(registration.judgment.finalityDate) : "Not reported"}</div>
            </div>
          </div>

          <div className="crvs-form-group">
            <label htmlFor="register-divorce-effective-date">Effective date of the divorce</label>
            <input id="register-divorce-effective-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} data-testid="register-divorce-effective-date" />
            <p className="crvs-form-hint">This date ends the marriage relationship on both former spouses&apos; identity records.</p>
          </div>

          <div className="crvs-banner crvs-banner-warning" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Icon name="warning" />
            <span>
              Registering is final and cannot be undone from this screen. It creates the divorce registration number, annotates the marriage record as dissolved by divorce — the original marriage record
              is never deleted or overwritten — and starts identity synchronization for both former spouses.
            </span>
          </div>
        </div>
      </ConfirmActionModal>

      <SuccessModal
        show={!!registered}
        onClose={() => setRegistered(undefined)}
        title="Divorce registered"
        description={`${registered?.registrationEvent?.registrationNumber || ""} — ${formerSpousesLabel(registration)}`}
        primaryLabel="Open the registered record"
        onPrimary={() => {
          const target = registered;
          setRegistered(undefined);
          if (target) navigate(`/dashboard/crvs/registered-divorces/${target.id}`);
        }}
        secondaryLabel="Back to review queue"
        onSecondary={() => {
          setRegistered(undefined);
          navigate("/dashboard/crvs/divorce-review");
        }}
        testId="register-divorce-success-modal"
      >
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Identity synchronization runs independently for each former spouse. Any failure appears in the synchronization-failures queue and can be retried per spouse.
        </p>
      </SuccessModal>
    </>
  );
}
