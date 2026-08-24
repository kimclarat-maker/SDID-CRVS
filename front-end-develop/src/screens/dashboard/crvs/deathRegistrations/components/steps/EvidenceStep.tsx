import { useState } from "react";
import Button from "@/components/button";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import AddEvidenceModal from "../modals/AddEvidenceModal";
import { WizardStepProps } from "../wizardTypes";
import { evidenceRequirementFor } from "@/domain/crvs/crvsPolicyConfig";
import { demoAttachDeathEvidence, demoRemoveDeathEvidence } from "@/demo/services/crvsDeathEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { getCurrentActorName } from "@/utils/workspace";
import { DeathEvidence } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";

/** Wizard step 6: evidence — required categories vary by pathway
 * (crvsPolicyConfig.evidenceRequirements), file validation, preview, remove
 * (spec §5 step 7). */
export default function EvidenceStep({ draft, onCaseSynced, readOnly }: WizardStepProps) {
  const requiredTypes = evidenceRequirementFor(draft.pathway);
  const [showAdd, setShowAdd] = useState(false);
  const [previewItem, setPreviewItem] = useState<DeathEvidence | undefined>();
  const [removeId, setRemoveId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const active = draft.evidence.filter((e) => !e.removed);
  const missingCategories = requiredTypes.filter((t) => !active.some((e) => e.documentType.toLowerCase().includes(t.toLowerCase().split("_")[0])));

  const handleUpload = async (input: AttachEvidenceInput) => {
    setBusy(true);
    try {
      const updated = demoAttachDeathEvidence(draft.id, input, getCurrentActorName());
      onCaseSynced?.(updated);
      toastMessage("success", "Evidence attached.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    const updated = demoRemoveDeathEvidence(draft.id, removeId, getCurrentActorName());
    onCaseSynced?.(updated);
    setRemoveId(undefined);
    toastMessage("success", "Evidence removed.");
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Evidence</h2>

      {missingCategories.length > 0 ? (
        <div className="crvs-banner crvs-banner-warning">
          This pathway typically requires: {missingCategories.map((c) => c.replace(/_/g, " ").toLowerCase()).join(", ")}.
        </div>
      ) : (
        <div className="crvs-banner crvs-banner-info">All required evidence categories for this pathway have at least one item attached.</div>
      )}

      {active.length === 0 ? (
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>No evidence attached yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {active.map((ev) => (
            <li key={ev.id} className="crvs-banner crvs-banner-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{ev.documentType}</strong> — {ev.fileName} ({ev.fileSizeKb}KB)
                <div className="crvs-form-hint">
                  Uploaded {new Date(ev.uploadedAt).toLocaleString()} by {ev.uploadedBy}
                </div>
                <StatusBadge kind="verification" status={ev.verification} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewItem(ev)} testId={`evidence-preview-${ev.id}`} />
                {!readOnly && draft.status === "DRAFT" && (
                  <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemoveId(ev.id)} testId={`evidence-remove-${ev.id}`} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <Button text="Add evidence" appearance="ghost" startIcon="upload_file" type="button" onClick={() => setShowAdd(true)} testId="add-evidence" styles={{ marginTop: 12 }} />
      )}

      <AddEvidenceModal show={showAdd} onClose={() => setShowAdd(false)} requiredTypes={requiredTypes} busy={busy} onUpload={handleUpload} />
      <DocumentPreviewModal show={!!previewItem} onClose={() => setPreviewItem(undefined)} evidence={previewItem} />
      <ConfirmActionModal show={!!removeId} onClose={() => setRemoveId(undefined)} onConfirm={handleRemove} title="Remove evidence" confirmLabel="Remove" destructive testId="remove-evidence-confirm">
        <p style={{ margin: 0 }}>This will permanently remove this evidence item from the draft case.</p>
      </ConfirmActionModal>
    </div>
  );
}
