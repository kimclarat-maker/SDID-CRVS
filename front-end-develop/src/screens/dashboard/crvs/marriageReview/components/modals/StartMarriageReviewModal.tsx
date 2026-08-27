import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { MarriageApplication } from "@/domain/crvs/types";

export default function StartMarriageReviewModal({
  show,
  onClose,
  application,
  onConfirm,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication | undefined;
  onConfirm: () => Promise<void>;
}) {
  if (!application) return null;
  return (
    <ConfirmActionModal show={show} onClose={onClose} onConfirm={onConfirm} title="Start eligibility review" description={application.reference} confirmLabel="Start review" testId="start-marriage-review-modal">
      <p style={{ margin: 0 }}>
        You're about to start reviewing <strong>{application.reference}</strong>.
      </p>
      <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "var(--font-size-body-sm)" }}>
        {application.reviewerId ? `Currently assigned to ${application.reviewerName || "another registrar"}.` : "This application is not currently assigned to anyone."}
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Starting review assigns this application to you and locks it so no other registrar can start reviewing it at the same time.
      </div>
    </ConfirmActionModal>
  );
}
