import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { buildSafePreview, AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { RequiredEvidence } from "@/domain/crvs/evidenceRequirements";

export type UploadEvidenceModalProps = {
  show: boolean;
  onClose: () => void;
  requiredTypes: RequiredEvidence[];
  busy?: boolean;
  onUpload: (input: AttachEvidenceInput) => Promise<void>;
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PREFIXES = ["image/", "application/pdf"];

/** Attaches a new evidence item. File type/size are validated client-side;
 * only small images ever get an inline preview (buildSafePreview) — demo
 * mode never stores raw file bytes. */
export default function UploadEvidenceModal({ show, onClose, requiredTypes, busy, onUpload }: UploadEvidenceModalProps) {
  const [documentType, setDocumentType] = useState(requiredTypes[0]?.documentType || "");
  const [file, setFile] = useState<File | undefined>();
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFile(undefined);
    setDescription("");
    setDocumentDate("");
    setIssuingAuthority("");
    setError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(undefined);
    if (!f) {
      setFile(undefined);
      return;
    }
    const isAccepted = ACCEPTED_PREFIXES.some((p) => f.type.startsWith(p));
    if (!isAccepted) {
      setError("Only image or PDF files are accepted.");
      setFile(undefined);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("File is larger than 5MB.");
      setFile(undefined);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!documentType.trim()) {
      setError("Select a document type.");
      return;
    }
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setSubmitting(true);
    try {
      const previewDataUri = await buildSafePreview(file);
      await onUpload({
        documentType: documentType.trim(),
        fileName: file.name,
        fileType: file.type,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        description: description.trim() || undefined,
        documentDate: documentDate || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        previewDataUri,
      });
      reset();
    } catch (err: any) {
      setError(err?.message || "Couldn't upload this evidence item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Upload evidence" size="sm" testId="upload-evidence-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="ev-doc-type">Document type</label>
            <input id="ev-doc-type" list="ev-doc-type-options" value={documentType} onChange={(e) => setDocumentType(e.target.value)} />
            <datalist id="ev-doc-type-options">
              {requiredTypes.map((r) => (
                <option key={r.documentType} value={r.documentType} />
              ))}
            </datalist>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ev-file">File (image or PDF, max 5MB)</label>
            <input id="ev-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ev-date">Document date</label>
            <input id="ev-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ev-authority">Issuing authority</label>
            <input id="ev-authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
          </div>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="ev-description">Description (optional)</label>
          <textarea id="ev-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting || busy} testId="upload-evidence-cancel" />
          <Button type="button" text="Upload" appearance="primary" loading={submitting || busy} onClick={handleUpload} testId="upload-evidence-confirm" />
        </div>
      </div>
    </Modal>
  );
}
