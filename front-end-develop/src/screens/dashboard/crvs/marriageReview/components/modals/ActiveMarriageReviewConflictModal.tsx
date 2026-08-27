import WarningModal from "@/components/crvs/modals/WarningModal";
import toastMessage from "@/utils/common/toastMessage";
import { MarriageApplication } from "@/domain/crvs/types";

export default function ActiveMarriageReviewConflictModal({ show, onClose, application }: { show: boolean; onClose: () => void; application: MarriageApplication | undefined }) {
  return (
    <WarningModal
      show={show}
      onClose={onClose}
      title="This application is already being reviewed"
      testId="active-marriage-review-conflict-modal"
      primaryLabel="Request reassignment"
      onPrimary={() => toastMessage("info", "Reassignment requests are handled from the Supervisor's marriage exceptions queue.")}
    >
      <p style={{ margin: 0 }}>
        {application ? (
          <>
            <strong>{application.reference}</strong> is currently locked to <strong>{application.reviewerName || "another registrar"}</strong>. You can&apos;t start a review on it until they
            finish or it&apos;s reassigned.
          </>
        ) : (
          "This application is currently locked to another registrar."
        )}
      </p>
    </WarningModal>
  );
}
