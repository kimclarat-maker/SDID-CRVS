import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { Witness } from "@/domain/crvs/types";

export type RemoveWitnessModalProps = {
  show: boolean;
  witness?: Witness;
  remainingAfterRemoval: number;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirms witness removal, warning (not blocking — this demo treats the
 * minimum witness count as 0) when the removal would leave the case with no
 * witnesses recorded. */
export default function RemoveWitnessModal({ show, witness, remainingAfterRemoval, onClose, onConfirm }: RemoveWitnessModalProps) {
  if (!witness) return null;
  return (
    <Modal show={show} handleClose={onClose} title="Remove witness" size="sm" testId="remove-witness-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint" style={{ marginTop: 0 }}>
          Remove {witness.firstName} {witness.lastName} ({witness.relationship}) from this application?
        </p>
        {remainingAfterRemoval < 1 && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="warning" />
            <span>This will leave the application with no witnesses recorded. This is allowed, but may be flagged during review.</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} testId="remove-witness-cancel" />
          <Button type="button" text="Remove witness" appearance="primary" color="red" onClick={onConfirm} testId="remove-witness-confirm" />
        </div>
      </div>
    </Modal>
  );
}
