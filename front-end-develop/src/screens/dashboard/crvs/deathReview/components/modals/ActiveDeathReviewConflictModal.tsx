import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";
import { DeathRegistrationCase } from "@/domain/crvs/types";

export default function ActiveDeathReviewConflictModal({ show, onClose, deathCase }: { show: boolean; onClose: () => void; deathCase: DeathRegistrationCase | undefined }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="This case is already being reviewed"
      testId="active-death-review-conflict-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's exceptions queue.")}
    >
      <p style={{ margin: 0 }}>
        {deathCase ? (
          <>
            <strong>{deathCase.reference}</strong> is currently locked to <strong>{deathCase.reviewerName || "another registrar"}</strong>. You can&apos;t start a review on it until they
            finish or it&apos;s reassigned.
          </>
        ) : (
          "This case is currently locked to another registrar."
        )}
      </p>
    </WarningModal>
  );
}
