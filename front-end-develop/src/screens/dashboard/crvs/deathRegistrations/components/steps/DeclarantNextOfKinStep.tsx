import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import AddEditNextOfKinModal from "../modals/AddEditNextOfKinModal";
import { WizardStepProps } from "../wizardTypes";
import { Declarant, IdentityDocumentType, NextOfKin } from "@/domain/crvs/types";
import { maskDocumentNumber } from "../../../deathShared";

/** Wizard step 4: declarant identity/relationship/contact + next-of-kin
 * list (spec §5 step 5). */
export default function DeclarantNextOfKinStep({ draft, onChange, readOnly }: WizardStepProps) {
  const declarant = draft.declarant;
  const setDeclarant = (patch: Partial<Declarant>) => onChange({ declarant: { ...declarant, ...patch } });

  const [showAddKin, setShowAddKin] = useState(false);
  const [editingKinIndex, setEditingKinIndex] = useState<number | undefined>();
  const [removeKinIndex, setRemoveKinIndex] = useState<number | undefined>();

  const saveKin = (kin: NextOfKin) => {
    const list = [...draft.nextOfKin];
    if (editingKinIndex !== undefined) list[editingKinIndex] = kin;
    else list.push(kin);
    onChange({ nextOfKin: list });
    setEditingKinIndex(undefined);
  };

  const removeKin = () => {
    if (removeKinIndex === undefined) return;
    onChange({ nextOfKin: draft.nextOfKin.filter((_, i) => i !== removeKinIndex) });
    setRemoveKinIndex(undefined);
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Declarant</h2>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="decl-relationship">Relationship to deceased</label>
          <input id="decl-relationship" value={declarant.relationship} disabled={readOnly} onChange={(e) => setDeclarant({ relationship: e.target.value })} data-testid="wizard-declarant-relationship" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-first">First name</label>
          <input id="decl-first" value={declarant.firstName} disabled={readOnly} onChange={(e) => setDeclarant({ firstName: e.target.value })} data-testid="wizard-declarant-first" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-last">Last name</label>
          <input id="decl-last" value={declarant.lastName} disabled={readOnly} onChange={(e) => setDeclarant({ lastName: e.target.value })} data-testid="wizard-declarant-last" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-doctype">Document type</label>
          <select id="decl-doctype" value={declarant.documentType} disabled={readOnly} onChange={(e) => setDeclarant({ documentType: e.target.value as IdentityDocumentType })}>
            <option value="NONE">None provided</option>
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-docnum">Document number</label>
          <input id="decl-docnum" value={declarant.documentNumber || ""} disabled={readOnly} onChange={(e) => setDeclarant({ documentNumber: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-phone">Phone</label>
          <input id="decl-phone" value={declarant.phone || ""} disabled={readOnly} onChange={(e) => setDeclarant({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="decl-email">Email</label>
          <input id="decl-email" value={declarant.email || ""} disabled={readOnly} onChange={(e) => setDeclarant({ email: e.target.value })} />
        </div>
      </div>

      <h2 className="crvs-section-title" style={{ marginTop: 20 }}>Next of kin</h2>
      {draft.nextOfKin.length === 0 ? (
        <p className="crvs-form-hint">No next of kin recorded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {draft.nextOfKin.map((kin, i) => (
            <li key={i} className="crvs-banner crvs-banner-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{kin.firstName} {kin.lastName}</strong> — {kin.relationship}
                <div className="crvs-form-hint">
                  {kin.phone || kin.email || "No contact provided"} · {maskDocumentNumber(kin.documentNumber)}
                </div>
              </div>
              {!readOnly && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Button text="Edit" size="sm" appearance="ghost" type="button" onClick={() => { setEditingKinIndex(i); setShowAddKin(true); }} testId={`kin-edit-${i}`} />
                  <Button text="Remove" size="sm" appearance="ghost" color="red" type="button" onClick={() => setRemoveKinIndex(i)} testId={`kin-remove-${i}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <Button text="Add next of kin" appearance="ghost" startIcon="person_add" type="button" onClick={() => { setEditingKinIndex(undefined); setShowAddKin(true); }} testId="add-next-of-kin" styles={{ marginTop: 8 }} />
      )}

      <AddEditNextOfKinModal
        show={showAddKin}
        onClose={() => { setShowAddKin(false); setEditingKinIndex(undefined); }}
        initial={editingKinIndex !== undefined ? draft.nextOfKin[editingKinIndex] : undefined}
        onSave={saveKin}
      />
      <ConfirmActionModal
        show={removeKinIndex !== undefined}
        onClose={() => setRemoveKinIndex(undefined)}
        onConfirm={removeKin}
        title="Remove next of kin"
        confirmLabel="Remove"
        destructive
        testId="remove-kin-confirm"
      >
        <p style={{ margin: 0 }}><Icon name="warning" /> This will remove the next-of-kin record from this case.</p>
      </ConfirmActionModal>
    </div>
  );
}
