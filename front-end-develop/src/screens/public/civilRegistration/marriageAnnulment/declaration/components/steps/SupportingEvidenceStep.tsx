import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import AnnulmentEvidenceUploadModal from "../modals/AnnulmentEvidenceUploadModal";
import { demoAttachAnnulmentEvidence, demoRemoveAnnulmentEvidence, demoReplaceAnnulmentEvidence } from "@/demo/services/crvsAnnulmentEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { AnnulmentEvidence } from "@/domain/crvs/types";
import { annulmentDocumentLabel, isRestrictedAnnulmentDocument, requiredAnnulmentDocuments, formatDateTime } from "../../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

/** Wizard step 7 — supporting evidence. The required list comes from
 * annulmentPolicyConfig.requiredDocumentsFor() (via requiredAnnulmentDocuments)
 * based on whether the applicant is one of the two affected people and
 * whether the decision was issued abroad — never a hardcoded list in this
 * component (spec §6). Uses the already-built AnnulmentEvidenceUploadModal. */
export default function SupportingEvidenceStep({ draft, onCaseSynced, onPersist, actorName, errors, readOnly }: AnnulmentWizardStepProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [replacing, setReplacing] = useState<AnnulmentEvidence | undefined>();
  const [previewing, setPreviewing] = useState<AnnulmentEvidence | undefined>();
  const [removing, setRemoving] = useState<AnnulmentEvidence | undefined>();
  const [droppedFile, setDroppedFile] = useState<File | undefined>();
  const [dragging, setDragging] = useState(false);

  const attached = draft.evidence.filter((e) => !e.removed);
  const attachedTypes = new Set(attached.map((e) => e.documentType));
  const required = requiredAnnulmentDocuments(draft.applicant, draft.decision.isForeign);
  const missing = required.filter((type) => !attachedTypes.has(type));
  const canEdit = !readOnly && (draft.status === "DRAFT" || draft.status === "CORRECTION_REQUIRED");

  const handleUpload = async (input: AttachEvidenceInput) => {
    onPersist();
    const updated = replacing
      ? await demoReplaceAnnulmentEvidence(draft.id, replacing.id, input, actorName)
      : await demoAttachAnnulmentEvidence(draft.id, input, actorName);
    onCaseSynced(updated);
    toastMessage("success", replacing ? "Document replaced." : "Document uploaded.");
    setReplacing(undefined);
  };

  const handleRemove = async () => {
    if (!removing) return;
    onPersist();
    const updated = await demoRemoveAnnulmentEvidence(draft.id, removing.id, actorName);
    onCaseSynced(updated);
    setRemoving(undefined);
    toastMessage("success", "Document removed.");
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Supporting evidence</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        Upload a clear scan or photograph of each document. PDF, JPG and PNG files up to 5MB are accepted. You can
        replace a document at any time before you submit.
      </p>

      <h3 style={{ marginTop: 16 }}>What this request needs</h3>
      <ul className="annulment-option-list" style={{ marginTop: 8 }}>
        {required.map((documentType) => {
          const present = attachedTypes.has(documentType);
          return (
            <li key={documentType} className="annulment-check-row">
              <div className="annulment-check-row-label">
                <strong>{annulmentDocumentLabel(documentType)}</strong>
                {isRestrictedAnnulmentDocument(documentType) && (
                  <span className="annulment-restricted-badge" style={{ marginInlineStart: 8 }}>
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
            id="annulment-evidence-dropzone"
            className={`annulment-dropzone${dragging ? " is-dragging" : ""}`}
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
            data-testid="annulment-evidence-open-upload"
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
        <ul className="annulment-option-list">
          {attached.map((item) => (
            <li key={item.id} className="crvs-case-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                <strong>{annulmentDocumentLabel(item.documentType)}</strong>
                {isRestrictedAnnulmentDocument(item.documentType) && (
                  <span className="annulment-restricted-badge" style={{ marginInlineStart: 8 }}>
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
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewing(item)} testId={`annulment-evidence-preview-${item.id}`} />
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
                    testId={`annulment-evidence-replace-${item.id}`}
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
                    testId={`annulment-evidence-remove-${item.id}`}
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
          Documents marked <strong>Restricted</strong> contain the content of the decision itself. They are visible only
          to you and to the staff handling this case — never on the public tracking page, and never to the other
          affected person's separate enquiries.
        </span>
      </div>

      <AnnulmentEvidenceUploadModal
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
        description={removing ? `${annulmentDocumentLabel(removing.documentType)} — ${removing.fileName}` : undefined}
        confirmLabel="Remove document"
        cancelLabel="Keep it"
        destructive
        testId="annulment-evidence-remove-modal"
      >
        <p style={{ margin: 0 }}>
          This document will no longer be part of your registration request. If it is one of the required documents you
          will not be able to submit until you upload a replacement.
        </p>
      </ConfirmActionModal>
    </div>
  );
}
