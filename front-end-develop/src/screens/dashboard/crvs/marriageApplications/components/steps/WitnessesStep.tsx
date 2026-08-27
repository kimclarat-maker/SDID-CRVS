import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import AddEditWitnessModal from "../modals/AddEditWitnessModal";
import VerifyWitnessModal from "../modals/VerifyWitnessModal";
import StatusBadge from "../../../components/StatusBadge";
import { WizardStepProps } from "../wizardTypes";
import { MarriageWitness, SpouseRole } from "@/domain/crvs/types";
import { witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";
import { maskDocumentNumber } from "../../../marriageShared";

const GROUPS: { role: SpouseRole; label: string }[] = [
  { role: "APPLICANT1", label: "Applicant 1's witnesses" },
  { role: "APPLICANT2", label: "Applicant 2's witnesses" },
];

/** Wizard step 7: witnesses per applicant (spec §9 step 7) — count/age
 * requirements read from marriagePolicyConfig, replacement supported up
 * until the ceremony. */
export default function WitnessesStep({ draft, onChange, readOnly }: WizardStepProps) {
  const requirement = witnessRequirementForSpouse();
  const [addingFor, setAddingFor] = useState<SpouseRole | undefined>();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [removingId, setRemovingId] = useState<string | undefined>();
  const [verifyingId, setVerifyingId] = useState<string | undefined>();
  const [replacingId, setReplacingId] = useState<string | undefined>();
  const [showReplaceReason, setShowReplaceReason] = useState(false);

  const activeWitnesses = draft.witnesses.filter((w) => !w.replaced);

  const saveWitness = (witness: MarriageWitness) => {
    const list = editingId ? draft.witnesses.map((w) => (w.id === editingId ? witness : w)) : [...draft.witnesses, witness];
    onChange({ witnesses: list });
    setEditingId(undefined);
    setAddingFor(undefined);
  };

  const removeWitness = () => {
    if (!removingId) return;
    onChange({ witnesses: draft.witnesses.filter((w) => w.id !== removingId) });
    setRemovingId(undefined);
  };

  const witnessBeingReplaced = draft.witnesses.find((w) => w.id === replacingId);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Witnesses</h2>

      <div className={`crvs-banner ${GROUPS.every((g) => activeWitnesses.filter((w) => w.spouseRole === g.role).length >= requirement.minimum) ? "crvs-banner-info" : "crvs-banner-warning"}`}>
        <Icon name="groups" /> Each applicant needs at least {requirement.minimum} witness{requirement.minimum === 1 ? "" : "es"} (max {requirement.maximum}), age {requirement.minimumAge}+.
      </div>

      {GROUPS.map((group) => {
        const witnesses = activeWitnesses.filter((w) => w.spouseRole === group.role);
        return (
          <div key={group.role} className="crvs-section" style={{ marginTop: 12 }}>
            <h3 className="crvs-section-title" style={{ fontSize: "var(--font-size-body)" }}>{group.label} ({witnesses.length})</h3>
            {witnesses.length > 0 && (
              <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {witnesses.map((w) => (
                  <li key={w.id} className="crvs-banner crvs-banner-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <strong>{w.firstName} {w.lastName}</strong> — {w.relationship}
                      <div className="crvs-form-hint">{maskDocumentNumber(w.documentNumber)}</div>
                      <StatusBadge kind="verification" status={w.verification} />
                    </div>
                    {!readOnly && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Button text="Verify" size="sm" appearance="ghost" type="button" onClick={() => setVerifyingId(w.id)} testId={`witness-verify-${w.id}`} />
                        <Button text="Edit" size="sm" appearance="ghost" type="button" onClick={() => { setEditingId(w.id); setAddingFor(group.role); }} testId={`witness-edit-${w.id}`} />
                        <Button text="Replace" size="sm" appearance="ghost" type="button" onClick={() => { setReplacingId(w.id); setShowReplaceReason(true); }} testId={`witness-replace-${w.id}`} />
                        <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemovingId(w.id)} testId={`witness-remove-${w.id}`} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!readOnly && witnesses.length < requirement.maximum && (
              <Button text="Add witness" appearance="ghost" startIcon="person_add" type="button" onClick={() => { setEditingId(undefined); setAddingFor(group.role); }} testId={`add-witness-${group.role}`} styles={{ marginTop: 8 }} />
            )}
          </div>
        );
      })}

      <AddEditWitnessModal
        show={!!addingFor}
        onClose={() => { setAddingFor(undefined); setEditingId(undefined); }}
        spouseRole={addingFor || "APPLICANT1"}
        initial={editingId ? draft.witnesses.find((w) => w.id === editingId) : undefined}
        onSave={saveWitness}
      />
      <VerifyWitnessModal
        show={!!verifyingId}
        onClose={() => setVerifyingId(undefined)}
        witness={draft.witnesses.find((w) => w.id === verifyingId)}
        onVerified={(state) => {
          onChange({ witnesses: draft.witnesses.map((w) => (w.id === verifyingId ? { ...w, verification: state } : w)) });
        }}
      />
      <ConfirmActionModal show={!!removingId} onClose={() => setRemovingId(undefined)} onConfirm={removeWitness} title="Remove witness" confirmLabel="Remove" destructive testId="remove-witness-confirm">
        <p style={{ margin: 0 }}>This will remove the witness record from this declaration.</p>
      </ConfirmActionModal>
      <StructuredReasonModal
        show={showReplaceReason}
        onClose={() => { setShowReplaceReason(false); setReplacingId(undefined); }}
        onSubmit={async ({ reason, note }) => {
          if (!witnessBeingReplaced) return;
          onChange({
            witnesses: draft.witnesses.map((w) =>
              w.id === replacingId ? { ...w, replaced: true, replacedAt: new Date().toISOString(), replacedReason: note || reason } : w
            ),
          });
          setShowReplaceReason(false);
          setAddingFor(witnessBeingReplaced.spouseRole);
        }}
        title="Replace witness"
        description={witnessBeingReplaced ? `${witnessBeingReplaced.firstName} ${witnessBeingReplaced.lastName}` : undefined}
        reasonOptions={[
          { value: "UNAVAILABLE", label: "Witness is no longer available" },
          { value: "INELIGIBLE", label: "Witness does not meet eligibility requirements" },
          { value: "OTHER", label: "Other" },
        ]}
        submitLabel="Continue to new witness"
        testId="replace-witness-modal"
      />
    </div>
  );
}
