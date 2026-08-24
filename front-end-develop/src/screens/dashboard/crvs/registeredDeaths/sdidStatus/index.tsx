import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentActorName } from "@/utils/workspace";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import StatusBadge from "../../components/StatusBadge";
import RetryDeathSyncModal from "../components/modals/RetryDeathSyncModal";
import DeathSyncSuccessModal from "../components/modals/DeathSyncSuccessModal";
import DeathSyncFailureModal from "../components/modals/DeathSyncFailureModal";
import DeathManualReviewModal from "../components/modals/DeathManualReviewModal";
import { formatDateTime } from "../../deathShared";
import "../../shared.css";

type ModalState = "retry" | "success" | "failure" | "manual-review" | null;

function SdidDeathStatusInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const actorName = getCurrentActorName();

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [activeModal, setActiveModal] = useState<ModalState>(null);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetDeathRegistration(caseId)
      .then((c) => setDeathCase(c))
      .catch((e) => setError(e?.message || "Something went wrong loading this case."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId]);

  if (loading) {
    return (
      <div className="crvs-page">
        <div className="crvs-section" aria-busy="true">
          Loading synchronization status…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crvs-page">
        <Empty icon="error" title="Couldn't load this case" description={error} button={<Button text="Try again" appearance="ghost" onClick={load} testId="death-sdid-status-retry" />} />
      </div>
    );
  }

  if (!deathCase) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Case not found" description="This case does not exist or is no longer accessible." />
      </div>
    );
  }

  const sdid = deathCase.sdid;
  const canRetryPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_SDID_SYNC_RETRY);
  const canViewPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_SDID_SYNC_VIEW);
  const actionable = sdid.status === "FAILED" || sdid.status === "MANUAL_REVIEW";

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">SDID synchronization status</h1>
        <p className="crvs-page-subtitle">{deathCase.reference}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <div className="crvs-review-section-header">
          <strong>Status</strong>
          <StatusBadge kind="deathSync" status={sdid.status} />
        </div>

        <DescriptionList columns={3}>
          <DescriptionItem label="Death record" value={deathCase.officialDeathRecordNumber || "Not yet registered"} />
          <DescriptionItem label="Last attempt" value={sdid.lastAttemptAt ? formatDateTime(sdid.lastAttemptAt) : "—"} />
          <DescriptionItem label="Attempts" value={sdid.attempts.length} />
          <DescriptionItem label="CRVS reference that caused the update" value={sdid.crvsReference} />
        </DescriptionList>

        {sdid.status === "IDENTITY_MARKED_DECEASED" ? (
          <DescriptionList columns={3}>
            <DescriptionItem label="Linked NIN" value={sdid.linkedNin} />
            <DescriptionItem label="Linked foundational identity ID" value={sdid.linkedFoundationalIdentityId} />
            <DescriptionItem label="Identity status" value="Deceased" />
          </DescriptionList>
        ) : (
          <p className="crvs-form-hint" style={{ marginTop: 16 }}>The linked identity is only shown once synchronization has completed successfully.</p>
        )}

        {sdid.lastFailureCode && sdid.status !== "IDENTITY_MARKED_DECEASED" && (
          <p className="crvs-form-hint" style={{ marginTop: 8 }}>
            Last failure code: <strong>{sdid.lastFailureCode}</strong>
          </p>
        )}

        {sdid.manualReview && (
          <div className="crvs-review-section" style={{ marginTop: 16 }}>
            <strong>Manual review</strong>
            <DescriptionList columns={3}>
              <DescriptionItem label="Assigned to" value={sdid.manualReview.assignedTo} />
              <DescriptionItem label="Priority" value={sdid.manualReview.priority} />
              <DescriptionItem label="Reason" value={sdid.manualReview.reason} />
            </DescriptionList>
          </div>
        )}

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          {actionable && canRetryPermission && <Button text="Retry synchronization" appearance="primary" onClick={() => setActiveModal("retry")} testId="open-death-retry-sync" />}
          {actionable && canRetryPermission && sdid.status !== "MANUAL_REVIEW" && <Button text="Assign manual review" appearance="ghost" onClick={() => setActiveModal("manual-review")} testId="open-death-manual-review" />}
          {!canRetryPermission && canViewPermission && actionable && <p className="crvs-form-hint">You have view-only access to this synchronization record.</p>}
        </div>
      </div>

      {sdid.attempts.length > 0 && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Attempt history</h2>
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
              {sdid.attempts.map((a, i) => (
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

      <div className="crvs-wizard-actions">
        <Link to={`/dashboard/crvs/registered-deaths/${deathCase.id}`} className="crvs-tab">
          Back to registered death
        </Link>
      </div>

      <RetryDeathSyncModal
        show={activeModal === "retry"}
        onClose={() => setActiveModal(null)}
        deathCase={deathCase}
        actorName={actorName}
        onRetried={(outcome, updated) => {
          setDeathCase(updated);
          setActiveModal(outcome === "IDENTITY_MARKED_DECEASED" ? "success" : outcome === "MANUAL_REVIEW" ? "manual-review" : "failure");
        }}
      />
      <DeathSyncSuccessModal show={activeModal === "success"} onClose={() => setActiveModal(null)} deathCase={deathCase} />
      <DeathSyncFailureModal
        show={activeModal === "failure"}
        onClose={() => setActiveModal(null)}
        deathCase={deathCase}
        onRetry={canRetryPermission ? () => setActiveModal("retry") : undefined}
        onRequestManualReview={canRetryPermission ? () => setActiveModal("manual-review") : undefined}
      />
      <DeathManualReviewModal show={activeModal === "manual-review"} onClose={() => setActiveModal(null)} deathCase={deathCase} actorName={actorName} onAssigned={setDeathCase} />
    </div>
  );
}

export default function SdidDeathStatus() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered deaths" />
        </div>
      }
    >
      <SdidDeathStatusInner />
    </RequirePermission>
  );
}
