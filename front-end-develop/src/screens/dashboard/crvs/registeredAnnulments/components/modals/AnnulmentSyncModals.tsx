import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { AffectedPartyKey, AnnulmentRegistration } from "@/domain/crvs/types";
import { demoAssignAnnulmentManualReview, demoRetryAllFailedAnnulmentSdidSync, demoRetryAnnulmentSdidSync } from "@/demo/services/crvsAnnulmentSdidSync";
import { demoCheckAnnulmentCertificateEligibility, demoCheckAnnulmentRecordEligibility } from "@/demo/services/crvsAnnulmentCertificateEligibility";
import { updateDemoData } from "@/demo/storage/demoStore";
import { logCrvsAudit } from "@/demo/services/crvsAudit";
import { ANNULMENT_PARTY_SYNC_STATUS_LABELS, ANNULMENT_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { CRVS_SUPERVISOR_DEMO_NAME } from "@/demo/seed/crvsAccounts";
import toastMessage from "@/utils/common/toastMessage";
import { affectedPartyDisplayName, CERTIFICATE_ELIGIBILITY_LABELS, formatDateTime, RECORD_ELIGIBILITY_LABELS } from "../../../annulmentShared";

const partyLabel = (key: AffectedPartyKey) => (key === "PARTY_1" ? "First affected party" : "Second affected party");
const partyObjKey = (key: AffectedPartyKey) => (key === "PARTY_1" ? "party1" : "party2") as const;

export function RetryAnnulmentSyncModal({
  show,
  onClose,
  registration,
  party,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  party: AffectedPartyKey | undefined;
  actorName: string;
  onRetried: (updated: AnnulmentRegistration) => void;
}) {
  if (!party) return null;

  const sub = registration.sdid[partyObjKey(party)];
  const affectedParty = party === "PARTY_1" ? registration.affectedParty1 : registration.affectedParty2;

  const handleConfirm = async () => {
    const updated = await demoRetryAnnulmentSdidSync(registration.id, party, actorName);
    toastMessage(updated.sdid.status === "BOTH_IDENTITIES_UPDATED" ? "success" : "info", `Retry complete — case synchronization is now ${ANNULMENT_SYNC_STATUS_LABELS[updated.sdid.status].toLowerCase()}.`);
    onRetried(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Retry synchronization — ${partyLabel(party).toLowerCase()}`}
      description={registration.reference}
      confirmLabel="Retry synchronization"
      testId="retry-annulment-sync-modal"
    >
      <p style={{ margin: 0 }}>
        This retries the identity update for <strong>{affectedPartyDisplayName(affectedParty)}</strong> only. The other affected party&apos;s synchronization is untouched.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Current status: <strong>{ANNULMENT_PARTY_SYNC_STATUS_LABELS[sub.status]}</strong>
        {sub.lastFailureCode ? ` · last failure code ${sub.lastFailureCode}` : ""}
        {sub.lastAttemptAt ? ` · last attempted ${formatDateTime(sub.lastAttemptAt)}` : ""} · {sub.attempts.length} attempt(s) so far.
      </div>
    </ConfirmActionModal>
  );
}

export function RetryAllAnnulmentSyncModal({
  show,
  onClose,
  registration,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onRetried: (updated: AnnulmentRegistration) => void;
}) {
  const failedKeys = (["PARTY_1", "PARTY_2"] as AffectedPartyKey[]).filter((key) => registration.sdid[partyObjKey(key)].status === "FAILED");

  const handleConfirm = async () => {
    if (failedKeys.length === 0) throw new Error("There is no failed synchronization to retry on this case.");
    const updated = await demoRetryAllFailedAnnulmentSdidSync(registration.id, actorName);
    toastMessage(
      updated.sdid.status === "BOTH_IDENTITIES_UPDATED" ? "success" : "info",
      `Retried ${failedKeys.length} failed synchronization(s) — now ${ANNULMENT_SYNC_STATUS_LABELS[updated.sdid.status].toLowerCase()}.`
    );
    onRetried(updated);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Retry all failed synchronizations"
      description={registration.reference}
      confirmLabel="Retry all failed"
      disabled={failedKeys.length === 0}
      testId="retry-all-annulment-sync-modal"
    >
      {failedKeys.length === 0 ? (
        <div className="crvs-banner crvs-banner-info">
          <Icon name="task_alt" />
          <span>No affected party on this case is currently in a failed state, so there is nothing to retry.</span>
        </div>
      ) : (
        <p style={{ margin: 0 }}>
          This retries the identity update for {failedKeys.map((k) => partyLabel(k).toLowerCase()).join(" and ")}. Each affected party is retried independently — one outcome never affects the other.
          Cases in manual review are left alone.
        </p>
      )}
    </ConfirmActionModal>
  );
}

const MANUAL_REVIEW_REASON_OPTIONS: ReasonOption[] = [
  { value: "Identity could not be matched automatically", label: "Identity could not be matched automatically" },
  { value: "Multiple candidate identities found", label: "Multiple candidate identities found" },
  { value: "Marriage relationship missing on the identity record", label: "Marriage relationship missing on the identity record" },
  { value: "Repeated synchronization failure", label: "Repeated synchronization failure" },
  { value: "Other", label: "Other" },
];

/**
 * Assigns manual identity-linking review. Unlike divorce, annulment's
 * demoAssignAnnulmentManualReview() operates on the whole case rather than a
 * single affected party (crvsAnnulmentSdidSync.ts) — it routes every
 * affected-party sub-record that hasn't already succeeded into manual
 * review, never re-flagging one that's already IDENTITY_UPDATED. There is
 * therefore no per-party target to pick here.
 */
export function AnnulmentManualReviewModal({
  show,
  onClose,
  registration,
  actorName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onAssigned: (updated: AnnulmentRegistration) => void;
}) {
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const handleClose = () => {
    setAssignedTo("");
    setPriority("MEDIUM");
    onClose();
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={handleClose}
      title="Assign manual identity linking"
      description={`${registration.reference} — routes every outstanding affected-party identity link to a person to resolve by hand. An affected party already synchronized is left untouched.`}
      reasonOptions={MANUAL_REVIEW_REASON_OPTIONS}
      noteLabel="What should the reviewer check?"
      noteRequired
      submitLabel="Assign manual review"
      testId="annulment-manual-review-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = await demoAssignAnnulmentManualReview(registration.id, `${reason} — ${note}`, assignedTo.trim() || CRVS_SUPERVISOR_DEMO_NAME, priority, actorName);
        toastMessage("success", `Manual identity linking assigned on ${updated.reference}.`);
        onAssigned(updated);
        handleClose();
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="annulment-manual-review-assignee">Assign to</label>
          <input id="annulment-manual-review-assignee" value={assignedTo} placeholder={CRVS_SUPERVISOR_DEMO_NAME} onChange={(e) => setAssignedTo(e.target.value)} data-testid="annulment-manual-review-assignee" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-manual-review-priority">Priority</label>
          <select id="annulment-manual-review-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")} data-testid="annulment-manual-review-priority">
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>
      <p className="crvs-form-hint">An affected party whose identity is already updated is never reverted — only outstanding synchronizations are flagged for manual review.</p>
    </StructuredReasonModal>
  );
}

export function AnnulmentRecordEligibilityModal({
  show,
  onClose,
  registration,
  actorName,
  onChecked,
  onRequestRecord,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onChecked: (updated: AnnulmentRegistration) => void;
  onRequestRecord?: () => void;
}) {
  const eligibility = registration.recordEligibility;

  const handleConfirm = async () => {
    const updated = demoCheckAnnulmentRecordEligibility(registration.id, actorName);
    const status = updated.recordEligibility?.status || "NOT_CHECKED";
    toastMessage(status === "ELIGIBLE" ? "success" : "info", `Record eligibility: ${RECORD_ELIGIBILITY_LABELS[status].toLowerCase()}.`);
    onChecked(updated);
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Check annulment record eligibility"
      description={registration.reference}
      confirmLabel="Run eligibility check"
      cancelLabel="Close"
      testId="annulment-record-eligibility-modal"
    >
      <p style={{ margin: 0 }}>An annulment record becomes eligible only once the case is registered and every open correction, exception and sync manual-review is resolved.</p>
      <div className={`crvs-banner ${eligibility?.status === "ELIGIBLE" ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ marginTop: 12 }}>
        Current result: <strong>{RECORD_ELIGIBILITY_LABELS[eligibility?.status || "NOT_CHECKED"]}</strong>
        {eligibility?.checkedAt ? ` · checked ${formatDateTime(eligibility.checkedAt)}` : ""}
        {eligibility && eligibility.reasons.length > 0 && (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {eligibility.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
      {eligibility?.status === "ELIGIBLE" && onRequestRecord && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="crvs-tab" onClick={onRequestRecord} data-testid="annulment-record-eligibility-request">
            Request an annulment record
          </button>
        </div>
      )}
    </ConfirmActionModal>
  );
}

export function AnnulmentCertificateEligibilityModal({
  show,
  onClose,
  registration,
  actorName,
  onChecked,
  onRequestCertificate,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onChecked: (updated: AnnulmentRegistration) => void;
  onRequestCertificate?: () => void;
}) {
  const eligibility = registration.certificateEligibility;

  const handleConfirm = async () => {
    const updated = demoCheckAnnulmentCertificateEligibility(registration.id, actorName);
    const status = updated.certificateEligibility?.status || "NOT_CHECKED";
    toastMessage(status === "ELIGIBLE" ? "success" : "info", `Certificate eligibility: ${CERTIFICATE_ELIGIBILITY_LABELS[status].toLowerCase()}.`);
    onChecked(updated);
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Check annulment certificate eligibility"
      description={registration.reference}
      confirmLabel="Run eligibility check"
      cancelLabel="Close"
      testId="annulment-certificate-eligibility-modal"
    >
      <p style={{ margin: 0 }}>
        An annulment becomes eligible for certificate services only once it is registered and every open correction, exception and manual-review synchronization is resolved — and only where this
        jurisdiction issues annulment certificates at all.
      </p>
      <div className={`crvs-banner ${eligibility?.status === "ELIGIBLE" ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ marginTop: 12 }}>
        Current result: <strong>{CERTIFICATE_ELIGIBILITY_LABELS[eligibility?.status || "NOT_CHECKED"]}</strong>
        {eligibility?.checkedAt ? ` · checked ${formatDateTime(eligibility.checkedAt)}` : ""}
        {eligibility && eligibility.reasons.length > 0 && (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {eligibility.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
      {eligibility?.status === "ELIGIBLE" && onRequestCertificate && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="crvs-tab" onClick={onRequestCertificate} data-testid="annulment-certificate-eligibility-request">
            Request an annulment certificate
          </button>
        </div>
      )}
    </ConfirmActionModal>
  );
}

const REPORT_ERROR_REASON_OPTIONS: ReasonOption[] = [
  { value: "Name spelled incorrectly", label: "Name spelled incorrectly" },
  { value: "Wrong effective date", label: "Wrong effective date" },
  { value: "Wrong court or decision number", label: "Wrong court or decision number" },
  { value: "Wrong marriage record linked", label: "Wrong marriage record linked" },
  { value: "Wrong affected party recorded", label: "Wrong affected party recorded" },
  { value: "Other", label: "Other" },
];

/**
 * "Report an error" has no ticketing system behind it in this demo and no
 * service call of its own — a registered annulment is immutable, so nothing
 * on the record may change. It records an audit note against the
 * registration instead, which is the entire intended effect. Mirrors
 * ReportDivorceRecordErrorModal exactly.
 */
function recordAnnulmentRecordErrorReport(registration: AnnulmentRegistration, actorName: string, details: string) {
  updateDemoData((db) => {
    logCrvsAudit(db, actorName, "reported a record error", "crvs.annulment_registration_event", registration.reference, details);
    return db;
  });
}

export function ReportAnnulmentRecordErrorModal({
  show,
  onClose,
  registration,
  actorName,
  onReported,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  actorName: string;
  onReported: () => void;
}) {
  return (
    <StructuredReasonModal
      show={show}
      onClose={onClose}
      title="Report an error on this record"
      description={`${registration.registrationEvent?.registrationNumber || registration.reference} — the registered record is read-only and is never changed by this report.`}
      reasonOptions={REPORT_ERROR_REASON_OPTIONS}
      noteLabel="What is wrong, and what should it say?"
      noteRequired
      submitLabel="Record this report"
      testId="report-annulment-record-error-modal"
      onSubmit={async ({ reason, note }) => {
        recordAnnulmentRecordErrorReport(registration, actorName, `${reason}: ${note}`);
        toastMessage("success", "Your report has been recorded in the audit trail.");
        onReported();
      }}
    >
      <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="info" />
        <span>
          This records a note in the audit trail so the error is traceable. It does not change the registered record and does not open a ticket — a legal change must go through the general CRVS
          rectification workflow.
        </span>
      </div>
    </StructuredReasonModal>
  );
}
