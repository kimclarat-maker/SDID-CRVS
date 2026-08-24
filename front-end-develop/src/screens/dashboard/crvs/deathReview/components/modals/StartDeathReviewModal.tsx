import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DeathRegistrationCase } from "@/domain/crvs/types";

export default function StartDeathReviewModal({
  show,
  onClose,
  deathCase,
  onConfirm,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase | undefined;
  onConfirm: () => Promise<void>;
}) {
  if (!deathCase) return null;
  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={onConfirm} title="Start review" description={deathCase.reference} confirmLabel="Start review" testId="start-death-review-modal">
      <p style={{ margin: 0 }}>
        You're about to start reviewing <strong>{deathCase.reference}</strong>.
      </p>
      <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "var(--font-size-body-sm)" }}>
        {deathCase.reviewerId ? `Currently assigned to ${deathCase.reviewerName || "another registrar"}.` : "This case is not currently assigned to anyone."}
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Starting review assigns this case to you and locks it so no other registrar can start reviewing it at the same time.
      </div>
    </ConfirmActionModal>
  );
}
