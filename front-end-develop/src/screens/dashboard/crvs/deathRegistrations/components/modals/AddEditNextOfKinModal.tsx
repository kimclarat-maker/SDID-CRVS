import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { NextOfKin, IdentityDocumentType } from "@/domain/crvs/types";

export default function AddEditNextOfKinModal({
  show,
  onClose,
  initial,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  initial?: NextOfKin;
  onSave: (kin: NextOfKin) => void;
}) {
  const [relationship, setRelationship] = useState(initial?.relationship || "");
  const [firstName, setFirstName] = useState(initial?.firstName || "");
  const [lastName, setLastName] = useState(initial?.lastName || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [preferredNotificationMethod, setPreferredNotificationMethod] = useState<NextOfKin["preferredNotificationMethod"]>(initial?.preferredNotificationMethod || "PHONE_CALL");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(initial?.documentType || "NONE");
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber || "");
  const [error, setError] = useState<string | undefined>();

  const handleSave = () => {
    if (!relationship.trim() || !firstName.trim() || !lastName.trim()) {
      setError("Relationship and full name are required.");
      return;
    }
    onSave({ relationship, firstName, lastName, phone: phone || undefined, email: email || undefined, preferredNotificationMethod, documentType, documentNumber: documentNumber || undefined, verification: "NOT_VERIFIED" });
    onClose();
  };

  return (
    <Modal show={show} handleClose={onClose} title={initial ? "Edit next of kin" : "Add next of kin"} size="sm" testId="add-next-of-kin-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="kin-relationship">Relationship to deceased</label>
            <input id="kin-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} data-testid="kin-relationship" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-first">First name</label>
            <input id="kin-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="kin-first-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-last">Last name</label>
            <input id="kin-last" value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="kin-last-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-phone">Phone</label>
            <input id="kin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-email">Email</label>
            <input id="kin-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-notify">Preferred notification method</label>
            <select id="kin-notify" value={preferredNotificationMethod} onChange={(e) => setPreferredNotificationMethod(e.target.value as NextOfKin["preferredNotificationMethod"])}>
              <option value="PHONE_CALL">Phone call</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-doctype">Document type</label>
            <select id="kin-doctype" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              <option value="NONE">None provided</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="kin-docnum">Document number</label>
            <input id="kin-docnum" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
        </div>
        {error && <p className="crvs-form-error" role="alert">{error}</p>}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={onClose} testId="kin-cancel" />
        <Button text="Save" appearance="primary" onClick={handleSave} testId="kin-save" />
      </div>
    </Modal>
  );
}
