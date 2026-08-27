import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { DivorceSpouseKey } from "@/demo/services/crvsDivorceSdidSync";
import { DIVORCE_SPOUSE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceRegistration, DivorceSdidSyncStatus } from "@/domain/crvs/types";
import { formatDateTime, formerSpousesLabel } from "../divorceShared";
import { DivorceManualReviewModal, RetryAllDivorceSyncModal, RetryDivorceSyncModal } from "../registeredDivorces/components/modals/DivorceSyncModals";
import "../shared.css";

const FAILING_STATUSES: DivorceSdidSyncStatus[] = ["PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"];

type ActionTarget = { registration: DivorceRegistration; spouseKey?: DivorceSpouseKey };

function affectedSpouses(r: DivorceRegistration): string {
  const s1 = r.sdid.spouse1.status === "FAILED" || r.sdid.spouse1.status === "MANUAL_REVIEW";
  const s2 = r.sdid.spouse2.status === "FAILED" || r.sdid.spouse2.status === "MANUAL_REVIEW";
  if (s1 && s2) return "Both";
  if (s1) return "Former spouse one";
  if (s2) return "Former spouse two";
  return "—";
}

/**
 * Divorce SDID sync-failure queue: cases whose case-level sync aggregate is
 * PARTIAL_FAILURE, FAILED or MANUAL_REVIEW. Unlike the marriage equivalent
 * — which delegates every action to the registered-record page — this queue
 * exposes the per-spouse retry, retry-all, and manual identity-linking
 * actions inline, because the spec asks for them here specifically.
 */
