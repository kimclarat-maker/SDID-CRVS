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

/** Draft birth notifications not yet submitted — Birth Notification Officer
 * queue for resuming or cancelling in-progress work. */
export default function DraftsQueue() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListNotifications({ status: "DRAFT", search: search || undefined, limit: 100 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load draft notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const columns: QueueColumn<BirthNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "child", header: "Child", render: (r) => childFullName(r.child) },
    { key: "dob", header: "Date of birth", render: (r) => r.child.dateOfBirth || "—" },
    { key: "updated", header: "Last updated", render: (r) => new Date(r.updatedAt).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="notification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="crvs-table-action-cell" style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <Button
              text="Continue editing"
              size="sm"
              appearance="ghost"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}/edit`)}
              testId={`draft-continue-${r.id}`}
            />
          )}
          <Button
            text="View"
            size="sm"
            appearance="ghost"
            type="button"
            onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}`)}
            testId={`draft-view-${r.id}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Draft notifications</h1>
        <p className="crvs-page-subtitle">Notifications you've started but haven't submitted yet.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="drafts-search">Search</label>
          <input id="drafts-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or child name" />
        </div>
        {canCreate && (
          <Button
            text="Create birth notification"
            appearance="primary"
            startIcon="add_circle"
            type="button"
            onClick={() => navigate("/dashboard/crvs/notifications/new")}
            testId="drafts-create"
          />
        )}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="edit_note"
          emptyTitle="No draft notifications"
          emptyDescription="Notifications you start and haven't submitted yet will appear here."
        />
      </div>
    </div>
  );
}
