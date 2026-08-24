import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RequirePermission from "@/navigation/guards/RequirePermission";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoListRegistrations } from "@/demo/services/crvsRegistrations";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import "../../shared.css";

function isSyncFailure(c: BirthRegistrationCase): boolean {
  return c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW";
}

function SyncFailuresQueue() {
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ limit: 500 })
      .then((res) => setRows(res.data.filter(isSyncFailure)))
      .catch((e) => setError(e?.message || "Something went wrong loading this queue."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    {
      key: "reference",
      header: "Birth record",
      render: (c) => (
        <Link to={`/dashboard/crvs/registered-births/${c.id}/sdid-status`}>
          {c.officialBirthRecordNumber || c.reference}
        </Link>
      ),
    },
    {
      key: "child",
      header: "Child",
      render: (c) => `${c.child.firstName || ""} ${c.child.lastName}`.trim(),
    },
    {
      key: "failureCode",
      header: "Last failure code",
      render: (c) => c.sdid.lastFailureCode || "—",
    },
    {
      key: "lastMessage",
      header: "Last message",
      render: (c) => c.sdid.attempts[c.sdid.attempts.length - 1]?.failureMessage || "—",
    },
    {
      key: "attempts",
      header: "Attempts",
      render: (c) => c.sdid.attempts.length,
    },
    {
      key: "jurisdiction",
      header: "Jurisdiction",
      render: (c) => c.jurisdiction,
    },
    {
      key: "status",
      header: "Sync status",
      render: (c) => <StatusBadge kind="sync" status={c.sdid.status} />,
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">SDID synchronization failures</h1>
        <p className="crvs-page-subtitle">
          Registered births whose foundational-identity synchronization failed or needs manual review.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No synchronization failures"
          emptyDescription="Every registered birth has synchronized with SDID or is still in progress."
          emptyIcon="sync_problem"
        />
      </div>
    </div>
  );
}

export default function SyncFailures() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={[CRVS_PERMISSIONS.SYNC_RETRY, CRVS_PERMISSIONS.SYNC_MANUAL_REVIEW]}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to this queue" />
        </div>
      }
    >
      <SyncFailuresQueue />
    </RequirePermission>
  );
}
