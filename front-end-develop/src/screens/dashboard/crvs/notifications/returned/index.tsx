import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListNotifications } from "@/demo/services/crvsNotifications";
import { BirthNotification } from "@/domain/crvs/types";
import { childFullName } from "../components/NotificationWizard";
import "../../shared.css";

/** Notifications a Registration Officer returned for correction — the
 * outstanding reason is shown so the notifier knows what to fix. */
export default function ReturnedQueue() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListNotifications({ status: "RETURNED", search: search || undefined, limit: 100 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load returned notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const columns: QueueColumn<BirthNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "child", header: "Child", render: (r) => childFullName(r.child) },
    { key: "returnedAt", header: "Returned", render: (r) => (r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : "—") },
    { key: "reason", header: "Correction needed", render: (r) => r.returnReason?.reason || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="notification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="crvs-table-action-cell" style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <Button
              text="Respond"
              size="sm"
              appearance="ghost"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}/edit`)}
              testId={`returned-respond-${r.id}`}
            />
          )}
          <Button
            text="View"
            size="sm"
            appearance="ghost"
            type="button"
            onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}`)}
            testId={`returned-view-${r.id}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Returned notifications</h1>
        <p className="crvs-page-subtitle">Notifications sent back for correction — respond and resubmit.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="returned-search">Search</label>
          <input id="returned-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or child name" />
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
          emptyIcon="undo"
          emptyTitle="No returned notifications"
          emptyDescription="Notifications returned for correction will appear here."
        />
      </div>
    </div>
  );
}
