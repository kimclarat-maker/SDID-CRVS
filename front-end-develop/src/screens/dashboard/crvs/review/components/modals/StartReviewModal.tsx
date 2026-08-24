import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { BirthRegistrationCase } from "@/domain/crvs/types";

/**
 * Confirms taking the review lock on a case. Locking is a real side effect
 * (demoStartReview assigns reviewerId/reviewerName and can no longer be
 * picked up by another registrar), so this is a deliberate confirm step
 * rather than a bare button.
 */
export default function StartReviewModal({
  show,
  onClose,
  registrationCase,
  onConfirm,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
  onConfirm: () => Promise<void>;
}) {
  if (!registrationCase) return null;

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Start review"
      description={registrationCase.reference}
      confirmLabel="Start review"
      cancelLabel="Cancel"
      testId="start-review-modal"
    >
      <p style={{ margin: 0 }}>
        You're about to start reviewing <strong>{registrationCase.reference}</strong>.
      </p>
      <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "var(--font-size-body-sm)" }}>
        {registrationCase.reviewerId
          ? `Currently assigned to ${registrationCase.reviewerName || "another registrar"}.`
          : "This case is not currently assigned to anyone."}
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Starting review assigns this case to you and locks it so no other registrar can start reviewing it at the
        same time.
      </div>
    </ConfirmActionModal>
  );
}
