import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { DeathRegistrationCase, DeathCorrectionItem, DeathReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestDeathCorrection } from "@/demo/services/crvsDeathRegistrations";
import { newLocalId } from "../../../deathShared";

const SECTION_OPTIONS: { value: DeathReviewSectionKey; label: string }[] = [
  { value: "DECEASED", label: "Deceased" },
  { value: "OCCURRENCE", label: "Occurrence" },
  { value: "MEDICAL_CERTIFICATION", label: "Medical certification" },
  { value: "DECLARANT", label: "Declarant" },
  { value: "NEXT_OF_KIN", label: "Next of kin" },
  { value: "WITNESSES", label: "Witnesses" },
  { value: "EVIDENCE", label: "Evidence" },
  { value: "IDENTITY_CHECK", label: "Identity check" },
  { value: "DUPLICATE_CHECK", label: "Duplicate check" },
  { value: "OFFICER_DECLARATION", label: "Officer declaration" },
];

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Missing information", label: "Missing information" },
  { value: "Illegible document", label: "Illegible document" },
  { value: "Mismatched identity details", label: "Mismatched identity details" },
  { value: "Incomplete evidence", label: "Incomplete evidence" },
  { value: "Other", label: "Other" },
];

export default function RequestDeathCorrectionModal({
  show,
  onClose,
  deathCase,
  actorName,
  onRequested,
  defaultSection,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  actorName: string;
  onRequested: (updated: DeathRegistrationCase) => void;
  defaultSection?: DeathReviewSectionKey;
}) {
  const [section, setSection] = useState<DeathReviewSectionKey>(defaultSection || "DECEASED");
  const [requiredEvidenceReplacement, setRequiredEvidenceReplacement] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notifyOfficer, setNotifyOfficer] = useState(true);

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: DeathCorrectionItem = {
      id: newLocalId("DCI"),
      section,
      fields,
      reason,
      note: note || undefined,
      requiredEvidenceReplacement,
      dueDate: dueDate || undefined,
      addressed: false,
    };
    const updated = demoRequestDeathCorrection(deathCase.id, { requestedBy: actorName, items: [item], notifyOfficer }, actorName);
    onRequested(updated);
    setRequiredEvidenceReplacement(false);
    setDueDate("");
    setNotifyOfficer(true);
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Request correction"
      description={deathCase.reference}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Details for the officer"
      noteRequired
      submitLabel="Request correction"
      testId="request-death-correction-modal"
    >
      <div className="crvs-form-group">
        <label>Affected section</label>
        <select value={section} onChange={(e) => setSection(e.target.value as DeathReviewSectionKey)}>
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <Checkbox label="Requires evidence replacement" checked={requiredEvidenceReplacement} onChange={() => setRequiredEvidenceReplacement((v) => !v)} testId="request-death-correction-evidence-replacement" />
      <div className="crvs-form-group">
        <label>Due date (optional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <Checkbox label="Notify officer immediately" checked={notifyOfficer} onChange={() => setNotifyOfficer((v) => !v)} testId="request-death-correction-notify-officer" />
    </StructuredReasonModal>
  );
}
