import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import { AnnulmentEvidence, AnnulmentRegistration } from "@/domain/crvs/types";
import { demoAttachAnnulmentEvidence, demoRemoveAnnulmentEvidence, demoReplaceAnnulmentEvidence, demoSetAnnulmentEvidenceVerification } from "@/demo/services/crvsAnnulmentEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import toastMessage from "@/utils/common/toastMessage";

/** Every configured document type, flattened from annulmentPolicyConfig so
 * the picker can never drift from the policy the review checklist enforces
 * (mirrors DivorceEvidenceModals.tsx's DOCUMENT_TYPE_OPTIONS construction). */
const DOCUMENT_TYPE_OPTIONS = Array.from(
  new Set([
    ...annulmentPolicyConfig.requiredDocuments.STANDARD,
    ...annulmentPolicyConfig.requiredDocuments.APPLICANT_NOT_A_PARTY,
    ...annulmentPolicyConfig.requiredDocuments.FOREIGN,
    "OTHER_SUPPORTING_DOCUMENT",
  ])
);

const humanize = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

function EvidenceFields({ value, onChange }: { value: AttachEvidenceInput; onChange: (patch: Partial<AttachEvidenceInput>) => void }) {
  return (
    <div className="crvs-form-grid">
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-type">Document type</label>
        <select id="annulment-evidence-type" value={value.documentType} onChange={(e) => onChange({ documentType: e.target.value })} data-testid="annulment-evidence-type">
          {DOCUMENT_TYPE_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {humanize(key)}
            </option>
          ))}
        </select>
      </div>
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-filename">File name</label>
        <input id="annulment-evidence-filename" value={value.fileName} onChange={(e) => onChange({ fileName: e.target.value })} data-testid="annulment-evidence-filename" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-filetype">File type</label>
        <select id="annulment-evidence-filetype" value={value.fileType} onChange={(e) => onChange({ fileType: e.target.value })} data-testid="annulment-evidence-filetype">
          <option value="application/pdf">PDF</option>
          <option value="image/jpeg">JPEG image</option>
          <option value="image/png">PNG image</option>
        </select>
      </div>
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-size">File size (KB)</label>
        <input id="annulment-evidence-size" type="number" min={1} value={value.fileSizeKb} onChange={(e) => onChange({ fileSizeKb: Number(e.target.value) || 0 })} data-testid="annulment-evidence-size" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-authority">Issuing authority</label>
        <input id="annulment-evidence-authority" value={value.issuingAuthority || ""} onChange={(e) => onChange({ issuingAuthority: e.target.value })} data-testid="annulment-evidence-authority" />
      </div>
      <div className="crvs-form-group">
        <label htmlFor="annulment-evidence-date">Document date</label>
        <input id="annulment-evidence-date" type="date" value={value.documentDate || ""} onChange={(e) => onChange({ documentDate: e.target.value })} data-testid="annulment-evidence-date" />
      </div>
    </div>
  );
}

const emptyInput = (): AttachEvidenceInput => ({ documentType: DOCUMENT_TYPE_OPTIONS[0], fileName: "", fileType: "application/pdf", fileSizeKb: 250 });

export function AttachAnnulmentEvidenceModal({
  show,
  onClose,
  registration,
  actorName,
  onAttached,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onAttached: (updated: AnnulmentRegistration) => void;
}) {
  const [input, setInput] = useState<AttachEvidenceInput>(emptyInput());

  const handleClose = () => {
    setInput(emptyInput());
    onClose();
  };

  const handleConfirm = async () => {
    if (!input.fileName.trim()) throw new Error("A file name is required.");
    if (!input.fileSizeKb || input.fileSizeKb <= 0) throw new Error("Enter a file size greater than zero.");
    const updated = await demoAttachAnnulmentEvidence(registration.id, { ...input, fileName: input.fileName.trim() }, actorName);
    toastMessage("success", `Attached ${input.fileName.trim()}.`);
    onAttached(updated);
    handleClose();
  };

  return (
    <ConfirmActionModal show={show} onClose={handleClose} onConfirm={handleConfirm} title="Attach evidence" description={registration.reference} confirmLabel="Attach" testId="attach-annulment-evidence-modal">
      <p className="crvs-form-hint" style={{ marginTop: 0 }}>
        This demo records document metadata only — no file bytes are ever stored or transmitted.
      </p>
      <EvidenceFields value={input} onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))} />
    </ConfirmActionModal>
  );
}

export function ReplaceAnnulmentEvidenceModal({
  show,
  onClose,
  registration,
  evidence,
  actorName,
  onReplaced,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  evidence: AnnulmentEvidence | undefined;
  actorName: string;
  onReplaced: (updated: AnnulmentRegistration) => void;
}) {
  const [input, setInput] = useState<AttachEvidenceInput>(emptyInput());

  if (!evidence) return null;

  const handleClose = () => {
    setInput(emptyInput());
    onClose();
  };

  const handleConfirm = async () => {
    if (!input.fileName.trim()) throw new Error("A file name is required.");
    const updated = await demoReplaceAnnulmentEvidence(registration.id, evidence.id, { ...input, fileName: input.fileName.trim() }, actorName);
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
      testId="replace-annulment-evidence-modal"
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

export function RemoveAnnulmentEvidenceModal({
  show,
  onClose,
  registration,
  evidence,
  actorName,
  onRemoved,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  evidence: AnnulmentEvidence | undefined;
  actorName: string;
  onRemoved: (updated: AnnulmentRegistration) => void;
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
      testId="remove-annulment-evidence-modal"
      onSubmit={async () => {
        const updated = await demoRemoveAnnulmentEvidence(registration.id, evidence.id, actorName);
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

export function SetAnnulmentEvidenceVerificationModal({
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
  registration: AnnulmentRegistration;
  evidence: AnnulmentEvidence | undefined;
  verification: AnnulmentEvidence["verification"];
  actorName: string;
  onSet: (updated: AnnulmentRegistration) => void;
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
      testId="set-annulment-evidence-verification-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = await demoSetAnnulmentEvidenceVerification(registration.id, evidence.id, verification, actorName, note ? `${reason}: ${note}` : reason);
        toastMessage("success", `${evidence.fileName} — ${label.toLowerCase()}.`);
        onSet(updated);
      }}
    />
  );
}
