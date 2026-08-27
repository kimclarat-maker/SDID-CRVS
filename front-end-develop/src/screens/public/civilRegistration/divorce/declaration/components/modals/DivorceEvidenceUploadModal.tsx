import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { buildSafePreview, AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { divorceDocumentLabel, isRestrictedDivorceDocument } from "../../../divorceShared";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PREFIXES = ["image/", "application/pdf"];
const ACCEPTED_DESCRIPTION = "PDF, JPG or PNG, up to 5MB";

/**
 * Upload modal for divorce supporting documents: drag-and-drop plus a
 * regular file browser, client-side type/size validation, an upload progress
 * indicator, and a restricted-document notice for court-issued files.
 *
 * Only metadata and a small safe preview ever leave this component —
 * buildSafePreview() is the same helper birth/death/marriage evidence uses,
 * and demo mode never stores raw file bytes.
 */
export default function DivorceEvidenceUploadModal({
  show,
  onClose,
  documentTypes,
  initialDocumentType,
  initialFile,
  replacingFileName,
  onUpload,
}: {
  show: boolean;
  onClose: () => void;
  documentTypes: string[];
  initialDocumentType?: string;
  /** A file already dropped onto the step's own drop zone, carried straight
   * into the modal so the applicant never has to pick it twice. */
  initialFile?: File;
  /** Set when this upload replaces an existing item, so the modal can say
   * exactly what is being replaced (spec §21: identify the case). */
  replacingFileName?: string;
  onUpload: (input: AttachEvidenceInput) => Promise<void>;
}) {
  const [documentType, setDocumentType] = useState(initialDocumentType || documentTypes[0] || "");
  const [file, setFile] = useState<File | undefined>();
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (show) {
      openerRef.current = document.activeElement;
      setDocumentType(initialDocumentType || documentTypes[0] || "");
      setFile(initialFile);
      setError(undefined);
      setProgress(0);
      return;
    }
    const opener = openerRef.current;
    if (opener instanceof HTMLElement) opener.focus();
  }, [show, initialDocumentType, initialFile, documentTypes]);

  const reset = () => {
    setFile(undefined);
    setDescription("");
    setDocumentDate("");
    setIssuingAuthority("");
    setError(undefined);
    setProgress(0);
    setDragging(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const acceptFile = (candidate: File | undefined) => {
    setError(undefined);
    if (!candidate) {
      setFile(undefined);
      return;
    }
    if (!ACCEPTED_PREFIXES.some((prefix) => candidate.type.startsWith(prefix))) {
      setError(`“${candidate.name}” is not an accepted file type. Upload a ${ACCEPTED_DESCRIPTION}.`);
      setFile(undefined);
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setError(`“${candidate.name}” is larger than 5MB. Upload a smaller scan or photo.`);
      setFile(undefined);
      return;
    }
    setFile(candidate);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (submitting) return;
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (submitting) return;
    if (!documentType.trim()) {
      setError("Choose which document you are uploading.");
      return;
    }
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setSubmitting(true);
    setProgress(15);
    try {
      const previewDataUri = await buildSafePreview(file);
      setProgress(65);
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
      setProgress(100);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "This document could not be uploaded. Please try again.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      handleClose={handleClose}
      title={replacingFileName ? "Replace a document" : "Upload a document"}
      size="sm"
      testId="divorce-evidence-upload-modal"
    >
      <div className="modal-body" style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {replacingFileName && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="swap_horiz" />
            <span>
              The new file will replace <strong>{replacingFileName}</strong>. The original stays on the case record for the
              registrar, marked as replaced — nothing is deleted.
            </span>
          </div>
        )}

        <div className="crvs-form-group">
          <label htmlFor="divorce-evidence-document-type">Which document is this?</label>
          <input
            id="divorce-evidence-document-type"
            list="divorce-evidence-document-type-options"
            value={documentType}
            disabled={submitting}
            onChange={(e) => setDocumentType(e.target.value)}
            data-testid="divorce-evidence-document-type"
          />
          <datalist id="divorce-evidence-document-type-options">
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {divorceDocumentLabel(type)}
              </option>
            ))}
          </datalist>
          {documentType && <p className="crvs-form-hint">{divorceDocumentLabel(documentType)}</p>}
        </div>

        <button
          type="button"
          className={`divorce-dropzone${dragging ? " is-dragging" : ""}`}
          disabled={submitting}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!submitting) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-describedby="divorce-evidence-dropzone-hint"
          data-testid="divorce-evidence-dropzone"
        >
          <Icon name="upload_file" />
          <strong>{file ? file.name : "Drag a file here, or select a file"}</strong>
          <span className="crvs-form-hint" id="divorce-evidence-dropzone-hint">
            {file ? `${Math.max(1, Math.round(file.size / 1024))} KB · ${file.type || "unknown type"}` : ACCEPTED_DESCRIPTION}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => acceptFile(e.target.files?.[0])}
          data-testid="divorce-evidence-file-input"
        />

        {submitting && (
          <div className="divorce-upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="divorce-upload-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="divorce-evidence-date">Date on the document (optional)</label>
            <input id="divorce-evidence-date" type="date" value={documentDate} disabled={submitting} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="divorce-evidence-authority">Issued by (optional)</label>
            <input
              id="divorce-evidence-authority"
              value={issuingAuthority}
              disabled={submitting}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="Court, registry or authority name"
            />
          </div>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="divorce-evidence-description">Note for the registrar (optional)</label>
          <textarea id="divorce-evidence-description" rows={2} value={description} disabled={submitting} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {documentType && isRestrictedDivorceDocument(documentType) && (
          <div className="crvs-banner crvs-banner-info">
            <Icon name="lock" />
            <span>
              Court documents are treated as restricted. They are visible to you and to the staff reviewing this case, and
              are never shown on the public tracking page or to anyone else.
            </span>
          </div>
        )}

        {error && (
          <p className="crvs-form-error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="divorce-evidence-upload-cancel" />
          <Button
            type="button"
            text={replacingFileName ? "Replace document" : "Upload document"}
            appearance="primary"
            loading={submitting}
            disabled={submitting}
            onClick={handleUpload}
            testId="divorce-evidence-upload-confirm"
          />
        </div>
      </div>
    </Modal>
  );
}
