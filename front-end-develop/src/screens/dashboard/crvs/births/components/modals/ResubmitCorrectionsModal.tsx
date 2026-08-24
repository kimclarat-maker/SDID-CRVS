import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { CorrectionItem } from "@/domain/crvs/types";

export type ResubmitCorrectionsModalProps = {
  show: boolean;
  items: CorrectionItem[];
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/** Confirms resubmission after a correction cycle — lists which items were
 * addressed vs. still incomplete before calling demoResubmitCorrections. */
export default function ResubmitCorrectionsModal({ show, items, busy, onClose, onConfirm }: ResubmitCorrectionsModalProps) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const addressed = items.filter((i) => i.addressed);
  const incomplete = items.filter((i) => !i.addressed);

  const handleConfirm = async () => {
    setError(undefined);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.message || "Couldn't resubmit this application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={onClose} title="Resubmit corrected application" size="sm" testId="resubmit-corrections-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-group">
          <label>Addressed ({addressed.length})</label>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {addressed.map((i) => (
              <li key={i.id}>{i.fields.join(", ") || i.section}</li>
            ))}
            {addressed.length === 0 && <li className="crvs-form-hint">None marked addressed yet.</li>}
          </ul>
        </div>
        {incomplete.length > 0 && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
            <Icon name="warning" />
            <div>
              <strong>Still incomplete:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {incomplete.map((i) => (
                  <li key={i.id}>{i.fields.join(", ") || i.section} — {i.reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          Resubmitting marks every open correction item as addressed and returns the case to review.
        </p>
        {error && <p className="crvs-form-error">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={onClose} disabled={submitting || busy} testId="resubmit-corrections-cancel" />
          <Button type="button" text="Resubmit" appearance="primary" loading={submitting || busy} onClick={handleConfirm} testId="resubmit-corrections-confirm" />
        </div>
      </div>
    </Modal>
  );
}
