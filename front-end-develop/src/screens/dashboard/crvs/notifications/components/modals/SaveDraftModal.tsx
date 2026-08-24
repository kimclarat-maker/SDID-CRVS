import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type SaveDraftModalProps = {
  show: boolean;
  reference?: string;
  onContinueEditing: () => void;
  onSaveAndClose: () => void;
};

/** Shown right after a "Save draft" click succeeds — the draft is already
 * saved by the time this appears, this just asks where to go next. */
export default function SaveDraftModal({ show, reference, onContinueEditing, onSaveAndClose }: SaveDraftModalProps) {
  return (
    <Modal show={show} handleClose={onContinueEditing} title="Draft saved" testId="save-draft-modal">
      <div style={{ padding: "12px 0" }}>
        <p style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
          <Icon name="cloud_done" />
          {reference ? `"${reference}" has been saved as a draft.` : "Your progress has been saved as a draft."}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16 }}>
          <Button text="Continue editing" appearance="ghost" type="button" onClick={onContinueEditing} testId="save-draft-continue" />
          <Button text="Save and close" appearance="primary" type="button" onClick={onSaveAndClose} testId="save-draft-close" />
        </div>
      </div>
    </Modal>
  );
}