export default function DivorceSyncFailures() {
  const navigate = useNavigate();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_VIEW);
  const canRetry = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_RETRY);

  const [rows, setRows] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<DivorceSdidSyncStatus | "">("");

  const [retryTarget, setRetryTarget] = useState<ActionTarget | undefined>();
  const [retryAllTarget, setRetryAllTarget] = useState<DivorceRegistration | undefined>();
  const [manualTarget, setManualTarget] = useState<ActionTarget | undefined>();

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceRegistrations({ limit: 500 });
      setRows(data.filter((r) => FAILING_STATUSES.includes(r.sdid.status)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load divorce synchronization failures.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => (statusFilter ? rows.filter((r) => r.sdid.status === statusFilter) : rows), [rows, statusFilter]);

  const applyUpdated = (updated: DivorceRegistration) => {
    setRows((prev) => {
      if (!FAILING_STATUSES.includes(updated.sdid.status)) return prev.filter((r) => r.id !== updated.id);
      return prev.map((r) => (r.id === updated.id ? updated : r));
    });
  };

  const columns: QueueColumn<DivorceRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "regNumber", header: "Registration number", render: (r) => r.registrationEvent?.registrationNumber || "—" },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "sync", header: "Case sync status", render: (r) => <StatusBadge kind="divorceSync" status={r.sdid.status} /> },
    { key: "affected", header: "Affected spouse(s)", render: affectedSpouses },
    {
      key: "spouse1",
      header: "Former spouse one",
      render: (r) => (
        <span className={`crvs-status-pill crvs-status-${r.sdid.spouse1.status === "IDENTITY_UPDATED" ? "success" : r.sdid.spouse1.status === "FAILED" ? "danger" : "warning"}`}>
          {DIVORCE_SPOUSE_SYNC_STATUS_LABELS[r.sdid.spouse1.status]}
        </span>
      ),
    },
    {
      key: "spouse2",
      header: "Former spouse two",
      render: (r) => (
        <span className={`crvs-status-pill crvs-status-${r.sdid.spouse2.status === "IDENTITY_UPDATED" ? "success" : r.sdid.spouse2.status === "FAILED" ? "danger" : "warning"}`}>
          {DIVORCE_SPOUSE_SYNC_STATUS_LABELS[r.sdid.spouse2.status]}
        </span>
      ),
    },
    { key: "failureCode", header: "Last failure code", render: (r) => r.sdid.spouse1.lastFailureCode || r.sdid.spouse2.lastFailureCode || "—" },
    { key: "lastAttempt", header: "Last attempt", render: (r) => formatDateTime(r.sdid.spouse1.lastAttemptAt || r.sdid.spouse2.lastAttemptAt) },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const spouse1Actionable = r.sdid.spouse1.status === "FAILED" || r.sdid.spouse1.status === "MANUAL_REVIEW";
        const spouse2Actionable = r.sdid.spouse2.status === "FAILED" || r.sdid.spouse2.status === "MANUAL_REVIEW";
        const hasFailed = r.sdid.spouse1.status === "FAILED" || r.sdid.spouse2.status === "FAILED";
        const needsManualLinking = r.sdid.status === "MANUAL_REVIEW";
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {spouse1Actionable && (
              <Button
                text="Retry spouse one"
                size="sm"
                appearance="primary"
                type="button"
                disabled={!canRetry}
                onClick={() => setRetryTarget({ registration: r, spouseKey: "spouse1" })}
                testId={`dsf-retry-spouse1-${r.id}`}
              />
            )}
            {spouse2Actionable && (
              <Button
                text="Retry spouse two"
                size="sm"
                appearance="primary"
                type="button"
                disabled={!canRetry}
                onClick={() => setRetryTarget({ registration: r, spouseKey: "spouse2" })}
                testId={`dsf-retry-spouse2-${r.id}`}
              />
            )}
            {hasFailed && (
              <Button text="Retry all failed" size="sm" appearance="ghost" type="button" disabled={!canRetry} onClick={() => setRetryAllTarget(r)} testId={`dsf-retry-all-${r.id}`} />
            )}
            {needsManualLinking && (
              <Button
                text="Link identity manually"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canRetry}
                onClick={() => setManualTarget({ registration: r, spouseKey: r.sdid.spouse1.status === "MANUAL_REVIEW" ? "spouse1" : "spouse2" })}
                testId={`dsf-manual-link-${r.id}`}
              />
            )}
            <Button text="Open record" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/registered-divorces/${r.id}`)} testId={`dsf-open-${r.id}`} />
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to divorce synchronization failures"
          description="Viewing divorce SDID synchronization requires divorce-sdid-sync-view access."
          isFullScreen
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce synchronization failures</h1>
        <p className="crvs-page-subtitle">Registered divorces whose SDID marital-status update needs attention for one or both former spouses.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="dsf-status">Synchronization status</label>
          <select id="dsf-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DivorceSdidSyncStatus | "")} data-testid="dsf-status-filter">
            <option value="">All failing states</option>
            <option value="PARTIAL_FAILURE">Partial synchronization failure</option>
            <option value="FAILED">Failed</option>
            <option value="MANUAL_REVIEW">Manual review</option>
          </select>
        </div>
        {!canRetry && <span className="crvs-form-hint">You have view-only access — retrying or linking an identity requires divorce-sdid-sync-retry access.</span>}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={filtered}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No synchronization failures"
          emptyDescription="Every registered divorce's SDID synchronization is either pending, in progress, or complete for both former spouses."
          emptyIcon="task_alt"
        />
      </div>

      {retryTarget && (
        <RetryDivorceSyncModal
          show={!!retryTarget}
          onClose={() => setRetryTarget(undefined)}
          registration={retryTarget.registration}
          spouseKey={retryTarget.spouseKey}
          actorName={actorName}
          onRetried={(updated) => {
            setRetryTarget(undefined);
            applyUpdated(updated);
          }}
        />
      )}
      {retryAllTarget && (
        <RetryAllDivorceSyncModal
          show={!!retryAllTarget}
          onClose={() => setRetryAllTarget(undefined)}
          registration={retryAllTarget}
          actorName={actorName}
          onRetried={(updated) => {
            setRetryAllTarget(undefined);
            applyUpdated(updated);
          }}
        />
      )}
      {manualTarget && (
        <DivorceManualReviewModal
          show={!!manualTarget}
          onClose={() => setManualTarget(undefined)}
          registration={manualTarget.registration}
          spouseKey={manualTarget.spouseKey}
          actorName={actorName}
          onAssigned={(updated) => {
            setManualTarget(undefined);
            applyUpdated(updated);
          }}
        />
      )}
    </div>
  );
}
