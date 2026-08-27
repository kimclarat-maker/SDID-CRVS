import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RequirePermission from "@/navigation/guards/RequirePermission";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoListDeathRegistrations } from "@/demo/services/crvsDeathRegistrations";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import { deceasedDisplayName } from "../../deathShared";
import "../../shared.css";

/** Death-case counterpart of exceptions/duplicates — cases with an
 * unresolved potential/probable duplicate match. EXACT matches never reach
 * this queue (they block submission outright), and anything already
 * resolved drops out. Mirrors birth's DuplicatesQueue structure exactly. */
function isUnresolvedDuplicate(c: DeathRegistrationCase): boolean {
  const level = c.duplicateCheck?.overallLevel;
  return (level === "POTENTIAL" || level === "PROBABLE") && !c.duplicateCheck?.resolution;
}

function DeathDuplicatesQueue() {
  const [rows, setRows] = useState<DeathRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListDeathRegistrations({ limit: 500 })
      .then((res) => setRows(res.data.filter(isUnresolvedDuplicate)))
      .catch((e) => setError(e?.message || "Something went wrong loading this queue."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    {
      key: "reference",
      header: "Case reference",
      render: (c) => <Link to={`/dashboard/crvs/death-exceptions/${c.id}`}>{c.reference}</Link>,
    },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "level", header: "Match level", render: (c) => c.duplicateCheck?.overallLevel || "—" },
    { key: "candidates", header: "Candidates", render: (c) => c.duplicateCheck?.candidates.length ?? 0 },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "officer", header: "Assigned officer", render: (c) => c.reviewerName || "Unassigned" },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="deathRegistration" status={c.status} /> },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Potential death-case duplicates</h1>
        <p className="crvs-page-subtitle">Death registrations with an unresolved potential or probable duplicate match.</p>
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

export default function DeathDuplicates() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.DEATH_DUPLICATE_RESOLVE}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to this queue" />
        </div>
      }
    >
      <DeathDuplicatesQueue />
    </RequirePermission>
  );
}
