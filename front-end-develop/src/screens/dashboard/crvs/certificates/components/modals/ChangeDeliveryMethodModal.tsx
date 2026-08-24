import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { CertificateDeliveryMethod } from "@/domain/crvs/types";

const OPTIONS: { value: CertificateDeliveryMethod; label: string }[] = [
  { value: "SECURE_DOWNLOAD", label: "Secure download" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS_LINK", label: "SMS download link" },
  { value: "ASSISTED_CENTRE_COLLECTION", label: "Assisted-centre collection" },
];

export default function ChangeDeliveryMethodModal({
  show,
  onClose,
  currentMethod,
  onSubmit,
  testId = "change-delivery-method-modal",
}: {
  show: boolean;
  onClose: () => void;
  currentMethod: CertificateDeliveryMethod;
  onSubmit: (method: CertificateDeliveryMethod) => Promise<void> | void;
  testId?: string;
}) {
  const [method, setMethod] = useState<CertificateDeliveryMethod>(currentMethod);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(method);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Change delivery method" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="delivery-method-select">New delivery method</label>
          <select
            id="delivery-method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value as CertificateDeliveryMethod)}
            data-testid="delivery-method-select"
          >
            {OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="crvs-banner crvs-banner-info">
          Changing the delivery destination requires the requester to re-verify their identity before the certificate
          is delivered again.
        </p>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId={`${testId}-cancel`} />
        <Button text="Save & require re-verification" appearance="primary" loading={submitting} onClick={handleSubmit} testId={`${testId}-submit`} />
      </div>
    </Modal>
  );
}
