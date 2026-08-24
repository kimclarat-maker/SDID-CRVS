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

/** Cases with an unresolved potential/probable duplicate match — EXACT
 * matches never reach this queue (they block submission outright, see
 * demoSubmitRegistration), and anything already resolved drops out. */
function isUnresolvedDuplicate(c: BirthRegistrationCase): boolean {
  const level = c.duplicateCheck?.overallLevel;
  return (level === "POTENTIAL" || level === "PROBABLE") && !c.duplicateCheck?.resolution;
}

function DuplicatesQueue() {
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ limit: 500 })
      .then((res) => setRows(res.data.filter(isUnresolvedDuplicate)))
      .catch((e) => setError(e?.message || "Something went wrong loading this queue."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    {
      key: "reference",
      header: "Application reference",
      render: (c) => <Link to={`/dashboard/crvs/exceptions/${c.id}`}>{c.reference}</Link>,
    },
    {
      key: "child",
      header: "Child",
      render: (c) => `${c.child.firstName || ""} ${c.child.lastName}`.trim(),
    },
    {
      key: "level",
      header: "Match level",
      render: (c) => c.duplicateCheck?.overallLevel || "—",
    },
    {
      key: "candidates",
      header: "Candidates",
      render: (c) => c.duplicateCheck?.candidates.length ?? 0,
    },
    {
      key: "jurisdiction",
      header: "Jurisdiction",
      render: (c) => c.jurisdiction,
    },
    {
      key: "officer",
      header: "Assigned officer",
      render: (c) => c.reviewerName || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge kind="registration" status={c.status} />,
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Potential duplicates</h1>
        <p className="crvs-page-subtitle">
          Registrations with an unresolved potential or probable duplicate match.
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
          emptyTitle="No unresolved duplicates"
          emptyDescription="Every potential or probable duplicate match has been resolved."
          emptyIcon="content_copy"
        />
      </div>
    </div>
  );
}

export default function Duplicates() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to this queue" />
        </div>
      }
    >
      <DuplicatesQueue />
    </RequirePermission>
  );
}
