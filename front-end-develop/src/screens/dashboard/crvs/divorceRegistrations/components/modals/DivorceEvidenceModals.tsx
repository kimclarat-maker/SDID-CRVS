import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import { DivorceEvidence, DivorceRegistration } from "@/domain/crvs/types";
import { demoAttachDivorceEvidence, demoRemoveDivorceEvidence, demoReplaceDivorceEvidence, demoSetDivorceEvidenceVerification } from "@/demo/services/crvsDivorceEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

/** Every configured document type, flattened from divorcePolicyConfig so the
 * picker can never drift from the policy the review checklist enforces. */
const DOCUMENT_TYPE_OPTIONS = Array.from(
  new Set([
    ...divorcePolicyConfig.requiredDocuments.STANDARD,
    ...divorcePolicyConfig.requiredDocuments.APPLICANT_NOT_A_SPOUSE,
    ...divorcePolicyConfig.requiredDocuments.FOREIGN,
    "OTHER_SUPPORTING_DOCUMENT",
  ])
);

const humanize = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

function EvidenceFields({
  value,
  onChange,
}: {
  value: AttachEvidenceInput;
  onChange: (patch: Partial<AttachEvidenceInput>) => void;
}) {
  return (
    <div className="crvs-form-grid">
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-type">Document type</label>
        <select id="divorce-evidence-type" value={value.documentType} onChange={(e) => onChange({ documentType: e.target.value })} data-testid="divorce-evidence-type">
          {DOCUMENT_TYPE_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {humanize(key)}
            </option>
          ))}
        </select>
      </div>
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-filename">File name</label>
        <input id="divorce-evidence-filename" value={value.fileName} onChange={(e) => onChange({ fileName: e.target.value })} data-testid="divorce-evidence-filename" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-filetype">File type</label>
        <select id="divorce-evidence-filetype" value={value.fileType} onChange={(e) => onChange({ fileType: e.target.value })} data-testid="divorce-evidence-filetype">
          <option value="application/pdf">PDF</option>
          <option value="image/jpeg">JPEG image</option>
          <option value="image/png">PNG image</option>
        </select>
      </div>
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-size">File size (KB)</label>
        <input id="divorce-evidence-size" type="number" min={1} value={value.fileSizeKb} onChange={(e) => onChange({ fileSizeKb: Number(e.target.value) || 0 })} data-testid="divorce-evidence-size" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-authority">Issuing authority</label>
        <input id="divorce-evidence-authority" value={value.issuingAuthority || ""} onChange={(e) => onChange({ issuingAuthority: e.target.value })} data-testid="divorce-evidence-authority" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="divorce-evidence-date">Document date</label>
        <input id="divorce-evidence-date" type="date" value={value.documentDate || ""} onChange={(e) => onChange({ documentDate: e.target.value })} data-testid="divorce-evidence-date" />
      </div>
    </div>
  );
}

const emptyInput = (): AttachEvidenceInput => ({ documentType: DOCUMENT_TYPE_OPTIONS[0], fileName: "", fileType: "application/pdf", fileSizeKb: 250 });

export function AttachDivorceEvidenceModal({
  show,
  onClose,
  registration,
  actorName,
  onAttached,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onAttached: (updated: DivorceRegistration) => void;
}) {
  const [input, setInput] = useState<AttachEvidenceInput>(emptyInput());

  const handleClose = () => {
    setInput(emptyInput());
    onClose();
  };

  const handleConfirm = async () => {
    if (!input.fileName.trim()) throw new Error("A file name is required.");
    if (!input.fileSizeKb || input.fileSizeKb <= 0) throw new Error("Enter a file size greater than zero.");
    const updated = demoAttachDivorceEvidence(registration.id, { ...input, fileName: input.fileName.trim() }, actorName);
    toastMessage("success", `Attached ${input.fileName.trim()}.`);
    onAttached(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal show={show} onClose={handleClose} onConfirm={handleConfirm} title="Attach evidence" description={registration.reference} confirmLabel="Attach" testId="attach-divorce-evidence-modal">
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        This demo records document metadata only — no file bytes are ever stored or transmitted.
      </p>
      <EvidenceFields value={input} onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))} />
    </ConfirmActionModal>
  );
}

