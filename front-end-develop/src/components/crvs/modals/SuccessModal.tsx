import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type SuccessModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testId?: string;
};

export default function SuccessModal({ show, onClose, title, description, children, primaryLabel, onPrimary, secondaryLabel, onSecondary, testId = "success-modal" }: SuccessModalProps) {
  return (
    <Modal show={show} handleClose={onClose} size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 24, textAlign: "center" }}>
        <span className="crvs-status-pill crvs-status-success" style={{ display: "inline-flex", padding: 10, borderRadius: "50%", marginBottom: 12 }}>
          <Icon name="check_circle" styles={{ fontSize: 28 }} />
        </span>
        <h2 style={{ margin: "0 0 8px" }}>{title}</h2>
        {description && <p className="crvs-form-hint" style={{ margin: "0 0 12px" }}>{description}</p>}
        {children}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", padding: 16 }}>
        {secondaryLabel && <Button text={secondaryLabel} appearance="ghost" onClick={onSecondary || onClose} testId={`${testId}-secondary`} />}
        <Button text={primaryLabel || "Close"} appearance="primary" onClick={onPrimary || onClose} testId={`${testId}-primary`} />
      </div>
    </Modal>
  );
}
