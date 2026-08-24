import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";

// The simulator only ever produces these three codes (see
// src/demo/services/crvsSdidSync.ts FAILURE_CODES) — mapped to plain
// language rather than surfacing the raw code as the primary message.
const FAILURE_EXPLANATIONS: Record<string, string> = {
  SDID_SERVICE_TIMEOUT: "The identity service didn't respond in time.",
  SDID_DATA_CONFLICT: "Submitted details conflict with an existing SDID record.",
  SDID_VALIDATION_ERROR: "The identity service rejected the record as incomplete.",
};

/** Failure notice shown after a retry resolves to FAILED. There is no
 * shared WarningModal primitive in this codebase (see components/crvs/
 * modals/* in the spec) — this is a small, self-contained modal built on
 * the base Modal component instead. */
export default function SynchronizationFailureModal({
  show,
  onClose,
  registrationCase,
  onRetry,
  onRequestManualReview,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  /** Omit to hide the Retry action (e.g. the viewer lacks crvs.sync.retry). */
  onRetry?: () => void;
  /** Omit to hide the Request manual review action (e.g. the viewer lacks crvs.sync.manual_review). */
  onRequestManualReview?: () => void;
}) {
  const code = registrationCase.sdid.lastFailureCode;
  const explanation = code ? FAILURE_EXPLANATIONS[code] || "The identity service reported an error." : "The identity service reported an error.";

  return (
    <Modal title="Synchronization failed" show={show} handleClose={onClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-banner crvs-banner-danger" style={{ alignItems: "center" }}>
          <Icon name="error" />
          <span>{explanation}</span>
        </div>

        <dl style={{ marginTop: 16 }}>
          <dt className="crvs-form-hint">Failure code</dt>
          <dd style={{ fontWeight: 600, marginBottom: 12 }}>{code || "—"}</dd>
          <dt className="crvs-form-hint">Attempt number</dt>
          <dd style={{ fontWeight: 600 }}>{registrationCase.sdid.attempts.length}</dd>
        </dl>

        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          The CRVS registration itself is unaffected — only foundational-identity synchronization failed.
        </p>

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Close" appearance="ghost" onClick={onClose} testId="sync-failure-close" />
          {onRequestManualReview && (
            <Button text="Request manual review" appearance="ghost" onClick={onRequestManualReview} testId="sync-failure-manual-review" />
          )}
          {onRetry && <Button text="Retry" appearance="primary" onClick={onRetry} testId="sync-failure-retry" />}
        </div>
      </div>
    </Modal>
  );
}
