import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { AnnulmentCorrectionItem, AnnulmentRegistration, AnnulmentReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestAnnulmentCorrection } from "@/demo/services/crvsAnnulmentRegistrations";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import toastMessage from "@/utils/common/toastMessage";
import { ANNULMENT_REVIEW_SECTION_LABELS, ANNULMENT_REVIEW_SECTION_ORDER } from "../../../annulmentShared";

const EVIDENCE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Final annulment decision required", label: "Final annulment decision required" },
  { value: "Proof the decision is final required", label: "Proof the decision is final required" },
  { value: "Marriage certificate or record required", label: "Marriage certificate or record required" },
  { value: "Applicant identity document required", label: "Applicant identity document required" },
  { value: "Affected party identity document required", label: "Affected party identity document required" },
  { value: "Authorization document required", label: "Authorization document required" },
  { value: "Certified translation required", label: "Certified translation required" },
  { value: "Authentication or legalization required", label: "Authentication or legalization required" },
  { value: "Exequatur or recognition decision required", label: "Exequatur or recognition decision required" },
  { value: "Other", label: "Other" },
];

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + annulmentPolicyConfig.sla.correctionResponseDays);
  return d.toISOString().slice(0, 10);
};

/** "Request additional evidence" (spec §11 Step 7/§18/§26) — a distinct
 * staff action from "Request correction" (RequestAnnulmentCorrectionModal.tsx),
 * kept as its own modal per spec rather than folded into the correction
 * modal, even though both post the same underlying AnnulmentCorrectionRequest
 * shape (requestType: "EVIDENCE") via demoRequestAnnulmentCorrection. */
export default function RequestAnnulmentEvidenceModal({
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
  const [section, setSection] = useState<AnnulmentReviewSectionKey>(defaultSection || "EVIDENCE");
  const [dueDate, setDueDate] = useState(defaultDeadline());
  const [notifyApplicants, setNotifyApplicants] = useState(true);

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: Omit<AnnulmentCorrectionItem, "id" | "addressed"> = {
      section,
      fields,
      reason,
      note: note || undefined,
      documentsRequired: true,
      dueDate: dueDate || undefined,
    };
    const updated = await demoRequestAnnulmentCorrection(
      registration.id,
      { requestType: "EVIDENCE", items: [item], responseDeadline: dueDate || undefined, notifyApplicants },
      actorName
    );
    toastMessage("success", `Additional evidence requested on ${updated.reference}.`);
    onRequested(updated);
    setDueDate(defaultDeadline());
    setNotifyApplicants(true);
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Request additional evidence"
      description={`${registration.reference} — this moves the case to correction required and pauses review until the applicant responds with the requested evidence.`}
      reasonOptions={EVIDENCE_REASON_OPTIONS}
      fieldOptions={ANNULMENT_REVIEW_SECTION_ORDER.map((key) => ({ value: key, label: ANNULMENT_REVIEW_SECTION_LABELS[key] }))}
      fieldsLabel="Other sections also affected (optional)"
      noteLabel="Details for the applicant"
      noteRequired
      submitLabel="Request evidence"
      testId="request-annulment-evidence-modal"
    >
      <div className="crvs-form-group">
        <label htmlFor="request-annulment-evidence-section">Primary affected section</label>
        <select id="request-annulment-evidence-section" value={section} onChange={(e) => setSection(e.target.value as AnnulmentReviewSectionKey)} data-testid="request-annulment-evidence-section">
          {ANNULMENT_REVIEW_SECTION_ORDER.map((key) => (
            <option key={key} value={key}>
              {ANNULMENT_REVIEW_SECTION_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="crvs-form-group">
        <label htmlFor="request-annulment-evidence-due">Response deadline</label>
        <input id="request-annulment-evidence-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="request-annulment-evidence-due" />
        <p className="crvs-form-hint">Defaults to the configured {annulmentPolicyConfig.sla.correctionResponseDays}-day correction-response window.</p>
      </div>
      <Checkbox label="Notify the applicant(s) immediately" checked={notifyApplicants} onChange={() => setNotifyApplicants((v) => !v)} testId="request-annulment-evidence-notify" />
    </StructuredReasonModal>
  );
}
