import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import AddEvidenceModal from "@/screens/dashboard/crvs/deathRegistrations/components/modals/AddEvidenceModal";
import { WizardStepProps } from "../wizardTypes";
import { requiredDocumentsFor } from "@/domain/crvs/marriagePolicyConfig";
import { demoAttachMarriageEvidence, demoRemoveMarriageEvidence } from "@/demo/services/crvsMarriageEvidence";
import { getCurrentActorName } from "@/utils/workspace";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { EvidenceItem } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";

/** Wizard step 6: supporting evidence (spec §9 step 6) — required documents
 * are computed per applicant from marriagePolicyConfig's nationality x
 * civil-status matrix, never hardcoded per screen. */
export default function EvidenceStep({ draft, onCaseSynced, readOnly }: WizardStepProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState<EvidenceItem | undefined>();
  const [removingId, setRemovingId] = useState<string | undefined>();

  const requiredTypes = Array.from(
    new Set([
      ...requiredDocumentsFor(draft.applicant1.nationalityCategory, draft.applicant1.civilStatus),
      ...requiredDocumentsFor(draft.applicant2.nationalityCategory, draft.applicant2.civilStatus),
    ])
  );
  const attachedTypes = new Set(draft.evidence.filter((e) => !e.removed).map((e) => e.documentType));
  const missing = requiredTypes.filter((t) => !attachedTypes.has(t));

  const handleUpload = async (input: AttachEvidenceInput) => {
    setBusy(true);
    try {
      const updated = demoAttachMarriageEvidence(draft.id, input, getCurrentActorName());
      onCaseSynced(updated);
      toastMessage("success", "Evidence attached.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!removingId) return;
    const updated = demoRemoveMarriageEvidence(draft.id, removingId, getCurrentActorName());
    onCaseSynced(updated);
    setRemovingId(undefined);
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Supporting evidence</h2>

      {missing.length > 0 ? (
        <div className="crvs-banner crvs-banner-warning">
          <Icon name="warning" /> Still required: {missing.join(", ")}
        </div>
      ) : (
        <div className="crvs-banner crvs-banner-info">
          <Icon name="check_circle" /> All required documents for both applicants' nationality and civil status are attached.
        </div>
      )}

      {draft.evidence.filter((e) => !e.removed).length > 0 && (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {draft.evidence.filter((e) => !e.removed).map((e) => (
            <li key={e.id} className="crvs-case-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{e.documentType}</strong>
                <div className="crvs-form-hint">{e.fileName}</div>
                <StatusBadge kind="verification" status={e.verification} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewing(e)} testId={`evidence-preview-${e.id}`} />
                {!readOnly && (draft.status === "DRAFT" || draft.status === "CORRECTION_REQUIRED") && (
                  <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemovingId(e.id)} testId={`evidence-remove-${e.id}`} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <Button text="Add evidence" appearance="ghost" startIcon="upload_file" type="button" onClick={() => setShowAdd(true)} testId="add-marriage-evidence" styles={{ marginTop: 12 }} />
      )}

      <AddEvidenceModal show={showAdd} onClose={() => setShowAdd(false)} requiredTypes={missing.length > 0 ? missing : requiredTypes} busy={busy} onUpload={handleUpload} />
      <DocumentPreviewModal show={!!previewing} onClose={() => setPreviewing(undefined)} evidence={previewing} />
      <ConfirmActionModal show={!!removingId} onClose={() => setRemovingId(undefined)} onConfirm={handleRemove} title="Remove evidence" confirmLabel="Remove" destructive testId="remove-marriage-evidence-confirm">
        <p style={{ margin: 0 }}>This will remove the evidence item from this declaration.</p>
      </ConfirmActionModal>
    </div>
  );
}
