import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type RunDuplicateCheckModalProps = {
  show: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onRun: () => void;
};

/** Explains which fields the duplicate check compares before running it
 * (spec: name, DOB, mother's identity, facility/place of birth). */
export default function RunDuplicateCheckModal({ show, busy, error, onClose, onRun }: RunDuplicateCheckModalProps) {
  return (
    <Modal show={show} handleClose={onClose} title="Run duplicate check" size="sm" testId="run-duplicate-check-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint" style={{ marginTop: 0 }}>
          This compares the child's name, date of birth, the mother's identity, and the facility/place of birth
          against every other active registration case.
        </p>
        <ul style={{ margin: "8px 0", paddingLeft: 20, fontSize: "var(--font-size-body-sm)" }}>
          <li>Child full name</li>
          <li>Date of birth</li>
          <li>Mother's name / document number</li>
          <li>Facility or place of birth</li>
        </ul>
        <div className="crvs-banner crvs-banner-info">
          <Icon name="info" />
          <span>Siblings from a recorded multiple birth are automatically exempted from matching each other.</span>
        </div>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} disabled={busy} testId="run-duplicate-check-cancel" />
          <Button type="button" text="Run check" appearance="primary" loading={busy} onClick={onRun} testId="run-duplicate-check-confirm" />
        </div>
      </div>
    </Modal>
  );
}
