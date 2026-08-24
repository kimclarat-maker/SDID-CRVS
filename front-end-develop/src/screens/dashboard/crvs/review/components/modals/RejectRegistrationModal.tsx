import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Checkbox from "@/components/checkbox";
import { BirthRegistrationCase, RejectionReason } from "@/domain/crvs/types";
import { demoRejectRegistration } from "@/demo/services/crvsRegistrations";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Insufficient evidence", label: "Insufficient evidence" },
  { value: "Duplicate record", label: "Duplicate record" },
  { value: "Jurisdiction mismatch", label: "Jurisdiction mismatch" },
  { value: "Other", label: "Other" },
];

/**
 * Rejection is terminal (REJECTED has no outgoing transitions in
 * statusMachines.ts), so this requires: a structured reason, a mandatory
 * detailed explanation, an explicit "applicant notified" toggle, and a
 * final confirmation checkbox (StructuredReasonModal's requireConfirmation)
 * before the destructive submit is enabled.
 */
export default function RejectRegistrationModal({
  show,
  onClose,
  registrationCase,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
  accountId: string;
  actorName: string;
  onRejected: (updated: BirthRegistrationCase) => void;
}) {
  const [applicantNotified, setApplicantNotified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  if (!registrationCase) return null;

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const rejectionReason: RejectionReason = {
      reason,
      explanation: note,
      evidenceRefs: [],
      applicantNotified,
    };
    const updated = demoRejectRegistration(registrationCase.id, rejectionReason, accountId, actorName);
    onRejected(updated);
    setShowSuccess(true);
    setApplicantNotified(false);
  };

  return (
    <>
      <StructuredReasonModal
        show={show}
        onClose={onClose}
        onSubmit={handleSubmit}
        title="Reject registration"
        description={registrationCase.reference}
        reasonOptions={REASON_OPTIONS}
        noteLabel="Detailed explanation"
        noteRequired
        requireConfirmation
        confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
        submitLabel="Reject registration"
        destructive
        testId="reject-registration-modal"
      >
        <Checkbox
          label="The applicant has been notified of this rejection"
          checked={applicantNotified}
          onChange={() => setApplicantNotified((v) => !v)}
          testId="reject-registration-applicant-notified"
        />
      </StructuredReasonModal>

      <SuccessModal
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registration rejected"
        description={`${registrationCase.reference} has been rejected.`}
        primaryLabel="Back to review queue"
        onPrimary={() => {
          setShowSuccess(false);
          navigate("/dashboard/crvs/review");
        }}
        testId="reject-registration-success-modal"
      />
    </>
  );
}
