import Modal from "@/components/Modal";
import Button from "@/components/button";

export type UnsavedChangesModalProps = {
  show: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSaveDraftAndLeave: () => Promise<void> | void;
  testId?: string;
};

/** Shared "leaving a dirty wizard" guard for both the notification and
 * registration wizards (spec §5.4/§10). */
export default function UnsavedChangesModal({ show, onStay, onDiscard, onSaveDraftAndLeave, testId = "unsaved-changes" }: UnsavedChangesModalProps) {
  return (
    <Modal show={show} handleClose={onStay} title="You have unsaved changes" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16 }}>
        <p>Leaving now will lose changes that haven&apos;t been saved. What would you like to do?</p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", padding: 16 }}>
        <Button text="Stay on page" appearance="ghost" onClick={onStay} testId={`${testId}-stay`} />
        <Button text="Discard changes" appearance="ghost" color="red" onClick={onDiscard} testId={`${testId}-discard`} />
        <Button text="Save draft and leave" appearance="primary" onClick={onSaveDraftAndLeave} testId={`${testId}-save-and-leave`} />
      </div>
    </Modal>
  );
}
