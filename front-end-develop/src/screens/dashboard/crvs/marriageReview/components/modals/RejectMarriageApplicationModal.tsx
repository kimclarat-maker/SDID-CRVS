import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Checkbox from "@/components/checkbox";
import { MarriageApplication, MarriageRejectionReason } from "@/domain/crvs/types";
import { demoRejectMarriageApplication } from "@/demo/services/crvsMarriageApplications";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Insufficient evidence", label: "Insufficient evidence" },
  { value: "Ineligible under policy", label: "Ineligible under policy" },
  { value: "Existing-marriage conflict unresolved", label: "Existing-marriage conflict unresolved" },
  { value: "Objection upheld", label: "Objection upheld" },
  { value: "Other", label: "Other" },
];

export default function RejectMarriageApplicationModal({
  show,
  onClose,
  application,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication | undefined;
  accountId: string;
  actorName: string;
  onRejected: (updated: MarriageApplication) => void;
}) {
  const [applicantsNotified, setApplicantsNotified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  if (!application) return null;

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const rejectionReason: MarriageRejectionReason = { reason, explanation: note, evidenceRefs: [], applicantsNotified };
    const updated = demoRejectMarriageApplication(application.id, rejectionReason, accountId, actorName);
    onRejected(updated);
    setShowSuccess(true);
    setApplicantsNotified(false);
  };

  return (
    <>
      <StructuredReasonModal
        show={show}
        onClose={onClose}
        onSubmit={handleSubmit}
        title="Reject marriage application"
        description={application.reference}
        reasonOptions={REASON_OPTIONS}
        noteLabel="Detailed explanation"
        noteRequired
        requireConfirmation
        confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
        submitLabel="Reject application"
        destructive
        testId="reject-marriage-application-modal"
      >
        <Checkbox label="Both applicants have been notified of this rejection" checked={applicantsNotified} onChange={() => setApplicantsNotified((v) => !v)} testId="reject-marriage-applicants-notified" />
      </StructuredReasonModal>

      <SuccessModal
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Application rejected"
        description={`${application.reference} has been rejected.`}
        primaryLabel="Back to marriage review queue"
        onPrimary={() => {
          setShowSuccess(false);
          navigate("/dashboard/crvs/marriage-review");
        }}
        testId="reject-marriage-success-modal"
      />
    </>
  );
}
