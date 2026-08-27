import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import StructuredReasonModal, { ReasonOption } from "@/components/crvs/modals/StructuredReasonModal";
import Icon from "@/components/icon";
import { DivorceRegistration } from "@/domain/crvs/types";
import { DivorceSpouseKey, demoAssignDivorceManualReview, demoRetryAllFailedDivorceSdidSync, demoRetryDivorceSdidSync } from "@/demo/services/crvsDivorceSdidSync";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { demoCheckDivorceCertificateEligibility } from "@/demo/services/crvsDivorceCertificateEligibility";
import { DIVORCE_SPOUSE_SYNC_STATUS_LABELS, DIVORCE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { updateDemoData } from "@/demo/storage/demoStore";
import { logCrvsAudit } from "@/demo/services/crvsAudit";
import { CRVS_SUPERVISOR_DEMO_NAME } from "@/demo/seed/crvsAccounts";
import toastMessage from "@/utils/common/toastMessage";
import { CERTIFICATE_ELIGIBILITY_LABELS, formatDateTime, formerSpouseDisplayName } from "../../../divorceShared";

const spouseLabel = (key: DivorceSpouseKey) => (key === "spouse1" ? "Former spouse 1" : "Former spouse 2");

export function RetryDivorceSyncModal({
  show,
  onClose,
  registration,
  spouseKey,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  spouseKey: DivorceSpouseKey | undefined;
  actorName: string;
  onRetried: (updated: DivorceRegistration) => void;
}) {
  if (!spouseKey) return null;

  const sub = registration.sdid[spouseKey];
  const spouse = spouseKey === "spouse1" ? registration.formerSpouse1 : registration.formerSpouse2;

  const handleConfirm = async () => {
    const outcome = await demoRetryDivorceSdidSync(registration.id, spouseKey, actorName);
    const updated = await demoGetDivorceRegistration(registration.id);
    if (updated) onRetried(updated);
    toastMessage(outcome === "BOTH_IDENTITIES_UPDATED" ? "success" : "info", `Retry complete — case synchronization is now ${DIVORCE_SYNC_STATUS_LABELS[outcome].toLowerCase()}.`);
    onClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Retry synchronization — ${spouseLabel(spouseKey).toLowerCase()}`}
      description={registration.reference}
      confirmLabel="Retry synchronization"
      testId="retry-divorce-sync-modal"
    >
      <p style={{ margin: 0 }}>
        This retries the identity update for <strong>{formerSpouseDisplayName(spouse)}</strong> only. The other former spouse&apos;s synchronization is untouched.
      </p>
      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        Current status: <strong>{DIVORCE_SPOUSE_SYNC_STATUS_LABELS[sub.status]}</strong>
        {sub.lastFailureCode ? ` · last failure code ${sub.lastFailureCode}` : ""}
        {sub.lastAttemptAt ? ` · last attempted ${formatDateTime(sub.lastAttemptAt)}` : ""} · {sub.attempts.length} attempt(s) so far.
      </div>
    </ConfirmActionModal>
  );
}

export function RetryAllDivorceSyncModal({
  show,
  onClose,
  registration,
  actorName,
  onRetried,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onRetried: (updated: DivorceRegistration) => void;
}) {
  const failedKeys = (["spouse1", "spouse2"] as DivorceSpouseKey[]).filter((key) => registration.sdid[key].status === "FAILED");

  const handleConfirm = async () => {
    if (failedKeys.length === 0) throw new Error("There is no failed synchronization to retry on this case.");
    const outcome = await demoRetryAllFailedDivorceSdidSync(registration.id, actorName);
    const updated = await demoGetDivorceRegistration(registration.id);
    if (updated) onRetried(updated);
    toastMessage(outcome === "BOTH_IDENTITIES_UPDATED" ? "success" : "info", `Retried ${failedKeys.length} failed synchronization(s) — now ${DIVORCE_SYNC_STATUS_LABELS[outcome].toLowerCase()}.`);
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
      testId="retry-all-divorce-sync-modal"
    >
      {failedKeys.length === 0 ? (
        <div className="crvs-banner crvs-banner-info">
          <Icon name="task_alt" />
          <span>No former spouse on this case is currently in a failed state, so there is nothing to retry.</span>
        </div>
      ) : (
        <p style={{ margin: 0 }}>
          This retries the identity update for {failedKeys.map((k) => spouseLabel(k).toLowerCase()).join(" and ")}. Each spouse is retried independently — one outcome never affects the other. Cases in
          manual review are left alone.
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

export function DivorceManualReviewModal({
  show,
  onClose,
  registration,
  spouseKey,
  actorName,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  spouseKey: DivorceSpouseKey | undefined;
  actorName: string;
  onAssigned: (updated: DivorceRegistration) => void;
}) {
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [linkedNin, setLinkedNin] = useState("");

  const handleClose = () => {
    setAssignedTo("");
    setPriority("MEDIUM");
    setLinkedNin("");
    onClose();
  };

  return (
    <StructuredReasonModal
      show={show}
      onClose={handleClose}
      title={spouseKey ? `Assign manual identity linking — ${spouseLabel(spouseKey).toLowerCase()}` : "Assign manual identity linking"}
      description={`${registration.reference} — routes the identity link to a person to resolve by hand.`}
      reasonOptions={MANUAL_REVIEW_REASON_OPTIONS}
      noteLabel="What should the reviewer check?"
      noteRequired
      submitLabel="Assign manual review"
      testId="divorce-manual-review-modal"
      onSubmit={async ({ reason, note }) => {
        const updated = demoAssignDivorceManualReview(
          registration.id,
          {
            reason,
            assignedTo: assignedTo.trim() || CRVS_SUPERVISOR_DEMO_NAME,
            priority,
            notes: [note, linkedNin.trim() ? `Suggested NIN to link: ${linkedNin.trim()}` : ""].filter(Boolean).join(" — ") || undefined,
          },
          actorName,
          spouseKey
        );
        toastMessage("success", `Manual identity linking assigned on ${updated.reference}.`);
        onAssigned(updated);
        handleClose();
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="divorce-manual-review-assignee">Assign to</label>
          <input id="divorce-manual-review-assignee" value={assignedTo} placeholder={CRVS_SUPERVISOR_DEMO_NAME} onChange={(e) => setAssignedTo(e.target.value)} data-testid="divorce-manual-review-assignee" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-manual-review-priority">Priority</label>
          <select id="divorce-manual-review-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")} data-testid="divorce-manual-review-priority">
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-manual-review-nin">Suggested identity / NIN to link (optional)</label>
          <input id="divorce-manual-review-nin" value={linkedNin} onChange={(e) => setLinkedNin(e.target.value)} data-testid="divorce-manual-review-nin" />
        </div>
      </div>
      <p className="crvs-form-hint">
        A former spouse whose identity is already updated is never reverted — only outstanding synchronizations are flagged for manual review.
      </p>
    </StructuredReasonModal>
  );
}

export function DivorceCertificateEligibilityModal({
  show,
  onClose,
  registration,
  actorName,
  onChecked,
  onRequestCertificate,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  actorName: string;
  onChecked: (updated: DivorceRegistration) => void;
  onRequestCertificate?: () => void;
}) {
  const eligibility = registration.certificateEligibility;

  const handleConfirm = async () => {
    const updated = demoCheckDivorceCertificateEligibility(registration.id, actorName);
    const status = updated.certificateEligibility?.status || "NOT_CHECKED";
    toastMessage(status === "ELIGIBLE" ? "success" : "info", `Certificate eligibility: ${CERTIFICATE_ELIGIBILITY_LABELS[status].toLowerCase()}.`);
    onChecked(updated);
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Check divorce certificate eligibility"
      description={registration.reference}
      confirmLabel="Run eligibility check"
      cancelLabel="Close"
      testId="divorce-certificate-eligibility-modal"
    >
      <p style={{ margin: 0 }}>
        A divorce becomes eligible for record and certificate services only once it is registered and every open correction, exception and manual-review synchronization is resolved.
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
          <button type="button" className="crvs-tab" onClick={onRequestCertificate} data-testid="divorce-certificate-eligibility-request">
            Request a divorce certificate
          </button>
        </div>
      )}
    </ConfirmActionModal>
  );
}

const REPORT_ERROR_REASON_OPTIONS: ReasonOption[] = [
  { value: "Name spelled incorrectly", label: "Name spelled incorrectly" },
  { value: "Wrong effective date", label: "Wrong effective date" },
  { value: "Wrong court or judgment number", label: "Wrong court or judgment number" },
  { value: "Wrong marriage record linked", label: "Wrong marriage record linked" },
  { value: "Wrong former spouse recorded", label: "Wrong former spouse recorded" },
  { value: "Other", label: "Other" },
];

/**
 * "Report an error" has no ticketing system behind it in this demo and no
 * service call of its own — a registered divorce is immutable, so nothing on
 * the record may change. It records an audit note against the registration
 * instead, which is the entire intended effect. This is the one place a
 * screen writes an audit entry directly; everywhere else the demo service
 * being called does its own logging.
 */
function recordDivorceRecordErrorReport(registration: DivorceRegistration, actorName: string, details: string) {
  updateDemoData((db) => {
    logCrvsAudit(db, actorName, "reported a record error", "crvs.divorce_registration_event", registration.reference, details);
    return db;
  });
}

export function ReportDivorceRecordErrorModal({
  show,
  onClose,
  registration,
  actorName,
  onReported,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
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
      testId="report-divorce-record-error-modal"
      onSubmit={async ({ reason, note }) => {
        recordDivorceRecordErrorReport(registration, actorName, `${reason}: ${note}`);
        toastMessage("success", "Your report has been recorded in the audit trail.");
        onReported();
      }}
    >
      <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="info" />
        <span>
          This records a note in the audit trail so the error is traceable. It does not change the registered record and does not open a ticket — a legal change must go through the CRVS rectification
          workflow.
        </span>
      </div>
    </StructuredReasonModal>
  );
}
