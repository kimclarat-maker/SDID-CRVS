import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListDeathNotifications } from "@/demo/services/crvsDeathNotifications";
import { DeathNotification, DeathNotificationStatus } from "@/domain/crvs/types";
import { deceasedDisplayName, formatDateTime } from "../deathShared";
import "../shared.css";

type Counts = Record<"DRAFT" | "SUBMITTED" | "RETURNED" | "ACCEPTED", number>;

/** Death-notification workspace landing (spec §6 routes:
 * /dashboard/crvs/death-notifications[,/new,/:id,/:id/edit]) — status counts
 * plus a filterable queue, mirroring notifications/index.tsx's shape for the
 * birth module. */
export default function DeathNotificationsDashboard() {
  const navigate = useNavigate();

  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE);
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW);

  const [counts, setCounts] = useState<Counts>({ DRAFT: 0, SUBMITTED: 0, RETURNED: 0, ACCEPTED: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  const [rows, setRows] = useState<DeathNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<DeathNotificationStatus | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canView) {
      setCountsLoading(false);
      return;
    }
    setCountsLoading(true);
    Promise.all(
      (["DRAFT", "SUBMITTED", "RETURNED", "ACCEPTED"] as const).map((status) =>
        demoListDeathNotifications({ status, limit: 1 }).then((res) => [status, res.total] as const)
      )
    )
      .then((entries) => setCounts(Object.fromEntries(entries) as Counts))
      .finally(() => setCountsLoading(false));
  }, [canView]);

  const load = () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoListDeathNotifications({ status: statusFilter || undefined, search: search || undefined, limit: 25 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load death notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [canView, statusFilter, search]);

  const columns: QueueColumn<DeathNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "deceased", header: "Deceased", render: (r) => deceasedDisplayName(r.deceased) },
    { key: "dateOfDeath", header: "Date of death", render: (r) => r.occurrence.dateOfDeath?.slice(0, 10) || "—" },
    { key: "facility", header: "Facility / location", render: (r) => r.facilityName || r.occurrence.location || "—" },
    { key: "source", header: "Pathway", render: (r) => r.pathway.replace(/_/g, " ") },
    { key: "notifier", header: "Submitted by", render: (r) => r.notifierName },
    { key: "updated", header: "Last updated", render: (r) => formatDateTime(r.updatedAt) },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="deathNotification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-notifications/${r.id}`)} testId={`death-notification-view-${r.id}`} />
          {(r.status === "DRAFT" || r.status === "RETURNED") && (
            <Button text="Edit" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-notifications/${r.id}/edit`)} testId={`death-notification-edit-${r.id}`} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death notifications</h1>
        <p className="crvs-page-subtitle">Health-facility and community death notifications awaiting acceptance or in progress.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Drafts" count={counts.DRAFT} loading={countsLoading} icon="edit_note" color="var(--status-neutral)" onClick={() => setStatusFilter("DRAFT")} />
        <CardCount name="Submitted" count={counts.SUBMITTED} loading={countsLoading} icon="outgoing_mail" color="var(--status-info)" onClick={() => setStatusFilter("SUBMITTED")} />
        <CardCount name="Returned" count={counts.RETURNED} loading={countsLoading} icon="undo" color="var(--status-warning)" onClick={() => setStatusFilter("RETURNED")} />
        <CardCount name="Accepted" count={counts.ACCEPTED} loading={countsLoading} icon="check_circle" color="var(--status-success)" onClick={() => setStatusFilter("ACCEPTED")} />
      </div>

      <div className="crvs-filter-bar">
        {canCreate && (
          <Button text="New death notification" appearance="primary" startIcon="add_circle" type="button" onClick={() => navigate("/dashboard/crvs/death-notifications/new")} testId="create-death-notification" />
        )}
        <div className="crvs-filter-field">
          <label htmlFor="dn-status">Status</label>
          <select id="dn-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DeathNotificationStatus | "")}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RETURNED">Returned for correction</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-search">Search</label>
          <input id="dn-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or name" />
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="inbox"
          emptyTitle="No death notifications"
          emptyDescription="Notifications you create or that change status will appear here."
        />
      </div>
    </div>
  );
}
