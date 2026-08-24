import Modal from "@/components/Modal";
import Button from "@/components/button";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { EvidenceItem } from "@/domain/crvs/types";

export default function DocumentPreviewModal({
  show,
  onClose,
  evidence,
}: {
  show: boolean;
  onClose: () => void;
  evidence: EvidenceItem | null | undefined;
}) {
  return (
    <Modal show={show} handleClose={onClose} title={evidence?.documentType || "Document preview"} size="sm" testId="document-preview-modal">
      {evidence && (
        <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--status-neutral-bg)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center" }}>
            {evidence.previewDataUri ? (
              <img src={evidence.previewDataUri} alt={`Preview of ${evidence.fileName}`} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }} />
            ) : (
              <p className="crvs-form-hint">No inline preview is available for this file type. Metadata is shown below.</p>
            )}
          </div>
          <dl className="crvs-form-hint" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", margin: 0 }}>
            <dt>File name</dt>
            <dd>{evidence.fileName}</dd>
            <dt>File type</dt>
            <dd>{evidence.fileType}</dd>
            <dt>File size</dt>
            <dd>{evidence.fileSizeKb} KB</dd>
            <dt>Uploaded</dt>
            <dd>{new Date(evidence.uploadedAt).toLocaleString()} by {evidence.uploadedBy}</dd>
            <dt>Verification</dt>
            <dd>
              <StatusBadge kind="verification" status={evidence.verification} />
            </dd>
          </dl>
        </div>
      )}
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="primary" onClick={onClose} testId="document-preview-close" />
      </div>
    </Modal>
  );
}
