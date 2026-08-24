import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { IdentityDocumentType, Witness } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS } from "../../shared";

export type AddWitnessModalProps = {
  show: boolean;
  onClose: () => void;
  existingDocumentNumbers: string[];
  onAdd: (witness: Omit<Witness, "id">) => void;
};

const DOC_TYPES: IdentityDocumentType[] = ["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE", "OTHER", "NONE"];

/** Adds a witness to the case, guarding against the same identity
 * (matched by document number) being added twice. */
export default function AddWitnessModal({ show, onClose, existingDocumentNumbers, onAdd }: AddWitnessModalProps) {
  const [relationship, setRelationship] = useState("");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>("NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>();

  const reset = () => {
    setRelationship("");
    setDocumentType("NATIONAL_ID");
    setDocumentNumber("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim() || !relationship.trim()) {
      setError("First name, last name and relationship are required.");
      return;
    }
    if (
      documentNumber.trim() &&
      existingDocumentNumbers.some((n) => n.trim().toLowerCase() === documentNumber.trim().toLowerCase())
    ) {
      setError("A witness with this document number has already been added to this case.");
      return;
    }
    onAdd({
      relationship: relationship.trim(),
      documentType,
      documentNumber: documentNumber.trim() || undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      verification: documentNumber.trim() ? "UNVERIFIED_PROVIDED" : "NOT_VERIFIED",
    });
    reset();
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Add witness" size="sm" testId="add-witness-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="wit-relationship">Relationship to child</label>
            <input id="wit-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-doc-type">Document type</label>
            <select id="wit-doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-doc-number">Document number</label>
            <input id="wit-doc-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-first">First name</label>
            <input id="wit-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-last">Last name</label>
            <input id="wit-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="wit-phone">Phone</label>
            <input id="wit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} testId="add-witness-cancel" />
          <Button type="button" text="Add witness" appearance="primary" onClick={handleAdd} testId="add-witness-confirm" />
        </div>
      </div>
    </Modal>
  );
}
