import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoRetryMarriageSdidSync, MarriageSpouseKey, MarriageSyncOutcome } from "@/demo/services/crvsMarriageSdidSync";
import toastMessage from "@/utils/common/toastMessage";

const SPOUSE_LABEL: Record<MarriageSpouseKey, string> = { applicant1: "applicant 1", applicant2: "applicant 2" };

/** Retries ONLY the named spouse's own sync sub-record — never a "retry
 * both" button, since re-running an already-succeeded spouse would be
 * wrong (spec §8: "do not repeat the successful update unnecessarily"). */
export default function RetryMarriageSyncModal({
  show,
  onClose,
  application,
  spouseKey,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  application: MarriageApplication;
  spouseKey: MarriageSpouseKey | undefined;
  actorName: string;
  onRetried: (outcome: MarriageSyncOutcome, updated: MarriageApplication) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  if (!spouseKey) return null;
  const sub = application.sdid[spouseKey];
  const lastAttempt = sub.attempts[sub.attempts.length - 1];

  const handleRetry = async () => {
    setSubmitting(true);
    try {
      const outcome = await demoRetryMarriageSdidSync(application.id, spouseKey, actorName);
      const updated = await demoGetMarriageApplication(application.id);
      if (updated) onRetried(outcome, updated);
      const newStatus = updated?.sdid[spouseKey].status;
      if (newStatus === "IDENTITY_UPDATED") toastMessage("success", `Synchronization for ${SPOUSE_LABEL[spouseKey]} succeeded.`);
      else toastMessage("error", `Synchronization for ${SPOUSE_LABEL[spouseKey]} did not succeed — see the failure detail below.`);
    } catch (e) {
      toastMessage("error", e);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal title="Retry SDID synchronization" show={show} handleClose={onClose} size="sm" testId="retry-marriage-sync-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <p className="crvs-form-hint">
          Retrying only re-attempts {SPOUSE_LABEL[spouseKey]}'s own marital-status update — the other spouse's
          synchronization result is never affected by this action.
        </p>
        <div className="crvs-review-section" style={{ marginTop: 12 }}>
          <div className="crvs-review-section-header">
            <strong>Marriage reference</strong>
            <span>{application.reference}</span>
          </div>
          <p className="crvs-form-hint">
            Previous attempts: {sub.attempts.length}
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
          <Button text="Cancel" appearance="ghost" onClick={onClose} disabled={submitting} testId="retry-marriage-sync-cancel" />
          <Button text="Retry" appearance="primary" onClick={handleRetry} loading={submitting} testId="retry-marriage-sync-confirm" />
        </div>
      </div>
    </Modal>
  );
}
