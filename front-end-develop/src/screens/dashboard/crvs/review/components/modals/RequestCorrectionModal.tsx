import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { BirthRegistrationCase, CorrectionItem, ReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestCorrection } from "@/demo/services/crvsRegistrations";
import toastMessage from "@/utils/common/toastMessage";
import { newLocalId } from "../../utils";

const SECTION_OPTIONS: { value: ReviewSectionKey; label: string }[] = [
  { value: "CHILD", label: "Child" },
  { value: "PARENTS", label: "Parents" },
  { value: "DECLARANT", label: "Declarant" },
  { value: "WITNESSES", label: "Witnesses" },
  { value: "EVIDENCE", label: "Evidence" },
  { value: "DUPLICATE_CHECK", label: "Duplicate check" },
  { value: "LATE_OR_EXCEPTION", label: "Late / exception" },
  { value: "OFFICER_DECLARATION", label: "Officer declaration" },
];

const SECTION_FIELD_OPTIONS: Record<ReviewSectionKey, ReasonOption[]> = {
  CHILD: [
    { value: "name", label: "Name" },
    { value: "sex", label: "Sex" },
    { value: "dateOfBirth", label: "Date of birth" },
    { value: "placeOfBirth", label: "Place of birth" },
  ],
  PARENTS: [
    { value: "mother", label: "Mother's details" },
    { value: "father", label: "Father's details" },
    { value: "documents", label: "Supporting documents" },
  ],
  DECLARANT: [
    { value: "relationship", label: "Relationship to child" },
    { value: "identity", label: "Identity document" },
    { value: "contact", label: "Contact details" },
  ],
  WITNESSES: [
    { value: "identity", label: "Witness identity" },
    { value: "details", label: "Witness details" },
  ],
  EVIDENCE: [
    { value: "missing", label: "Missing document" },
    { value: "illegible", label: "Illegible document" },
    { value: "mismatch", label: "Document mismatch" },
  ],
  DUPLICATE_CHECK: [{ value: "resolution", label: "Duplicate match resolution" }],
  LATE_OR_EXCEPTION: [
    { value: "delayReason", label: "Delay reason" },
    { value: "justification", label: "Supporting justification" },
  ],
  OFFICER_DECLARATION: [
    { value: "declaration", label: "Officer declaration" },
    { value: "privacy", label: "Privacy acknowledgement" },
  ],
};

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Missing information", label: "Missing information" },
  { value: "Illegible document", label: "Illegible document" },
  { value: "Mismatched identity details", label: "Mismatched identity details" },
  { value: "Incomplete evidence", label: "Incomplete evidence" },
  { value: "Other", label: "Other" },
];

/**
 * Requests a correction on one review section. Built on StructuredReasonModal
 * (spec calls for reusing it, not a bespoke form): the section picker and
 * the evidence-replacement/due-date/notify-officer toggles are rendered via
 * its `children` slot since those aren't part of the primitive's own props.
 * One CorrectionItem per request keeps this simple — a registrar who needs
 * to flag two sections opens the modal twice, which also keeps each
 * correction independently trackable/addressable.
 */
export default function RequestCorrectionModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onRequested,
  defaultSection,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase | undefined;
  actorName: string;
  onRequested: (updated: BirthRegistrationCase) => void;
  defaultSection?: ReviewSectionKey;
}) {
  const [section, setSection] = useState<ReviewSectionKey>(defaultSection || "CHILD");
  const [requiredEvidenceReplacement, setRequiredEvidenceReplacement] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notifyOfficer, setNotifyOfficer] = useState(true);

  if (!registrationCase) return null;

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: CorrectionItem = {
      id: newLocalId("CI"),
      section,
      fields,
      reason,
      note: note || undefined,
      requiredEvidenceReplacement,
      dueDate: dueDate || undefined,
      addressed: false,
    };
    const updated = demoRequestCorrection(
      registrationCase.id,
      { requestedBy: actorName, items: [item], notifyOfficer },
      actorName
    );
    toastMessage("success", "Correction requested. The case has moved to Correction required.");
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
      description={registrationCase.reference}
      reasonOptions={REASON_OPTIONS}
      fieldOptions={SECTION_FIELD_OPTIONS[section]}
      fieldsLabel="Specific fields (optional)"
      noteLabel="Details for the officer"
      noteRequired
      submitLabel="Request correction"
      testId="request-correction-modal"
    >
      <div className="crvs-form-group">
        <label>Affected section</label>
        <select value={section} onChange={(e) => setSection(e.target.value as ReviewSectionKey)}>
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Checkbox
        label="Requires evidence replacement"
        description="Officer must upload a new/replacement document before resubmitting."
        checked={requiredEvidenceReplacement}
        onChange={() => setRequiredEvidenceReplacement((v) => !v)}
        testId="request-correction-evidence-replacement"
      />

      <div className="crvs-form-group">
        <label>Due date (optional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <Checkbox
        label="Notify officer immediately"
        checked={notifyOfficer}
        onChange={() => setNotifyOfficer((v) => !v)}
        testId="request-correction-notify-officer"
      />
    </StructuredReasonModal>
  );
}
