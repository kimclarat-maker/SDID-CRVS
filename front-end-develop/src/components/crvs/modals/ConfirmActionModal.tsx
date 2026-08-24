import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";

export type ConfirmActionModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  testId?: string;
};

/** The generic confirm/cancel primitive behind most of the birth-workflow's
 * "are you sure" modals (Start Review, Accept Notification, Retry
 * Synchronization, etc.). Owns the loading state that disables the confirm
 * button after the first click so a slow demo-delay can never double-fire,
 * and surfaces the rejection from onConfirm as an inline recoverable error
 * instead of leaving the modal silently stuck. */
export default function ConfirmActionModal({
  show,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  disabled,
  testId,
}: ConfirmActionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  return (
    <Modal show={show} handleClose={handleClose} title={title} description={description} size="sm" testId={testId}>
      <div className="modal-body">
        {children}
        {error && (
          <p className="crvs-banner crvs-banner-danger" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text={cancelLabel} appearance="ghost" onClick={handleClose} disabled={submitting} testId={`${testId || "confirm-action"}-cancel`} />
        <Button
          text={confirmLabel}
          appearance="primary"
          color={destructive ? "red" : undefined}
          loading={submitting}
          disabled={disabled || submitting}
          onClick={handleConfirm}
          testId={`${testId || "confirm-action"}-confirm`}
        />
      </div>
    </Modal>
  );
}
