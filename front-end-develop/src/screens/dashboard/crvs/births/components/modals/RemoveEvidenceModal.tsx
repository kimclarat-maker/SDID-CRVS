import Modal from "@/components/Modal";
import Button from "@/components/button";
import { EvidenceItem } from "@/domain/crvs/types";

export type RemoveEvidenceModalProps = {
  show: boolean;
  evidence?: EvidenceItem;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirms hard removal of an evidence item. Only usable while the case is
 * still a DRAFT — the service itself enforces this (demoRemoveEvidence
 * throws otherwise); this modal just states the rule so a rejection isn't
 * a surprise. */
export default function RemoveEvidenceModal({ show, evidence, busy, onClose, onConfirm }: RemoveEvidenceModalProps) {
  if (!evidence) return null;
  return (
    <Modal show={show} handleClose={onClose} title="Remove evidence" size="sm" testId="remove-evidence-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint" style={{ marginTop: 0 }}>
          Remove "{evidence.fileName}" ({evidence.documentType}) from this application? This is only possible while the
          application is still a draft — once submitted, documents can only be replaced through a correction.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} disabled={busy} testId="remove-evidence-cancel" />
          <Button type="button" text="Remove" appearance="primary" color="red" loading={busy} onClick={onConfirm} testId="remove-evidence-confirm" />
        </div>
      </div>
    </Modal>
  );
}
