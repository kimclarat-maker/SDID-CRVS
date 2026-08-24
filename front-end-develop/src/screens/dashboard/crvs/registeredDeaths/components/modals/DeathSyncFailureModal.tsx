import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DeathRegistrationCase } from "@/domain/crvs/types";

const FAILURE_EXPLANATIONS: Record<string, string> = {
  SDID_SERVICE_TIMEOUT: "The identity service didn't respond in time.",
  SDID_DATA_CONFLICT: "Submitted details conflict with an existing SDID record.",
  SDID_VALIDATION_ERROR: "The identity service rejected the record as incomplete.",
  SDID_NO_RELIABLE_MATCH: "No SDID identity could be matched with sufficient confidence.",
};

export default function DeathSyncFailureModal({
  show,
  onClose,
  deathCase,
  onRetry,
  onRequestManualReview,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  onRetry?: () => void;
  onRequestManualReview?: () => void;
}) {
  const code = deathCase.sdid.lastFailureCode;
  const explanation = code ? FAILURE_EXPLANATIONS[code] || "The identity service reported an error." : "The identity service reported an error.";

  return (
    <Modal title="Synchronization failed" show={show} handleClose={onClose} size="sm" testId="death-sync-failure-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-danger" style={{ alignItems: "center" }}>
          <Icon name="error" />
          <span>{explanation}</span>
        </div>
        <dl style={{ marginTop: 16 }}>
          <dt className="crvs-form-hint">Failure code</dt>
          <dd style={{ fontWeight: 600, marginBottom: 12 }}>{code || "—"}</dd>
          <dt className="crvs-form-hint">Attempt number</dt>
          <dd style={{ fontWeight: 600 }}>{deathCase.sdid.attempts.length}</dd>
        </dl>
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          The death registration itself is unaffected and stays legally registered — only SDID identity synchronization
          failed.
        </p>
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Close" appearance="ghost" onClick={onClose} testId="death-sync-failure-close" />
          {onRequestManualReview && <Button text="Request manual review" appearance="ghost" onClick={onRequestManualReview} testId="death-sync-failure-manual-review" />}
          {onRetry && <Button text="Retry" appearance="primary" onClick={onRetry} testId="death-sync-failure-retry" />}
        </div>
      </div>
    </Modal>
  );
}
