import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { buildSafePreview, AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { EvidenceItem } from "@/domain/crvs/types";

export type ReplaceEvidenceModalProps = {
  show: boolean;
  evidence?: EvidenceItem;
  busy?: boolean;
  onClose: () => void;
  onReplace: (input: AttachEvidenceInput) => Promise<void>;
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PREFIXES = ["image/", "application/pdf"];

/** Replaces an existing evidence item with a new file. The original is
 * soft-marked replaced server-side (demoReplaceEvidence), never deleted —
 * this action is fully audited. */
export default function ReplaceEvidenceModal({ show, evidence, busy, onClose, onReplace }: ReplaceEvidenceModalProps) {
  const [file, setFile] = useState<File | undefined>();
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  if (!evidence) return null;

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
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("File is larger than 5MB.");
      return;
    }
    setFile(f);
  };

  const handleReplace = async () => {
    if (!file) {
      setError("Choose a replacement file.");
      return;
    }
    setSubmitting(true);
    try {
      const previewDataUri = await buildSafePreview(file);
      await onReplace({
        documentType: evidence.documentType,
        fileName: file.name,
        fileType: file.type,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        description: description.trim() || evidence.description,
        documentDate: documentDate || evidence.documentDate,
        issuingAuthority: issuingAuthority.trim() || evidence.issuingAuthority,
        previewDataUri,
      });
      reset();
    } catch (err: any) {
      setError(err?.message || "Couldn't replace this evidence item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title={`Replace: ${evidence.fileName}`} size="sm" testId="replace-evidence-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-info">
          <Icon name="history" />
          <span>Replacing this document is recorded in the case audit trail — the original stays on file, marked replaced.</span>
        </div>
        <div className="crvs-form-grid" style={{ marginTop: 12 }}>
          <div className="crvs-form-group">
            <label htmlFor="rev-file">New file (image or PDF, max 5MB)</label>
            <input id="rev-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="rev-date">Document date</label>
            <input id="rev-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="rev-authority">Issuing authority</label>
            <input id="rev-authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
          </div>
        </div>
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="rev-description">Description (optional)</label>
          <textarea id="rev-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting || busy} testId="replace-evidence-cancel" />
          <Button type="button" text="Replace" appearance="primary" loading={submitting || busy} onClick={handleReplace} testId="replace-evidence-confirm" />
        </div>
      </div>
    </Modal>
  );
}
