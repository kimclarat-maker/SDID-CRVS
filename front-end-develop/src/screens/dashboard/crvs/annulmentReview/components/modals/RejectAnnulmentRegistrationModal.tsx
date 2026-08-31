import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Checkbox from "@/components/checkbox";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoRejectAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { activeEvidence } from "../../../annulmentShared";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Insufficient evidence", label: "Insufficient evidence" },
  { value: "Decision could not be verified", label: "Decision could not be verified" },
  { value: "Decision is not final", label: "Decision is not final" },
  { value: "Marriage record could not be identified", label: "Marriage record could not be identified" },
  { value: "Duplicate annulment already registered", label: "Duplicate annulment already registered" },
  { value: "Applicant not authorized to submit", label: "Applicant not authorized to submit" },
  { value: "Foreign-decision requirements not met", label: "Foreign-decision requirements not met" },
  { value: "Outside this office's jurisdiction", label: "Outside this office's jurisdiction" },
  { value: "Other", label: "Other" },
];

export default function RejectAnnulmentRegistrationModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration | undefined;
  accountId: string;
  actorName: string;
  onRejected: (updated: AnnulmentRegistration) => void;
}) {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  if (!registration) return null;

  const evidence = activeEvidence(registration.evidence);

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const updated = await demoRejectAnnulmentRegistration(registration.id, reason, note, accountId, actorName);
    toastMessage("success", `${updated.reference} rejected.`);
    onRejected(updated);
    setShowSuccess(true);
  };

  return (
    <>
      <StructuredReasonModal
        show={show}
        onClose={onClose}
        onSubmit={handleSubmit}
        title="Reject annulment registration"
        description={`${registration.reference} — rejection is final and cannot be undone from this screen.`}
        reasonOptions={REASON_OPTIONS}
        noteLabel="Detailed explanation for the applicant(s)"
        noteRequired
        requireConfirmation
        confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
        submitLabel="Reject registration"
        destructive
        testId="reject-annulment-registration-modal"
      >
        {evidence.length > 0 && (
          <div className="crvs-form-group">
            <label>Evidence on file (for reference)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {evidence.map((ev) => (
                <span key={ev.id} style={{ fontSize: "var(--font-size-body-sm)" }}>
                  {ev.documentType.replace(/_/g, " ")} — {ev.fileName}
                </span>
              ))}
            </div>
          </div>
        )}
      </StructuredReasonModal>

      <SuccessModal
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registration rejected"
        description={`${registration.reference} has been rejected.`}
        primaryLabel="Back to annulment review queue"
        onPrimary={() => {
          setShowSuccess(false);
          navigate("/dashboard/crvs/annulment-review");
        }}
        testId="reject-annulment-success-modal"
      />
    </>
  );
}
