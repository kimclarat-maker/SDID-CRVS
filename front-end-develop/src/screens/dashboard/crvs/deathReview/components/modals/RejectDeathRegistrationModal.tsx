import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Checkbox from "@/components/checkbox";
import { DeathRegistrationCase, DeathRejectionReason } from "@/domain/crvs/types";
import { demoRejectDeathRegistration } from "@/demo/services/crvsDeathRegistrations";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Insufficient evidence", label: "Insufficient evidence" },
  { value: "Duplicate record", label: "Duplicate record" },
  { value: "Jurisdiction mismatch", label: "Jurisdiction mismatch" },
  { value: "Other", label: "Other" },
];

export default function RejectDeathRegistrationModal({
  show,
  onClose,
  deathCase,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase | undefined;
  accountId: string;
  actorName: string;
  onRejected: (updated: DeathRegistrationCase) => void;
}) {
  const [declarantNotified, setDeclarantNotified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  if (!deathCase) return null;

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const rejectionReason: DeathRejectionReason = { reason, explanation: note, evidenceRefs: [], declarantNotified };
    const updated = demoRejectDeathRegistration(deathCase.id, rejectionReason, accountId, actorName);
    onRejected(updated);
    setShowSuccess(true);
    setDeclarantNotified(false);
  };

  return (
    <>
      <StructuredReasonModal
        show={show}
        onClose={onClose}
        onSubmit={handleSubmit}
        title="Reject death registration"
        description={deathCase.reference}
        reasonOptions={REASON_OPTIONS}
        noteLabel="Detailed explanation"
        noteRequired
        requireConfirmation
        confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
        submitLabel="Reject registration"
        destructive
        testId="reject-death-registration-modal"
      >
        <Checkbox label="The declarant has been notified of this rejection" checked={declarantNotified} onChange={() => setDeclarantNotified((v) => !v)} testId="reject-death-declarant-notified" />
      </StructuredReasonModal>

      <SuccessModal
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registration rejected"
        description={`${deathCase.reference} has been rejected.`}
        primaryLabel="Back to death review queue"
        onPrimary={() => {
          setShowSuccess(false);
          navigate("/dashboard/crvs/death-review");
        }}
        testId="reject-death-success-modal"
      />
    </>
  );
}
