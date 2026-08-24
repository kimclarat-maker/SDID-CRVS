import Modal from "@/components/Modal";
import Button from "@/components/button";

export default function RecordNotFoundModal({
  show,
  onClose,
  onSearchAgain,
  testId = "record-not-found-modal",
}: {
  show: boolean;
  onClose: () => void;
  onSearchAgain: () => void;
  testId?: string;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="No eligible record found" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p>We couldn't find a registered birth record matching the details you provided.</p>
        <p className="crvs-form-hint">
          Requesting a certificate does not register a birth. If this birth hasn't been registered yet, it needs to go
          through birth registration first.
        </p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", padding: 16 }}>
        <Button text="View birth-registration service" appearance="ghost" onClick={() => window.open("/civil-registration/birth", "_blank")} testId={`${testId}-guidance`} />
        <Button text="Find a service centre" appearance="ghost" onClick={() => window.open("/service-centres", "_blank")} testId={`${testId}-centre`} />
        <Button text="Search again" appearance="primary" onClick={onSearchAgain} testId={`${testId}-search-again`} />
      </div>
    </Modal>
  );
}
