import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { buildSafePreview, AttachEvidenceInput } from "@/demo/services/crvsEvidence";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PREFIXES = ["image/", "application/pdf"];

/** "Add evidence" modal (spec §8) — file type/size validated client-side;
 * only small images get an inline preview (buildSafePreview, shared with
 * birth's evidence upload) — demo mode never stores raw file bytes. */
export default function AddEvidenceModal({
  show,
  onClose,
  requiredTypes,
  busy,
  onUpload,
}: {
  show: boolean;
  onClose: () => void;
  requiredTypes: string[];
  busy?: boolean;
  onUpload: (input: AttachEvidenceInput) => Promise<void>;
}) {
  const [documentType, setDocumentType] = useState(requiredTypes[0] || "");
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
    if (!ACCEPTED_PREFIXES.some((p) => f.type.startsWith(p))) {
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload this evidence item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Add evidence" size="sm" testId="add-evidence-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="dev-doc-type">Document type</label>
            <input id="dev-doc-type" list="dev-doc-type-options" value={documentType} onChange={(e) => setDocumentType(e.target.value)} data-testid="evidence-doc-type" />
            <datalist id="dev-doc-type-options">
              {requiredTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dev-file">File (image or PDF, max 5MB)</label>
            <input id="dev-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange} data-testid="evidence-file-input" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dev-date">Document date</label>
            <input id="dev-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dev-authority">Issuing authority</label>
            <input id="dev-authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
          </div>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="dev-description">Description (optional)</label>
          <textarea id="dev-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting || busy} testId="add-evidence-cancel" />
          <Button type="button" text="Upload" appearance="primary" loading={submitting || busy} onClick={handleUpload} testId="add-evidence-confirm" />
        </div>
      </div>
    </Modal>
  );
}
