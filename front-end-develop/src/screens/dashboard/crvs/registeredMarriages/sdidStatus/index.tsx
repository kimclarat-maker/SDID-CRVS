import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { MarriageApplication, MarriageSpouseSdidSyncStatus } from "@/domain/crvs/types";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { MarriageSpouseKey } from "@/demo/services/crvsMarriageSdidSync";
import { MARRIAGE_SPOUSE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import StatusBadge from "../../components/StatusBadge";
import RetryMarriageSyncModal from "../components/modals/RetryMarriageSyncModal";
import MarriageManualReviewModal from "../components/modals/MarriageManualReviewModal";
import { applicantDisplayName, formatDateTime } from "../../marriageShared";
import "../../shared.css";

const SPOUSE_TONE: Record<MarriageSpouseSdidSyncStatus, string> = {
  NOT_READY: "neutral",
  PENDING: "info",
  IN_PROGRESS: "info",
  IDENTITY_UPDATED: "success",
  FAILED: "danger",
  MANUAL_REVIEW: "warning",
};

function SpouseSyncPanel({
  spouseKey,
  application,
  canRetry,
  onRetry,
  onAssignReview,
}: {
  spouseKey: MarriageSpouseKey;
  application: MarriageApplication;
  canRetry: boolean;
  onRetry: () => void;
  onAssignReview: () => void;
}) {
  const sub = application.sdid[spouseKey];
  const applicant = application[spouseKey];
  const actionable = sub.status === "FAILED" || sub.status === "MANUAL_REVIEW";

  return (
    <div className="crvs-section">
      <div className="crvs-review-section-header">
        <strong>{spouseKey === "applicant1" ? "Applicant 1" : "Applicant 2"}</strong>
        <span className={`crvs-status-pill crvs-status-${SPOUSE_TONE[sub.status]}`}>{MARRIAGE_SPOUSE_SYNC_STATUS_LABELS[sub.status]}</span>
      </div>
      <p className="crvs-form-hint">{applicantDisplayName(applicant)}</p>

      <DescriptionList columns={2}>
        <DescriptionItem label="Last attempt" value={sub.lastAttemptAt ? formatDateTime(sub.lastAttemptAt) : "—"} />
        <DescriptionItem label="Attempts" value={sub.attempts.length} />
      </DescriptionList>

      {sub.status === "IDENTITY_UPDATED" ? (
        <DescriptionList columns={2}>
          <DescriptionItem label="Linked NIN" value={sub.linkedNin} />
          <DescriptionItem label="Linked foundational identity ID" value={sub.linkedFoundationalIdentityId} />
        </DescriptionList>
      ) : (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>This spouse's identity is only shown as married once synchronization completes successfully.</p>
      )}

      {sub.lastFailureCode && sub.status !== "IDENTITY_UPDATED" && (
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          Last failure code: <strong>{sub.lastFailureCode}</strong>
        </p>
      )}

      {sub.manualReview && (
        <div className="crvs-review-section" style={{ marginTop: 12 }}>
          <strong>Manual review</strong>
          <DescriptionList columns={3}>
            <DescriptionItem label="Assigned to" value={sub.manualReview.assignedTo} />
            <DescriptionItem label="Priority" value={sub.manualReview.priority} />
            <DescriptionItem label="Reason" value={sub.manualReview.reason} />
          </DescriptionList>
        </div>
      )}

      <div className="crvs-wizard-actions" style={{ marginTop: 16 }}>
        {actionable && canRetry && <Button text="Retry synchronization" appearance="primary" onClick={onRetry} testId={`sdid-marriage-retry-${spouseKey}`} />}
        {actionable && canRetry && sub.status !== "MANUAL_REVIEW" && <Button text="Assign manual review" appearance="ghost" onClick={onAssignReview} testId={`sdid-marriage-manual-review-${spouseKey}`} />}
        {!canRetry && actionable && <p className="crvs-form-hint">You have view-only access to this synchronization record.</p>}
      </div>

      {sub.attempts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="crvs-section-title">Attempt history</h3>
          <table className="crvs-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Outcome</th>
                <th>Failure code</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {sub.attempts.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.at).toLocaleString()}</td>
                  <td>{a.outcome}</td>
                  <td>{a.failureCode || "—"}</td>
                  <td>{a.failureMessage || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SdidMarriageStatusInner() {
  const { id } = useParams<{ id: string }>();
  const actorName = getCurrentActorName();

  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [retryTarget, setRetryTarget] = useState<MarriageSpouseKey | undefined>();
  const [manualReviewTarget, setManualReviewTarget] = useState<MarriageSpouseKey | undefined>();

  const canRetryPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_RETRY);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(undefined);
    demoGetMarriageApplication(id)
      .then((found) => setApplication(found))
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong loading this record."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) {
    return (
      <div className="crvs-page">
        <div className="crvs-section" aria-busy="true">Loading synchronization status…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Couldn't load this record" description={error} button={<Button text="Try again" appearance="ghost" onClick={load} testId="sdid-marriage-retry-load" />} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Record not found" description="This marriage record does not exist or is no longer accessible." />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">SDID synchronization status</h1>
        <p className="crvs-page-subtitle">{application.reference}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <div className="crvs-review-section-header">
          <strong>Overall status</strong>
          <StatusBadge kind="marriageSync" status={application.sdid.status} />
        </div>
        <p className="crvs-form-hint">Each spouse's identity is synchronized independently — one spouse's outcome never affects the other's.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <SpouseSyncPanel spouseKey="applicant1" application={application} canRetry={canRetryPermission} onRetry={() => setRetryTarget("applicant1")} onAssignReview={() => setManualReviewTarget("applicant1")} />
        <SpouseSyncPanel spouseKey="applicant2" application={application} canRetry={canRetryPermission} onRetry={() => setRetryTarget("applicant2")} onAssignReview={() => setManualReviewTarget("applicant2")} />
      </div>

      <div className="crvs-wizard-actions">
        <Link to={`/dashboard/crvs/registered-marriages/${application.id}`} className="crvs-tab">
          Back to registered marriage
        </Link>
      </div>

      <RetryMarriageSyncModal
        show={!!retryTarget}
        onClose={() => setRetryTarget(undefined)}
        application={application}
        spouseKey={retryTarget}
        actorName={actorName}
        onRetried={(_outcome, updated) => setApplication(updated)}
      />
      <MarriageManualReviewModal
        show={!!manualReviewTarget}
        onClose={() => setManualReviewTarget(undefined)}
        application={application}
        spouseKey={manualReviewTarget}
        actorName={actorName}
        onAssigned={setApplication}
      />
    </div>
  );
}

export default function SdidMarriageStatus() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered marriages" />
        </div>
      }
    >
      <SdidMarriageStatusInner />
    </RequirePermission>
  );
}