export function ReplaceDivorceEvidenceModal({
  show,
  onClose,
  registration,
  evidence,
  actorName,
  onReplaced,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  evidence: DivorceEvidence | undefined;
  actorName: string;
  onReplaced: (updated: DivorceRegistration) => void;
}) {
  const [input, setInput] = useState<AttachEvidenceInput>(emptyInput());

  if (!evidence) return null;

  const handleClose = () => {
    setInput(emptyInput());
    onClose();
  };

  const handleConfirm = async () => {
    if (!input.fileName.trim()) throw new Error("A file name is required.");
    const updated = demoReplaceDivorceEvidence(registration.id, evidence.id, { ...input, fileName: input.fileName.trim() }, actorName);
    toastMessage("success", `Replaced ${evidence.fileName}.`);
    onReplaced(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Replace evidence"
      description={`${registration.reference} — replacing ${evidence.fileName}`}
      confirmLabel="Replace"
      testId="replace-divorce-evidence-modal"
    >
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        The original document stays on record as superseded — it is never deleted from the case history.
      </p>
      <EvidenceFields value={input} onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))} />
    </ConfirmActionModal>
  );
}

const REMOVE_REASON_OPTIONS: ReasonOption[] = [
  { value: "Uploaded in error", label: "Uploaded in error" },
  { value: "Duplicate of another document", label: "Duplicate of another document" },
  { value: "Belongs to a different case", label: "Belongs to a different case" },
  { value: "Other", label: "Other" },
];

export function RemoveDivorceEvidenceModal({
  show,
  onClose,
  registration,
  evidence,
  actorName,
  onRemoved,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  evidence: DivorceEvidence | undefined;
  actorName: string;
  onRemoved: (updated: DivorceRegistration) => void;
}) {
  if (!evidence) return null;

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Remove evidence"
      description={`${registration.reference} — ${evidence.fileName}. The document is marked removed and stays visible in the case history.`}
      reasonOptions={REMOVE_REASON_OPTIONS}
      noteLabel="Detail"
      noteRequired
      submitLabel="Remove document"
      destructive
      testId="remove-divorce-evidence-modal"
      onSubmit={async () => {
        const updated = demoRemoveDivorceEvidence(registration.id, evidence.id, actorName);
        toastMessage("success", `Removed ${evidence.fileName}.`);
        onRemoved(updated);
      }}
    />
  );
}

const VERIFICATION_REASON_OPTIONS: ReasonOption[] = [
  { value: "Document legible and consistent", label: "Document legible and consistent" },
  { value: "Document illegible", label: "Document illegible" },
  { value: "Details do not match the case", label: "Details do not match the case" },
  { value: "Requires a certified copy", label: "Requires a certified copy" },
  { value: "Other", label: "Other" },
];

export function SetDivorceEvidenceVerificationModal({
  show,
  onClose,
  registration,
  evidence,
  verification,
  actorName,
  onSet,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  evidence: DivorceEvidence | undefined;
  verification: DivorceEvidence["verification"];
  actorName: string;
  onSet: (updated: DivorceRegistration) => void;
}) {
  if (!evidence) return null;

  const label = verification === "VERIFIED" ? "Mark document valid" : verification === "MANUAL_REVIEW_REQUIRED" ? "Flag for manual review" : "Mark document unverified";

  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title={label}
      description={`${registration.reference} — ${evidence.fileName}`}
      reasonOptions={VERIFICATION_REASON_OPTIONS}
      noteLabel="Reviewer note"
      submitLabel={label}
      testId="set-divorce-evidence-verification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoSetDivorceEvidenceVerification(registration.id, evidence.id, verification, actorName, note ? `${reason}: ${note}` : reason);
        toastMessage("success", `${evidence.fileName} — ${label.toLowerCase()}.`);
        onSet(updated);
      }}
    />
  );
}
