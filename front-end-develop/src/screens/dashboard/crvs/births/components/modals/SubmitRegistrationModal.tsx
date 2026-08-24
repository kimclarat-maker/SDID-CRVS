import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";

export type SubmitRegistrationModalProps = {
  show: boolean;
  warnings: string[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

/** Final confirmation before demoSubmitRegistration — surfaces outstanding
 * warnings (missing evidence, unresolved duplicate level, late/exception
 * routing) but doesn't re-implement the routing rules, which live in the
 * submit service itself. */
export default function SubmitRegistrationModal({ show, warnings, busy, onClose, onSubmit }: SubmitRegistrationModalProps) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(undefined);
    setSubmitting(true);
    try {
      await onSubmit();
    } catch (err: any) {
      setError(err?.message || "Couldn't submit this application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={onClose} title="Submit registration" size="sm" testId="submit-registration-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint" style={{ marginTop: 0 }}>
          Once submitted, this application moves into the registration review queue and most fields become read-only
          until a correction is requested.
        </p>
        {warnings.length > 0 && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="warning" />
            <div>
              <strong>Before you submit:</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} disabled={submitting || busy} testId="submit-registration-cancel" />
          <Button type="button" text="Submit application" appearance="primary" loading={submitting || busy} onClick={handleSubmit} testId="submit-registration-confirm" />
        </div>
      </div>
    </Modal>
  );
}
