import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { AnnulmentCorrectionItem, AnnulmentRegistration, AnnulmentReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestAnnulmentCorrection } from "@/demo/services/crvsAnnulmentRegistrations";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import toastMessage from "@/utils/common/toastMessage";
import { ANNULMENT_REVIEW_SECTION_LABELS, ANNULMENT_REVIEW_SECTION_ORDER } from "../../../annulmentShared";

const CORRECTION_REASON_OPTIONS: ReasonOption[] = [
  { value: "Missing information", label: "Missing information" },
  { value: "Illegible document", label: "Illegible document" },
  { value: "Mismatched identity details", label: "Mismatched identity details" },
  { value: "Court details inconsistent", label: "Court details inconsistent" },
  { value: "Decision finality not evidenced", label: "Decision finality not evidenced" },
  { value: "Wrong marriage record selected", label: "Wrong marriage record selected" },
  { value: "Other", label: "Other" },
];

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + annulmentPolicyConfig.sla.correctionResponseDays);
  return d.toISOString().slice(0, 10);
};

/** "Request correction" (spec §11 Step 7/§18/§26) — a distinct action from
 * "Request additional evidence" (RequestAnnulmentEvidenceModal.tsx), each its
 * own modal rather than one parameterized component, per spec. Both write
 * the same underlying AnnulmentCorrectionRequest shape (requestType flag) via
 * demoRequestAnnulmentCorrection. */
export default function RequestAnnulmentCorrectionModal({
  show,
  onClose,
  registration,
  actorName,
  onRequested,
  defaultSection,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRequested: (updated: AnnulmentRegistration) => void;
  defaultSection?: AnnulmentReviewSectionKey;
}) {
  const [section, setSection] = useState<AnnulmentReviewSectionKey>(defaultSection || "DECISION");
  const [documentsRequired, setDocumentsRequired] = useState(false);
  const [dueDate, setDueDate] = useState(defaultDeadline());
  const [notifyApplicants, setNotifyApplicants] = useState(true);

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: Omit<AnnulmentCorrectionItem, "id" | "addressed"> = {
      section,
      fields,
      reason,
      note: note || undefined,
      documentsRequired,
      dueDate: dueDate || undefined,
    };
    const updated = await demoRequestAnnulmentCorrection(
      registration.id,
      { requestType: "CORRECTION", items: [item], responseDeadline: dueDate || undefined, notifyApplicants },
      actorName
    );
    toastMessage("success", `Correction requested on ${updated.reference}.`);
    onRequested(updated);
    setDocumentsRequired(false);
    setDueDate(defaultDeadline());
    setNotifyApplicants(true);
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Request correction"
      description={`${registration.reference} — this moves the case to correction required and pauses review until the applicant responds.`}
      reasonOptions={CORRECTION_REASON_OPTIONS}
      fieldOptions={ANNULMENT_REVIEW_SECTION_ORDER.map((key) => ({ value: key, label: ANNULMENT_REVIEW_SECTION_LABELS[key] }))}
      fieldsLabel="Other sections also affected (optional)"
      noteLabel="Details for the applicant"
      noteRequired
      submitLabel="Request correction"
      testId="request-annulment-correction-modal"
    >
      <div className="crvs-form-group">
        <label htmlFor="request-annulment-correction-section">Primary affected section</label>
        <select id="request-annulment-correction-section" value={section} onChange={(e) => setSection(e.target.value as AnnulmentReviewSectionKey)} data-testid="request-annulment-correction-section">
          {ANNULMENT_REVIEW_SECTION_ORDER.map((key) => (
            <option key={key} value={key}>
              {ANNULMENT_REVIEW_SECTION_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      <Checkbox
        label="A replacement or additional document is required"
        checked={documentsRequired}
        onChange={() => setDocumentsRequired((v) => !v)}
        testId="request-annulment-correction-documents-required"
      />
      <div className="crvs-form-group">
        <label htmlFor="request-annulment-correction-due">Response deadline</label>
        <input id="request-annulment-correction-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="request-annulment-correction-due" />
        <p className="crvs-form-hint">Defaults to the configured {annulmentPolicyConfig.sla.correctionResponseDays}-day correction-response window.</p>
      </div>
      <Checkbox label="Notify the applicant(s) immediately" checked={notifyApplicants} onChange={() => setNotifyApplicants((v) => !v)} testId="request-annulment-correction-notify" />
    </StructuredReasonModal>
  );
}
