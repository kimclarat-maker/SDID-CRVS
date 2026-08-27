import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { MarriageWitness, IdentityDocumentType, SpouseRole } from "@/domain/crvs/types";
import { newLocalId } from "../../../marriageShared";

export default function AddEditWitnessModal({
  show,
  onClose,
  initial,
  spouseRole,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  initial?: MarriageWitness;
  spouseRole: SpouseRole;
  onSave: (witness: MarriageWitness) => void;
}) {
  const [relationship, setRelationship] = useState(initial?.relationship || "");
  const [firstName, setFirstName] = useState(initial?.firstName || "");
  const [lastName, setLastName] = useState(initial?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth?.slice(0, 10) || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(initial?.documentType || "NONE");
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber || "");
  const [error, setError] = useState<string | undefined>();

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim() || !relationship.trim() || !dateOfBirth) {
      setError("Name, relationship, and date of birth are required.");
      return;
    }
    onSave({
      id: initial?.id || newLocalId("MW"),
      spouseRole,
      relationship,
      firstName,
      lastName,
      dateOfBirth,
      phone: phone || undefined,
      documentType,
      documentNumber: documentNumber || undefined,
      verification: initial?.verification || "NOT_VERIFIED",
    });
    onClose();
  };

  return (
    <Modal show={show} handleClose={onClose} title={initial ? "Edit witness" : "Add witness"} size="sm" testId="add-marriage-witness-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="mwit-first">First name</label>
            <input id="mwit-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="marriage-witness-first-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-last">Last name</label>
            <input id="mwit-last" value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="marriage-witness-last-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-dob">Date of birth</label>
            <input id="mwit-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} data-testid="marriage-witness-dob" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-relationship">Relationship to applicant</label>
            <input id="mwit-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-phone">Phone</label>
            <input id="mwit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-doctype">Document type</label>
            <select id="mwit-doctype" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              <option value="NONE">None provided</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="mwit-docnum">Document number</label>
            <input id="mwit-docnum" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
        </div>
        {error && <p className="crvs-form-error" role="alert">{error}</p>}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={onClose} testId="marriage-witness-cancel" />
        <Button text="Save" appearance="primary" onClick={handleSave} testId="marriage-witness-save" />
      </div>
    </Modal>
  );
}
