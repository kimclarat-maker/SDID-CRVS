import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { demoRetryDeathSdidSync, DeathSyncOutcome } from "@/demo/services/crvsDeathSdidSync";
import toastMessage from "@/utils/common/toastMessage";

/** Retries a FAILED/MANUAL_REVIEW death sync. Reuses the same idempotency
 * key server-side, so a retry can never mark two identities deceased for
 * the same case (spec §7 "allow an authorized supervisor to retry"). */
export default function RetryDeathSyncModal({
  show,
  onClose,
  deathCase,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  deathCase: DeathRegistrationCase;
  actorName: string;
  onRetried: (outcome: DeathSyncOutcome, updated: DeathRegistrationCase) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const lastAttempt = deathCase.sdid.attempts[deathCase.sdid.attempts.length - 1];

  const handleRetry = async () => {
    setSubmitting(true);
    try {
      const outcome = await demoRetryDeathSdidSync(deathCase.id, actorName);
      const updated = await demoGetDeathRegistration(deathCase.id);
      if (updated) onRetried(outcome, updated);
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal title="Retry SDID synchronization" show={show} handleClose={onClose} size="sm" testId="retry-death-sync-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint">
          Retrying will not mark a second identity deceased — the same synchronization request is reused, so this case
          can never end up double-applied.
        </p>
        <div className="crvs-review-section" style={{ marginTop: 12 }}>
          <div className="crvs-review-section-header">
            <strong>Death record</strong>
            <span>{deathCase.officialDeathRecordNumber || deathCase.reference}</span>
          </div>
          <p className="crvs-form-hint">
            Previous attempts: {deathCase.sdid.attempts.length}
            {lastAttempt && (
              <>
                {" "}
                — last attempt {new Date(lastAttempt.at).toLocaleString()}
                {lastAttempt.failureCode ? ` (${lastAttempt.failureCode})` : ""}
              </>
            )}
          </p>
        </div>
        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={onClose} disabled={submitting} testId="retry-death-sync-cancel" />
          <Button text="Retry" appearance="primary" onClick={handleRetry} loading={submitting} testId="retry-death-sync-confirm" />
        </div>
      </div>
    </Modal>
  );
}
