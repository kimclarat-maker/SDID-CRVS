import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RequirePermission from "@/navigation/guards/RequirePermission";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoListDeathRegistrations } from "@/demo/services/crvsDeathRegistrations";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import { deceasedDisplayName } from "../deathShared";
import "../shared.css";

function isSyncFailure(c: DeathRegistrationCase): boolean {
  return c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW";
}

function DeathSyncFailuresQueue() {
  const [rows, setRows] = useState<DeathRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListDeathRegistrations({ limit: 500 })
      .then((res) => setRows(res.data.filter(isSyncFailure)))
      .catch((e) => setError(e?.message || "Something went wrong loading this queue."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    { key: "reference", header: "Death record", render: (c) => <Link to={`/dashboard/crvs/registered-deaths/${c.id}/sdid-status`}>{c.officialDeathRecordNumber || c.reference}</Link> },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "failureCode", header: "Last failure code", render: (c) => c.sdid.lastFailureCode || "—" },
    { key: "lastMessage", header: "Last message", render: (c) => c.sdid.attempts[c.sdid.attempts.length - 1]?.failureMessage || "—" },
    { key: "attempts", header: "Attempts", render: (c) => c.sdid.attempts.length },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "status", header: "Sync status", render: (c) => <StatusBadge kind="deathSync" status={c.sdid.status} /> },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">SDID synchronization failures</h1>
        <p className="crvs-page-subtitle">Registered deaths whose SDID deceased-status synchronization failed or needs manual review. The death record itself remains valid.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={rows} columns={columns} getRowKey={(c) => c.id} loading={loading} error={error} onRetry={load} emptyTitle="No synchronization failures" emptyDescription="Every registered death has synchronized with SDID or is still in progress." emptyIcon="sync_problem" />
      </div>
    </div>
  );
}

export default function DeathSyncFailures() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={[CRVS_PERMISSIONS.DEATH_SDID_SYNC_RETRY, CRVS_PERMISSIONS.DEATH_SDID_SYNC_VIEW]}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to this queue" />
        </div>
      }
    >
      <DeathSyncFailuresQueue />
    </RequirePermission>
  );
}
