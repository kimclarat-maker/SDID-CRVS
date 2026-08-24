import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import AddEditWitnessModal from "../modals/AddEditWitnessModal";
import VerifyWitnessModal from "../modals/VerifyWitnessModal";
import StatusBadge from "../../../components/StatusBadge";
import { WizardStepProps } from "../wizardTypes";
import { DeathWitness } from "@/domain/crvs/types";
import { witnessRequirementFor } from "@/domain/crvs/crvsPolicyConfig";
import { maskDocumentNumber } from "../../../deathShared";

/** Wizard step 5: witnesses — only required for pathways crvsPolicyConfig
 * flags as requiring them (spec §5 step 6). */
export default function WitnessesStep({ draft, onChange, readOnly }: WizardStepProps) {
  const requirement = witnessRequirementFor(draft.pathway);
  const [showAdd, setShowAdd] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const [removeIndex, setRemoveIndex] = useState<number | undefined>();
  const [verifyIndex, setVerifyIndex] = useState<number | undefined>();

  const saveWitness = (witness: DeathWitness) => {
    const list = [...draft.witnesses];
    if (editingIndex !== undefined) list[editingIndex] = witness;
    else list.push(witness);
    onChange({ witnesses: list });
    setEditingIndex(undefined);
  };

  const removeWitness = () => {
    if (removeIndex === undefined) return;
    onChange({ witnesses: draft.witnesses.filter((_, i) => i !== removeIndex) });
    setRemoveIndex(undefined);
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Witnesses</h2>

      {requirement.required ? (
        <div className={`crvs-banner ${draft.witnesses.length >= requirement.minimum ? "crvs-banner-info" : "crvs-banner-warning"}`}>
          <Icon name={draft.witnesses.length >= requirement.minimum ? "check_circle" : "warning"} />
          This pathway requires at least {requirement.minimum} witness{requirement.minimum === 1 ? "" : "es"} — currently{" "}
          {draft.witnesses.length}.
        </div>
      ) : (
        <p className="crvs-form-hint">Witnesses are optional for this pathway.</p>
      )}

      {draft.witnesses.length > 0 && (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {draft.witnesses.map((w, i) => (
            <li key={w.id} className="crvs-banner crvs-banner-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{w.firstName} {w.lastName}</strong> — {w.relationship}
                <div className="crvs-form-hint">
                  {maskDocumentNumber(w.documentNumber)} {w.basisOfKnowledge ? `· ${w.basisOfKnowledge}` : ""}
                </div>
                <StatusBadge kind="verification" status={w.verification} />
              </div>
              {!readOnly && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Button text="Verify" size="sm" appearance="ghost" type="button" onClick={() => setVerifyIndex(i)} testId={`witness-verify-${i}`} />
                  <Button text="Edit" size="sm" appearance="ghost" type="button" onClick={() => { setEditingIndex(i); setShowAdd(true); }} testId={`witness-edit-${i}`} />
                  <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemoveIndex(i)} testId={`witness-remove-${i}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <Button text="Add witness" appearance="ghost" startIcon="person_add" type="button" onClick={() => { setEditingIndex(undefined); setShowAdd(true); }} testId="add-witness" styles={{ marginTop: 12 }} />
      )}

      <AddEditWitnessModal
        show={showAdd}
        onClose={() => { setShowAdd(false); setEditingIndex(undefined); }}
        initial={editingIndex !== undefined ? draft.witnesses[editingIndex] : undefined}
        onSave={saveWitness}
      />
      <VerifyWitnessModal
        show={verifyIndex !== undefined}
        onClose={() => setVerifyIndex(undefined)}
        witness={verifyIndex !== undefined ? draft.witnesses[verifyIndex] : undefined}
        onVerified={(state) => {
          if (verifyIndex === undefined) return;
          const list = [...draft.witnesses];
          list[verifyIndex] = { ...list[verifyIndex], verification: state };
          onChange({ witnesses: list });
        }}
      />
      <ConfirmActionModal show={removeIndex !== undefined} onClose={() => setRemoveIndex(undefined)} onConfirm={removeWitness} title="Remove witness" confirmLabel="Remove" destructive testId="remove-witness-confirm">
        <p style={{ margin: 0 }}>This will remove the witness record from this case.</p>
      </ConfirmActionModal>
    </div>
  );
}
