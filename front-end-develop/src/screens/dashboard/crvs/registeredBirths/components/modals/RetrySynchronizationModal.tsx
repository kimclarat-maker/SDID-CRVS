import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { demoRetrySdidSync, SyncOutcome } from "@/demo/services/crvsSdidSync";
import toastMessage from "@/utils/common/toastMessage";

/** Retries a FAILED/MANUAL_REVIEW synchronization. Reuses the same
 * idempotency key server-side (see demoRetrySdidSync), so this is genuinely
 * safe to say out loud: a retry can never create a second foundational
 * identity or a second fictional NIN for the same case. */
export default function RetrySynchronizationModal({
  show,
  onClose,
  registrationCase,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  registrationCase: BirthRegistrationCase;
  actorName: string;
  onRetried: (outcome: SyncOutcome, updated: BirthRegistrationCase) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const lastAttempt = registrationCase.sdid.attempts[registrationCase.sdid.attempts.length - 1];

  const handleRetry = async () => {
    setSubmitting(true);
    try {
      const outcome = await demoRetrySdidSync(registrationCase.id, actorName);
      const updated = await demoGetRegistration(registrationCase.id);
      if (updated) onRetried(outcome, updated);
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal title="Retry SDID synchronization" show={show} handleClose={onClose} size="sm">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint">
          Retrying will not create another foundational identity — the same synchronization request is reused, so this
          case can never end up with two identities or two national identification numbers.
        </p>

        <div className="crvs-review-section" style={{ marginTop: 12 }}>
          <div className="crvs-review-section-header">
            <strong>Birth record</strong>
            <span>{registrationCase.officialBirthRecordNumber || registrationCase.reference}</span>
          </div>
          <p className="crvs-form-hint">
            Previous attempts: {registrationCase.sdid.attempts.length}
            {lastAttempt && (
              <>
                {" "}
                — last attempt {new Date(lastAttempt.at).toLocaleString()}
                {lastAttempt.failureCode ? ` (${lastAttempt.failureCode})` : ""}
              </>
            )}
          </p>
        </div>

        {registrationCase.sdid.attempts.length > 0 && (
          <table className="crvs-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>When</th>
                <th>Outcome</th>
                <th>Failure code</th>
              </tr>
            </thead>
            <tbody>
              {registrationCase.sdid.attempts.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.at).toLocaleString()}</td>
                  <td>{a.outcome}</td>
                  <td>{a.failureCode || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button text="Cancel" appearance="ghost" onClick={onClose} disabled={submitting} testId="retry-sync-cancel" />
          <Button text="Retry" appearance="primary" onClick={handleRetry} loading={submitting} testId="retry-sync-confirm" />
        </div>
      </div>
    </Modal>
  );
}
