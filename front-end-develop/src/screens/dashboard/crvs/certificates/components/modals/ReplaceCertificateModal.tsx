import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Checkbox from "@/components/checkbox";
import { CertificateDeliveryMethod } from "@/domain/crvs/types";
import { ReplacementInput } from "@/demo/services/crvsCertificates";

const REASONS = [
  { value: "Certificate lost", label: "Certificate lost" },
  { value: "Certificate damaged", label: "Certificate damaged" },
  { value: "Certificate compromised", label: "Certificate compromised (security)" },
  { value: "Other", label: "Other" },
];

const METHODS: { value: CertificateDeliveryMethod; label: string }[] = [
  { value: "SECURE_DOWNLOAD", label: "Secure download" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS_LINK", label: "SMS download link" },
  { value: "ASSISTED_CENTRE_COLLECTION", label: "Assisted-centre collection" },
];

export default function ReplaceCertificateModal({
  show,
  onClose,
  certificateNumber,
  onSubmit,
  testId = "replace-certificate-modal",
}: {
  show: boolean;
  onClose: () => void;
  certificateNumber: string;
  onSubmit: (input: ReplacementInput) => Promise<void> | void;
  testId?: string;
}) {
  const [reason, setReason] = useState(REASONS[0].value);
  const [requiresPayment, setRequiresPayment] = useState(true);
  const [requesterVerified, setRequesterVerified] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<CertificateDeliveryMethod>("SECURE_DOWNLOAD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reset = () => {
    setReason(REASONS[0].value);
    setRequiresPayment(true);
    setRequesterVerified(false);
    setDeliveryMethod("SECURE_DOWNLOAD");
    setError(undefined);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!requesterVerified) {
      setError("Confirm requester re-verification before replacing this certificate.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({ reason, requiresPayment, deliveryMethod });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Replace certificate" description={certificateNumber} size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="replace-reason">Replacement reason</label>
          <select id="replace-reason" value={reason} onChange={(e) => setReason(e.target.value)} data-testid="replace-reason-select">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="replace-delivery">Delivery method</label>
          <select
            id="replace-delivery"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value as CertificateDeliveryMethod)}
            data-testid="replace-delivery-select"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={requiresPayment} onChange={(e) => setRequiresPayment(e.target.checked)} data-testid="replace-requires-payment" />
          Requires a new demo payment
        </label>

        <Checkbox
          label="I have re-verified the requester's identity for this replacement."
          checked={requesterVerified}
          onChange={() => setRequesterVerified((v) => !v)}
          testId="replace-requester-verified"
        />

        {error && (
          <p className="crvs-form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId={`${testId}-cancel`} />
        <Button text="Replace certificate" appearance="primary" loading={submitting} onClick={handleSubmit} testId={`${testId}-submit`} />
      </div>
    </Modal>
  );
}
