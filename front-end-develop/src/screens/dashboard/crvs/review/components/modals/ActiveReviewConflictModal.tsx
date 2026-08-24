import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";
import { BirthRegistrationCase } from "@/domain/crvs/types";

/**
 * Shown instead of StartReviewModal when a case is already locked to
 * another registrar — either pre-emptively (queue/workspace check reviewerId
 * before opening StartReviewModal) or reactively when demoStartReview throws
 * because the lock changed between page load and the click. Reassignment
 * itself is out of scope for this slice (Supervisor's exceptions module
 * owns it) so "Request reassignment" is a toast stub only.
 */
export default function ActiveReviewConflictModal({
  show,
  onClose,
  registrationCase,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
}) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="This case is already being reviewed"
      testId="active-review-conflict-modal"
      primaryLabel="Request reassignment"
      onPrimary={() =>
        toastMessage("info", "Reassignment requests are handled from the Supervisor's exceptions queue.")
      }
    >
      <p style={{ margin: 0 }}>
        {registrationCase ? (
          <>
            <strong>{registrationCase.reference}</strong> is currently locked to{" "}
            <strong>{registrationCase.reviewerName || "another registrar"}</strong>. You can't start a review on it
            until they finish or it's reassigned.
          </>
        ) : (
          "This case is currently locked to another registrar."
        )}
      </p>
    </WarningModal>
  );
}
