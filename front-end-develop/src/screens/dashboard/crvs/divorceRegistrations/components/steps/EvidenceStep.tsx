import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import StatusBadge from "../../../components/StatusBadge";
import { DivorceWizardStepProps } from "../wizardTypes";
import { DivorceEvidence } from "@/domain/crvs/types";
import { requiredDocumentsFor } from "@/domain/crvs/divorcePolicyConfig";
import { getCurrentActorName } from "@/utils/workspace";
import { activeEvidence, formatDateTime } from "../../../divorceShared";
import { AttachDivorceEvidenceModal, RemoveDivorceEvidenceModal, ReplaceDivorceEvidenceModal } from "../modals/DivorceEvidenceModals";

/** Wizard step 6 (spec §7): supporting evidence. The required-document list
 * is computed from divorcePolicyConfig for this case's shape (applicant is /
 * is not a spouse, decision is / is not foreign) — never a hardcoded list. */
export default function EvidenceStep({ draft, onCaseSynced, readOnly }: DivorceWizardStepProps) {
  const actorName = getCurrentActorName();
  const [showAttach, setShowAttach] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<DivorceEvidence | undefined>();
  const [removeTarget, setRemoveTarget] = useState<DivorceEvidence | undefined>();
  const [previewTarget, setPreviewTarget] = useState<DivorceEvidence | undefined>();

  const items = activeEvidence(draft.evidence);
  const applicantIsSpouse = draft.applicant.relationshipToCase === "FORMER_SPOUSE_1" || draft.applicant.relationshipToCase === "FORMER_SPOUSE_2" || draft.applicant.relationshipToCase === "BOTH_FORMER_SPOUSES";
  const required = requiredDocumentsFor({ applicantIsSpouse, isForeign: draft.judgment.isForeign });
  const missing = required.filter((docType) => !items.some((e) => e.documentType === docType));

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Evidence</h2>
      <p className="crvs-form-hint">Document metadata only — this demo never stores or transmits file contents.</p>

      <div className={`crvs-banner ${missing.length === 0 ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ marginTop: 12 }}>
        <Icon name={missing.length === 0 ? "task_alt" : "assignment_late"} />
        <span>
          {missing.length === 0
            ? "Every document this case's policy requires is attached."
            : `Still required: ${missing.map((d) => d.replace(/_/g, " ").toLowerCase()).join(", ")}.`}
        </span>
      </div>

      {!readOnly && (
        <div style={{ marginTop: 12 }}>
          <Button text="Attach document" appearance="primary" startIcon="upload_file" type="button" onClick={() => setShowAttach(true)} testId="divorce-wizard-attach-evidence" />
        </div>
      )}

      {items.length === 0 ? (
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          No evidence documents attached yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((ev) => (
            <li key={ev.id} className="crvs-case-card">
              <div className="crvs-case-card-header">
                <strong>{ev.documentType.replace(/_/g, " ")}</strong>
                <StatusBadge kind="verification" status={ev.verification} />
              </div>
              <div className="crvs-form-hint">
                {ev.fileName} · {ev.fileSizeKb} KB · uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewTarget(ev)} testId={`divorce-evidence-preview-${ev.id}`} />
                {!readOnly && <Button text="Replace" size="sm" appearance="ghost" type="button" onClick={() => setReplaceTarget(ev)} testId={`divorce-evidence-replace-${ev.id}`} />}
                {!readOnly && <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemoveTarget(ev)} testId={`divorce-evidence-remove-${ev.id}`} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AttachDivorceEvidenceModal show={showAttach} onClose={() => setShowAttach(false)} registration={draft} actorName={actorName} onAttached={onCaseSynced} />
      <ReplaceDivorceEvidenceModal
        show={!!replaceTarget}
        onClose={() => setReplaceTarget(undefined)}
        registration={draft}
        evidence={replaceTarget}
        actorName={actorName}
        onReplaced={(updated) => {
          setReplaceTarget(undefined);
          onCaseSynced(updated);
        }}
      />
      <RemoveDivorceEvidenceModal
        show={!!removeTarget}
        onClose={() => setRemoveTarget(undefined)}
        registration={draft}
        evidence={removeTarget}
        actorName={actorName}
        onRemoved={(updated) => {
          setRemoveTarget(undefined);
          onCaseSynced(updated);
        }}
      />
      <DocumentPreviewModal show={!!previewTarget} onClose={() => setPreviewTarget(undefined)} evidence={previewTarget} />
    </div>
  );
}
