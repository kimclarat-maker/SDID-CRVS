import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import DivorceEvidenceUploadModal from "../modals/DivorceEvidenceUploadModal";
import { demoAttachDivorceEvidence, demoRemoveDivorceEvidence, demoReplaceDivorceEvidence } from "@/demo/services/crvsDivorceEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { DivorceEvidence } from "@/domain/crvs/types";
import { divorceDocumentLabel, isRestrictedDivorceDocument, requiredDivorceDocuments, formatDateTime } from "../../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

/** Wizard step 7 — supporting documents. The required list comes from
 * divorcePolicyConfig.requiredDocumentsFor() based on whether the applicant
 * is one of the former spouses and whether the decision was issued abroad —
 * never a hardcoded list in this component (spec §6). */
export default function SupportingDocumentsStep({ draft, onCaseSynced, onPersist, actorName, errors, readOnly }: DivorceWizardStepProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [replacing, setReplacing] = useState<DivorceEvidence | undefined>();
  const [previewing, setPreviewing] = useState<DivorceEvidence | undefined>();
  const [removing, setRemoving] = useState<DivorceEvidence | undefined>();
  const [droppedFile, setDroppedFile] = useState<File | undefined>();
  const [dragging, setDragging] = useState(false);

  const attached = draft.evidence.filter((e) => !e.removed);
  const attachedTypes = new Set(attached.map((e) => e.documentType));
  const required = requiredDivorceDocuments(draft.applicant, draft.judgment.isForeign);
  const missing = required.filter((type) => !attachedTypes.has(type));
  const canEdit = !readOnly && (draft.status === "DRAFT" || draft.status === "CORRECTION_REQUIRED");

  const handleUpload = async (input: AttachEvidenceInput) => {
    onPersist();
    const updated = replacing
      ? demoReplaceDivorceEvidence(draft.id, replacing.id, input, actorName)
      : demoAttachDivorceEvidence(draft.id, input, actorName);
    onCaseSynced(updated);
    toastMessage("success", replacing ? "Document replaced." : "Document uploaded.");
    setReplacing(undefined);
  };

  const handleRemove = async () => {
    if (!removing) return;
    onPersist();
    const updated = demoRemoveDivorceEvidence(draft.id, removing.id, actorName);
    onCaseSynced(updated);
    setRemoving(undefined);
    toastMessage("success", "Document removed.");
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Supporting documents</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        Upload a clear scan or photograph of each document. PDF, JPG and PNG files up to 5MB are accepted. You can
        replace a document at any time before you submit.
      </p>

      <h3 style={{ marginTop: 16 }}>What this request needs</h3>
      <ul className="divorce-option-list" style={{ marginTop: 8 }}>
        {required.map((documentType) => {
          const present = attachedTypes.has(documentType);
          return (
            <li key={documentType} className="divorce-check-row">
              <div className="divorce-check-row-label">
                <strong>{divorceDocumentLabel(documentType)}</strong>
                {isRestrictedDivorceDocument(documentType) && (
                  <span className="divorce-restricted-badge" style={{ marginInlineStart: 8 }}>
                    <Icon name="lock" /> Restricted
                  </span>
                )}
              </div>
              <span className={`crvs-status-pill ${present ? "crvs-status-success" : "crvs-status-warning"}`}>
                <Icon name={present ? "check_circle" : "pending"} />
                {present ? "Uploaded" : "Still needed"}
              </span>
            </li>
          );
        })}
      </ul>

      {missing.length === 0 ? (
        <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
          <Icon name="check_circle" />
          <span>Every document required for your circumstances has been uploaded.</span>
        </div>
      ) : (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>
            {missing.length === 1 ? "One document is" : `${missing.length} documents are`} still needed before you can
            submit.
          </span>
        </div>
      )}

      {canEdit && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            id="divorce-documents-dropzone"
            className={`divorce-dropzone${dragging ? " is-dragging" : ""}`}
            onClick={() => {
              setReplacing(undefined);
              setDroppedFile(undefined);
              setShowUpload(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (!dropped) return;
              setReplacing(undefined);
              setDroppedFile(dropped);
              setShowUpload(true);
            }}
            data-testid="divorce-documents-open-upload"
          >
            <Icon name="upload_file" />
            <strong>Upload a document</strong>
            <span className="crvs-form-hint">Drag and drop a file here, or select one to browse. PDF, JPG or PNG up to 5MB.</span>
          </button>
        </div>
      )}

      <h3 style={{ marginTop: 20 }}>Documents you have uploaded</h3>
      {attached.length === 0 ? (
        <p className="crvs-form-hint">Nothing uploaded yet.</p>
      ) : (
        <ul className="divorce-option-list">
          {attached.map((item) => (
            <li key={item.id} className="crvs-case-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                <strong>{divorceDocumentLabel(item.documentType)}</strong>
                {isRestrictedDivorceDocument(item.documentType) && (
                  <span className="divorce-restricted-badge" style={{ marginInlineStart: 8 }}>
                    <Icon name="lock" /> Restricted
                  </span>
                )}
                <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                  {item.fileName} · {item.fileSizeKb} KB · uploaded {formatDateTime(item.uploadedAt)}
                </span>
                {item.replacedFromId && (
                  <span className="crvs-form-hint" style={{ display: "block" }}>
                    Replaces an earlier upload. The original stays on the case record for the registrar.
                  </span>
                )}
                <StatusBadge kind="verification" status={item.verification} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewing(item)} testId={`divorce-evidence-preview-${item.id}`} />
                {canEdit && (
                  <Button
                    text="Replace"
                    size="sm"
                    appearance="ghost"
                    type="button"
                    onClick={() => {
                      setReplacing(item);
                      setShowUpload(true);
                    }}
                    testId={`divorce-evidence-replace-${item.id}`}
                  />
                )}
                {canEdit && (
                  <Button
                    text="Remove"
                    size="sm"
                    appearance="ghost"
                    color="red"
                    type="button"
                    onClick={() => setRemoving(item)}
                    testId={`divorce-evidence-remove-${item.id}`}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16, alignItems: "flex-start" }}>
        <Icon name="lock" />
        <span>
          Documents marked <strong>Restricted</strong> contain the content of a court decision. They are visible only to
          you and to the staff handling this case — never on the public tracking page, and never to the other former
          spouse's separate enquiries.
        </span>
      </div>

      <DivorceEvidenceUploadModal
        show={showUpload}
        onClose={() => {
          setShowUpload(false);
          setReplacing(undefined);
          setDroppedFile(undefined);
        }}
        documentTypes={Array.from(new Set([...missing, ...required]))}
        initialDocumentType={replacing?.documentType || missing[0]}
        initialFile={droppedFile}
        replacingFileName={replacing?.fileName}
        onUpload={handleUpload}
      />

      <DocumentPreviewModal show={!!previewing} onClose={() => setPreviewing(undefined)} evidence={previewing} />

      <ConfirmActionModal
        show={!!removing}
        onClose={() => setRemoving(undefined)}
        onConfirm={handleRemove}
        title="Remove this document"
        description={removing ? `${divorceDocumentLabel(removing.documentType)} — ${removing.fileName}` : undefined}
        confirmLabel="Remove document"
        cancelLabel="Keep it"
        destructive
        testId="divorce-evidence-remove-modal"
      >
        <p style={{ margin: 0 }}>
          This document will no longer be part of your registration request. If it is one of the required documents you
          will not be able to submit until you upload a replacement.
        </p>
      </ConfirmActionModal>
    </div>
  );
}
