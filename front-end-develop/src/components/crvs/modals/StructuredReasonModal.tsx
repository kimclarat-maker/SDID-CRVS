import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";

export type StructuredReasonValue = {
  reason: string;
  fields: string[];
  note: string;
};

export type ReasonOption = { value: string; label: string };

export type StructuredReasonModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (value: StructuredReasonValue) => Promise<void> | void;
  title: string;
  description?: string;
  reasonOptions: ReasonOption[];
  fieldOptions?: ReasonOption[];
  fieldsLabel?: string;
  noteLabel?: string;
  noteRequired?: boolean;
  requireConfirmation?: boolean;
  confirmationLabel?: string;
  submitLabel: string;
  destructive?: boolean;
  testId?: string;
  children?: React.ReactNode;
};

/** Powers every "structured reason" modal in the workflow — Return
 * Notification, Request Correction, Reject Registration, Resolve Exception,
 * Reassign Case, Duplicate Resolution — each just supplies its own reason
 * taxonomy/field list/labels rather than being a bespoke component. */
export default function StructuredReasonModal({
  show,
  onClose,
  onSubmit,
  title,
  description,
  reasonOptions,
  fieldOptions,
  fieldsLabel = "Affected fields",
  noteLabel = "Note",
  noteRequired = false,
  requireConfirmation = false,
  confirmationLabel = "I confirm this action.",
  submitLabel,
  destructive,
  testId,
  children,
}: StructuredReasonModalProps) {
  const [reason, setReason] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setReason("");
    setFields([]);
    setNote("");
    setConfirmed(false);
    setError(null);
    setValidationError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const toggleField = (value: string) => {
    setFields((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!reason) {
      setValidationError("Select a reason.");
      return;
    }
    if (noteRequired && !note.trim()) {
      setValidationError("A note is required.");
      return;
    }
    if (requireConfirmation && !confirmed) {
      setValidationError("Please confirm before continuing.");
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ reason, fields, note });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Modal show={show} handleClose={handleClose} title={title} description={description} size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {children}

        <div className="crvs-form-group">
          <label htmlFor={`${testId}-reason`}>Reason</label>
          <select id={`${testId}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} data-testid={`${testId}-reason`}>
            <option value="">Select a reason…</option>
            {reasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {fieldOptions && fieldOptions.length > 0 && (
          <div className="crvs-form-group">
            <label>{fieldsLabel}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fieldOptions.map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                  <input type="checkbox" checked={fields.includes(opt.value)} onChange={() => toggleField(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="crvs-form-group">
          <label htmlFor={`${testId}-note`}>
            {noteLabel} {noteRequired ? "" : "(optional)"}
          </label>
          <textarea
            id={`${testId}-note`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            data-testid={`${testId}-note`}
          />
        </div>

        {requireConfirmation && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} data-testid={`${testId}-confirm-checkbox`} />
            {confirmationLabel}
          </label>
        )}

        {validationError && (
          <p className="crvs-form-error" role="alert">
            {validationError}
          </p>
        )}
        {error && (
          <p className="crvs-banner crvs-banner-danger" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId={`${testId}-cancel`} />
        <Button
          text={submitLabel}
          appearance="primary"
          color={destructive ? "red" : undefined}
          loading={submitting}
          onClick={handleSubmit}
          testId={`${testId}-submit`}
        />
      </div>
    </Modal>
  );
}
