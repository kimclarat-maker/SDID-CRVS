import { useState } from "react";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Checkbox from "@/components/checkbox";
import { DivorceCorrectionItem, DivorceRegistration, DivorceReviewSectionKey } from "@/domain/crvs/types";
import { demoRequestDivorceCorrection } from "@/demo/services/crvsDivorceRegistrations";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import toastMessage from "@/utils/common/toastMessage";
import { DIVORCE_REVIEW_SECTION_LABELS, DIVORCE_REVIEW_SECTION_ORDER, newLocalId } from "../../../divorceShared";

const CORRECTION_REASON_OPTIONS: ReasonOption[] = [
  { value: "Missing information", label: "Missing information" },
  { value: "Illegible document", label: "Illegible document" },
  { value: "Mismatched identity details", label: "Mismatched identity details" },
  { value: "Court details inconsistent", label: "Court details inconsistent" },
  { value: "Judgment finality not evidenced", label: "Judgment finality not evidenced" },
  { value: "Wrong marriage record selected", label: "Wrong marriage record selected" },
  { value: "Other", label: "Other" },
];

const EVIDENCE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Final court judgment required", label: "Final court judgment required" },
  { value: "Proof the judgment is final required", label: "Proof the judgment is final required" },
  { value: "Marriage certificate or record required", label: "Marriage certificate or record required" },
  { value: "Applicant identity document required", label: "Applicant identity document required" },
  { value: "Authorization document required", label: "Authorization document required" },
  { value: "Certified translation required", label: "Certified translation required" },
  { value: "Authentication or legalization required", label: "Authentication or legalization required" },
  { value: "Exequatur or recognition judgment required", label: "Exequatur or recognition judgment required" },
  { value: "Other", label: "Other" },
];

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + divorcePolicyConfig.sla.correctionResponseDays);
  return d.toISOString().slice(0, 10);
};

/**
 * Powers both "Request correction" and "Request additional evidence" — the
 * same underlying correction request, differing only in the reason taxonomy
 * and whether documents are required. Building them as one parameterized
 * wrapper over StructuredReasonModal avoids a second near-identical modal.
 */
export default function RequestDivorceCorrectionModal({
  show,
  onClose,
  registration,
  actorName,
  onRequested,
  mode = "CORRECTION",
  defaultSection,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRequested: (updated: DivorceRegistration) => void;
  mode?: "CORRECTION" | "EVIDENCE";
  defaultSection?: DivorceReviewSectionKey;
}) {
  const evidenceMode = mode === "EVIDENCE";
  const [section, setSection] = useState<DivorceReviewSectionKey>(defaultSection || (evidenceMode ? "EVIDENCE" : "COURT_DECISION"));
  const [documentsRequired, setDocumentsRequired] = useState(evidenceMode);
  const [dueDate, setDueDate] = useState(defaultDeadline());
  const [notifyApplicants, setNotifyApplicants] = useState(true);

  const handleSubmit = async ({ reason, fields, note }: { reason: string; fields: string[]; note: string }) => {
    const item: DivorceCorrectionItem = {
      id: newLocalId("DCI"),
      section,
      fields,
      reason,
      note: note || undefined,
      documentsRequired: evidenceMode ? true : documentsRequired,
      dueDate: dueDate || undefined,
      addressed: false,
    };
    const updated = demoRequestDivorceCorrection(
      registration.id,
      { requestedBy: actorName, items: [item], responseDeadline: dueDate || undefined, notifyApplicants },
      actorName
    );
    toastMessage("success", evidenceMode ? `Additional evidence requested on ${updated.reference}.` : `Correction requested on ${updated.reference}.`);
    onRequested(updated);
    setDocumentsRequired(evidenceMode);
    setDueDate(defaultDeadline());
    setNotifyApplicants(true);
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={evidenceMode ? "Request additional evidence" : "Request correction"}
      description={`${registration.reference} — this moves the case to correction required and pauses review until the applicant responds.`}
      reasonOptions={evidenceMode ? EVIDENCE_REASON_OPTIONS : CORRECTION_REASON_OPTIONS}
      fieldOptions={DIVORCE_REVIEW_SECTION_ORDER.map((key) => ({ value: key, label: DIVORCE_REVIEW_SECTION_LABELS[key] }))}
      fieldsLabel="Other sections also affected (optional)"
      noteLabel="Details for the applicant"
      noteRequired
      submitLabel={evidenceMode ? "Request evidence" : "Request correction"}
      testId={evidenceMode ? "request-divorce-evidence-modal" : "request-divorce-correction-modal"}
    >
      <div className="crvs-form-group">
        <label htmlFor="request-divorce-correction-section">Primary affected section</label>
        <select id="request-divorce-correction-section" value={section} onChange={(e) => setSection(e.target.value as DivorceReviewSectionKey)} data-testid="request-divorce-correction-section">
          {DIVORCE_REVIEW_SECTION_ORDER.map((key) => (
            <option key={key} value={key}>
              {DIVORCE_REVIEW_SECTION_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      {!evidenceMode && (
        <Checkbox
          label="A replacement or additional document is required"
          checked={documentsRequired}
          onChange={() => setDocumentsRequired((v) => !v)}
          testId="request-divorce-correction-documents-required"
        />
      )}
      <div className="crvs-form-group">
        <label htmlFor="request-divorce-correction-due">Response deadline</label>
        <input id="request-divorce-correction-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="request-divorce-correction-due" />
        <p className="crvs-form-hint">Defaults to the configured {divorcePolicyConfig.sla.correctionResponseDays}-day correction-response window.</p>
      </div>
      <Checkbox label="Notify the applicant immediately" checked={notifyApplicants} onChange={() => setNotifyApplicants((v) => !v)} testId="request-divorce-correction-notify" />
    </StructuredReasonModal>
  );
}
