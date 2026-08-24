import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type WarningModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  testId?: string;
};

/** Non-destructive informational warning — e.g. Active Review Conflict,
 * Conflict of Interest. Escape/backdrop close it (spec §21: destructive
 * actions are the exception, and this one isn't destructive). */
export default function WarningModal({ show, onClose, title, children, primaryLabel = "Close", onPrimary, testId = "warning-modal" }: WarningModalProps) {
  return (
    <Modal show={show} handleClose={onClose} size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span className="crvs-status-pill crvs-status-warning" style={{ display: "inline-flex", padding: 8, borderRadius: "50%" }}>
            <Icon name="warning" />
          </span>
          <div>
            <h2 style={{ margin: "0 0 8px" }}>{title}</h2>
            {children}
          </div>
        </div>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text={primaryLabel} appearance="primary" onClick={onPrimary || onClose} testId={`${testId}-primary`} />
      </div>
    </Modal>
  );
}
