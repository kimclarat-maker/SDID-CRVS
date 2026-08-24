import Modal from "@/components/Modal";
import Button from "@/components/button";

export default function MultipleMatchesModal({
  show,
  onClose,
  onSearchAgain,
  testId = "multiple-matches-modal",
}: {
  show: boolean;
  onClose: () => void;
  onSearchAgain: () => void;
  testId?: string;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="Manual review required" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16 }}>
        <p>More than one possible record matched the details you provided. We can't show unrelated records here.</p>
        <p className="crvs-form-hint">Your request has been routed for manual review so staff can confirm the correct record.</p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Search with different details" appearance="ghost" onClick={onSearchAgain} testId={`${testId}-search-again`} />
        <Button text="Close" appearance="primary" onClick={onClose} testId={`${testId}-close`} />
      </div>
    </Modal>
  );
}
