import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import Checkbox from "@/components/checkbox";
import { DivorceRegistration, DivorceRejectionReason } from "@/domain/crvs/types";
import { demoRejectDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { activeEvidence } from "../../../divorceShared";

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Insufficient evidence", label: "Insufficient evidence" },
  { value: "Court decision could not be verified", label: "Court decision could not be verified" },
  { value: "Judgment is not final", label: "Judgment is not final" },
  { value: "Marriage record could not be identified", label: "Marriage record could not be identified" },
  { value: "Duplicate divorce already registered", label: "Duplicate divorce already registered" },
  { value: "Applicant not authorized to submit", label: "Applicant not authorized to submit" },
  { value: "Foreign-decision requirements not met", label: "Foreign-decision requirements not met" },
  { value: "Outside this office's jurisdiction", label: "Outside this office's jurisdiction" },
  { value: "Other", label: "Other" },
];

export default function RejectDivorceRegistrationModal({
  show,
  onClose,
  registration,
  accountId,
  actorName,
  onRejected,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration | undefined;
  accountId: string;
  actorName: string;
  onRejected: (updated: DivorceRegistration) => void;
}) {
  const navigate = useNavigate();
  const [applicantsNotified, setApplicantsNotified] = useState(false);
  const [evidenceRefs, setEvidenceRefs] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!registration) return null;

  const evidence = activeEvidence(registration.evidence);

  const toggleEvidence = (id: string) => setEvidenceRefs((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const handleSubmit = async ({ reason, note }: { reason: string; fields: string[]; note: string }) => {
    const rejectionReason: DivorceRejectionReason = { reason, explanation: note, evidenceRefs, applicantsNotified };
    const updated = demoRejectDivorceRegistration(registration.id, rejectionReason, accountId, actorName);
    toastMessage("success", `${updated.reference} rejected.`);
    onRejected(updated);
    setShowSuccess(true);
    setApplicantsNotified(false);
    setEvidenceRefs([]);
  };

  return (
    <>
      <StructuredReasonModal
        show={show}
        onClose={onClose}
        onSubmit={handleSubmit}
        title="Reject divorce registration"
        description={`${registration.reference} — rejection is final and cannot be undone from this screen.`}
        reasonOptions={REASON_OPTIONS}
        noteLabel="Detailed explanation for the applicant"
        noteRequired
        requireConfirmation
        confirmationLabel="I understand this rejection is final and cannot be undone from this screen."
        submitLabel="Reject registration"
        destructive
        testId="reject-divorce-registration-modal"
      >
        {evidence.length > 0 && (
          <div className="crvs-form-group">
            <label>Evidence this rejection relies on (optional)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {evidence.map((ev) => (
                <label key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                  <input type="checkbox" checked={evidenceRefs.includes(ev.id)} onChange={() => toggleEvidence(ev.id)} />
                  {ev.documentType.replace(/_/g, " ")} — {ev.fileName}
                </label>
              ))}
            </div>
          </div>
        )}
        <Checkbox label="The applicant has been notified of this rejection" checked={applicantsNotified} onChange={() => setApplicantsNotified((v) => !v)} testId="reject-divorce-applicants-notified" />
      </StructuredReasonModal>

      <SuccessModal
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registration rejected"
        description={`${registration.reference} has been rejected.`}
        primaryLabel="Back to divorce review queue"
        onPrimary={() => {
          setShowSuccess(false);
          navigate("/dashboard/crvs/divorce-review");
        }}
        testId="reject-divorce-success-modal"
      />
    </>
  );
}
