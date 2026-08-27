import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoApproveMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import toastMessage from "@/utils/common/toastMessage";
import { applicantDisplayName, formatDate } from "../../../marriageShared";

/**
 * Final, high-risk confirm step. Two checkboxes gate the confirm button;
 * demoApproveMarriageApplication enforces the "did not prepare" confirmation
 * server-side too. Approving here is eligibility approval only — it does
 * NOT register the marriage (spec §1/§3: registration only happens after a
 * successful ceremony outcome, recorded separately by an authorized Civil
 * Registrar in the ceremony workspace).
 */
export default function ApproveMarriageApplicationModal({
  show,
  onClose,
  application,
  accountId,
  actorName,
  onApproved,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication | undefined;
  accountId: string;
  actorName: string;
  onApproved: (updated: MarriageApplication) => void;
}) {
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false);
  const [didNotPrepareConfirmed, setDidNotPrepareConfirmed] = useState(false);

  if (!application) return null;

  const handleClose = () => {
    setReviewedConfirmed(false);
    setDidNotPrepareConfirmed(false);
    onClose();
  };

  const handleConfirm = async () => {
    const updated = demoApproveMarriageApplication(application.id, accountId, actorName, didNotPrepareConfirmed);
    toastMessage("success", `${updated.reference} approved — now ${updated.status.replace(/_/g, " ").toLowerCase()}.`);
    onApproved(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Approve marriage application"
      description={application.reference}
      confirmLabel="Approve"
      cancelLabel="Cancel"
      disabled={!reviewedConfirmed || !didNotPrepareConfirmed}
      testId="approve-marriage-application-modal"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Applicant 1</div>
            <div>{applicantDisplayName(application.applicant1)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Applicant 2</div>
            <div>{applicantDisplayName(application.applicant2)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Proposed date</div>
            <div>{formatDate(application.proposedMarriageDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-caption)", color: "var(--text-muted)" }}>Jurisdiction</div>
            <div>{application.jurisdiction}</div>
          </div>
        </div>

        <div className="crvs-banner crvs-banner-info" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="info" />
          <span>
            Approving this application does not register the marriage. Next: an appointment must be scheduled and a
            successful ceremony outcome recorded before registration can occur.
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)" }}>
          By approving, I declare that I have reviewed every section of this application and confirm the information is
          complete and accurate to the best of my knowledge as the reviewing Civil Registrar.
        </p>
        <Checkbox label="I confirm the above and want to approve this application." checked={reviewedConfirmed} onChange={() => setReviewedConfirmed((c) => !c)} testId="approve-marriage-review-confirm" />
        <Checkbox
          label="I confirm that I did not prepare this application."
          checked={didNotPrepareConfirmed}
          onChange={() => setDidNotPrepareConfirmed((c) => !c)}
          testId="approve-marriage-no-conflict-confirm"
        />
      </div>
    </ConfirmActionModal>
  );
}
