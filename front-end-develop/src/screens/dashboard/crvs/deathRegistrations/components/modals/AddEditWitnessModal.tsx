import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { DeathWitness, IdentityDocumentType } from "@/domain/crvs/types";
import { newLocalId } from "../../../deathShared";

export default function AddEditWitnessModal({
  show,
  onClose,
  initial,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  initial?: DeathWitness;
  onSave: (witness: DeathWitness) => void;
}) {
  const [relationship, setRelationship] = useState(initial?.relationship || "");
  const [firstName, setFirstName] = useState(initial?.firstName || "");
  const [lastName, setLastName] = useState(initial?.lastName || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(initial?.documentType || "NONE");
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber || "");
  const [basisOfKnowledge, setBasisOfKnowledge] = useState(initial?.basisOfKnowledge || "");
  const [error, setError] = useState<string | undefined>();

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim() || !relationship.trim()) {
      setError("Name and relationship / basis of knowledge are required.");
      return;
    }
    onSave({
      id: initial?.id || newLocalId("DW"),
      relationship,
      firstName,
      lastName,
      phone: phone || undefined,
      documentType,
      documentNumber: documentNumber || undefined,
      basisOfKnowledge: basisOfKnowledge || undefined,
      verification: initial?.verification || "NOT_VERIFIED",
    });
    onClose();
  };

  return (
    <Modal show={show} handleClose={onClose} title={initial ? "Edit witness" : "Add witness"} size="sm" testId="add-witness-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="wit-first">First name</label>
            <input id="wit-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="witness-first-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-last">Last name</label>
            <input id="wit-last" value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="witness-last-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-relationship">Relationship to deceased</label>
            <input id="wit-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-phone">Phone</label>
            <input id="wit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-doctype">Document type</label>
            <select id="wit-doctype" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              <option value="NONE">None provided</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-docnum">Document number</label>
            <input id="wit-docnum" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
          <div className="crvs-form-group" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="wit-basis">Basis of knowledge</label>
            <textarea id="wit-basis" rows={2} value={basisOfKnowledge} onChange={(e) => setBasisOfKnowledge(e.target.value)} placeholder="How does the witness know the death occurred as described?" />
          </div>
        </div>
        {error && <p className="crvs-form-error" role="alert">{error}</p>}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={onClose} testId="witness-cancel" />
        <Button text="Save" appearance="primary" onClick={handleSave} testId="witness-save" />
      </div>
    </Modal>
  );
}
