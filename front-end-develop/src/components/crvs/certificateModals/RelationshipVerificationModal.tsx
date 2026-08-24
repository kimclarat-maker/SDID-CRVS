import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";

const RELATIONSHIPS = ["Mother", "Father", "Legal guardian", "Authorized representative"];

export default function RelationshipVerificationModal({
  show,
  onClose,
  onSubmit,
  testId = "relationship-verification-modal",
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: (relationship: string, authorizationNote?: string) => void;
  testId?: string;
}) {
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [note, setNote] = useState("");

  return (
    <Modal show={show} handleClose={onClose} title="Confirm relationship to subject" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="relationship-select">Relationship</label>
          <select id="relationship-select" value={relationship} onChange={(e) => setRelationship(e.target.value)} data-testid="relationship-select">
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {(relationship === "Legal guardian" || relationship === "Authorized representative") && (
          <div className="crvs-form-group">
            <label htmlFor="authorization-note">Supporting authorization</label>
            <textarea id="authorization-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-testid="authorization-note" />
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={onClose} testId={`${testId}-cancel`} />
        <Button text="Continue" appearance="primary" onClick={() => onSubmit(relationship, note || undefined)} testId={`${testId}-continue`} />
      </div>
    </Modal>
  );
}
