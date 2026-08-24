import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { cfg } from "@/constants/cfg";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import StatusBadge from "../../components/StatusBadge";
import RetrySynchronizationModal from "../components/modals/RetrySynchronizationModal";
import SynchronizationSuccessModal from "../components/modals/SynchronizationSuccessModal";
import SynchronizationFailureModal from "../components/modals/SynchronizationFailureModal";
import ManualReviewModal from "../components/modals/ManualReviewModal";
import "../../shared.css";

/** Same self-contained session read used across the exceptions/registered-
 * births screens — there is no exported getCurrentActorName() in
 * utils/workspace, so this mirrors its storage key/shape locally. */
function currentActorName(): string {
  try {
    const key = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";
    const raw = sessionStorage.getItem(key);
    if (!raw) return "CRVS Staff";
    const session = JSON.parse(raw);
    const account = session?.account;
    const name = [account?.firstName, account?.lastName].filter(Boolean).join(" ").trim();
    return name || account?.email || session?.email || "CRVS Staff";
  } catch {
    return "CRVS Staff";
  }
}

type ModalState = "retry" | "success" | "failure" | "manual-review" | null;

function SdidStatusInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const actorName = currentActorName();

  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<ModalState>(null);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetRegistration(caseId)
      .then((c) => setRegistrationCase(c))
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
        <Empty
          icon="error"
          title="Couldn't load this case"
          description={error}
          button={<Button text="Try again" appearance="ghost" onClick={load} testId="sdid-status-retry" />}
        />
      </div>
    );
  }

  if (!registrationCase) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Case not found" description="This case does not exist or is no longer accessible." />
      </div>
    );
  }

  const sdid = registrationCase.sdid;
  const canRetryPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.SYNC_RETRY);
  const canManualReviewPermission = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.SYNC_MANUAL_REVIEW);
  const actionable = sdid.status === "FAILED" || sdid.status === "MANUAL_REVIEW";

  const handleUpdated = (updated: BirthRegistrationCase) => setRegistrationCase(updated);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">SDID synchronization status</h1>
        <p className="crvs-page-subtitle">
          {registrationCase.reference} — {registrationCase.child.firstName} {registrationCase.child.lastName}
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <div className="crvs-review-section-header">
          <strong>Status</strong>
          <StatusBadge kind="sync" status={sdid.status} />
        </div>

        <DescriptionList columns={3}>
          <DescriptionItem label="Birth record" value={registrationCase.officialBirthRecordNumber || "Not yet registered"} />
          <DescriptionItem label="Last attempt" value={sdid.lastAttemptAt ? new Date(sdid.lastAttemptAt).toLocaleString() : "—"} />
          <DescriptionItem label="Attempts" value={sdid.attempts.length} />
        </DescriptionList>

        {sdid.status === "IDENTITY_CREATED" && (
          <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16 }}>
            Foundational identity created for this birth record.
          </div>
        )}

        {sdid.status === "IDENTITY_CREATED" ? (
          <DescriptionList columns={3}>
            <DescriptionItem label="Fictional NIN" value={sdid.fictionalNin} />
            <DescriptionItem label="Foundational identity ID" value={sdid.foundationalIdentityId} />
            <DescriptionItem label="Identity status" value="Minor active" />
            <DescriptionItem label="Biometrics" value="Not required for newborn" />
            <DescriptionItem label="Credential" value="Not issued" />
            <DescriptionItem label="Source" value="CRVS birth record" />
          </DescriptionList>
        ) : (
          <p className="crvs-form-hint" style={{ marginTop: 16 }}>
            A national identification number is only shown once synchronization has completed successfully.
          </p>
        )}

        {sdid.lastFailureCode && sdid.status !== "IDENTITY_CREATED" && (
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
          {actionable && canRetryPermission && (
            <Button text="Retry synchronization" appearance="primary" onClick={() => setActiveModal("retry")} testId="open-retry-sync" />
          )}
          {actionable && canManualReviewPermission && sdid.status !== "MANUAL_REVIEW" && (
            <Button text="Assign manual review" appearance="ghost" onClick={() => setActiveModal("manual-review")} testId="open-manual-review" />
          )}
          {!canRetryPermission && !canManualReviewPermission && actionable && (
            <p className="crvs-form-hint">You have view-only access to this synchronization record.</p>
          )}
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
        <Link to={`/dashboard/crvs/registered-births/${registrationCase.id}`} className="crvs-tab">
          Back to registered birth
        </Link>
      </div>

      <RetrySynchronizationModal
        show={activeModal === "retry"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        actorName={actorName}
        onRetried={(outcome, updated) => {
          handleUpdated(updated);
          setActiveModal(outcome === "IDENTITY_CREATED" ? "success" : "failure");
        }}
      />

      <SynchronizationSuccessModal
        show={activeModal === "success"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
      />

      <SynchronizationFailureModal
        show={activeModal === "failure"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        onRetry={canRetryPermission ? () => setActiveModal("retry") : undefined}
        onRequestManualReview={canManualReviewPermission ? () => setActiveModal("manual-review") : undefined}
      />

      <ManualReviewModal
        show={activeModal === "manual-review"}
        onClose={() => setActiveModal(null)}
        registrationCase={registrationCase}
        actorName={actorName}
        onAssigned={handleUpdated}
      />
    </div>
  );
}

export default function SdidStatus() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.REGISTERED_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered births" />
        </div>
      }
    >
      <SdidStatusInner />
    </RequirePermission>
  );
}
