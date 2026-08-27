import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { MarriageApplication, MarriageCorrectionItem, MarriageReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestMarriageCorrection } from "@/demo/services/crvsMarriageApplications";
import { newLocalId } from "../../../marriageShared";

const SECTION_OPTIONS: { value: MarriageReviewSectionKey; label: string }[] = [
  { value: "APPLICANT1", label: "Applicant 1" },
  { value: "APPLICANT2", label: "Applicant 2" },
  { value: "PROPOSED_MARRIAGE", label: "Proposed marriage" },
  { value: "ELIGIBILITY", label: "Eligibility" },
  { value: "EVIDENCE", label: "Evidence" },
  { value: "WITNESSES", label: "Witnesses" },
  { value: "PAYMENT", label: "Payment" },
  { value: "OFFICER_DECLARATION", label: "Officer declaration" },
];

const REASON_OPTIONS: ReasonOption[] = [
  { value: "Missing information", label: "Missing information" },
  { value: "Illegible document", label: "Illegible document" },
  { value: "Mismatched identity details", label: "Mismatched identity details" },
  { value: "Incomplete evidence", label: "Incomplete evidence" },
  { value: "Other", label: "Other" },
];

export default function RequestMarriageCorrectionModal({
  show,
  onClose,
  application,
  actorName,
  onRequested,
  defaultSection,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  actorName: string;
  onRequested: (updated: MarriageApplication) => void;
  defaultSection?: MarriageReviewSectionKey;
}) {
  const [section, setSection] = useState<MarriageReviewSectionKey>(defaultSection || "APPLICANT1");
  const [affectedSpouse, setAffectedSpouse] = useState<"APPLICANT1" | "APPLICANT2" | "BOTH">("BOTH");
  const [requiredEvidenceReplacement, setRequiredEvidenceReplacement] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notifyApplicants, setNotifyApplicants] = useState(true);

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: MarriageCorrectionItem = {
      id: newLocalId("MCI"),
      section,
      fields,
      affectedSpouse,
      reason,
      note: note || undefined,
      requiredEvidenceReplacement,
      dueDate: dueDate || undefined,
      addressed: false,
    };
    const updated = demoRequestMarriageCorrection(application.id, { requestedBy: actorName, items: [item], notifyApplicants }, actorName);
    onRequested(updated);
    setRequiredEvidenceReplacement(false);
    setDueDate("");
    setNotifyApplicants(true);
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Request correction"
      description={application.reference}
      reasonOptions={REASON_OPTIONS}
      noteLabel="Details for the applicants"
      noteRequired
      submitLabel="Request correction"
      testId="request-marriage-correction-modal"
    >
      <div className="crvs-form-group">
        <label>Affected section</label>
        <select value={section} onChange={(e) => setSection(e.target.value as MarriageReviewSectionKey)}>
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="crvs-form-group">
        <label>Affected applicant</label>
        <select value={affectedSpouse} onChange={(e) => setAffectedSpouse(e.target.value as "APPLICANT1" | "APPLICANT2" | "BOTH")}>
          <option value="BOTH">Both applicants</option>
          <option value="APPLICANT1">Applicant 1</option>
          <option value="APPLICANT2">Applicant 2</option>
        </select>
      </div>
      <Checkbox label="Requires evidence replacement" checked={requiredEvidenceReplacement} onChange={() => setRequiredEvidenceReplacement((v) => !v)} testId="request-marriage-correction-evidence-replacement" />
      <div className="crvs-form-group">
        <label>Due date (optional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <Checkbox label="Notify applicants immediately" checked={notifyApplicants} onChange={() => setNotifyApplicants((v) => !v)} testId="request-marriage-correction-notify" />
    </StructuredReasonModal>
  );
}
