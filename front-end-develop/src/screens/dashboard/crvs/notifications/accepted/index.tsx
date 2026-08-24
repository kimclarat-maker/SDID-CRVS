import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import { demoListNotifications, canConvertNotification } from "@/demo/services/crvsNotifications";
import { BirthNotification } from "@/domain/crvs/types";
import { childFullName } from "../components/NotificationWizard";
import "../../shared.css";

/** Accepted birth notifications — eligible for conversion into a birth
 * registration case (unless already converted). */
export default function AcceptedQueue() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListNotifications({ status: "ACCEPTED", search: search || undefined, limit: 100 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load accepted notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const columns: QueueColumn<BirthNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "child", header: "Child", render: (r) => childFullName(r.child) },
    { key: "acceptedAt", header: "Accepted", render: (r) => (r.acceptedAt ? new Date(r.acceptedAt).toLocaleDateString() : "—") },
    {
      key: "conversion",
      header: "Registration",
      render: (r) =>
        r.convertedToRegistrationId ? (
          <span className="crvs-status-pill crvs-status-success">Converted</span>
        ) : canConvertNotification(r) ? (
          <span className="crvs-status-pill crvs-status-info">Ready to convert</span>
        ) : (
          <span className="crvs-status-pill crvs-status-neutral">—</span>
        ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="notification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="crvs-table-action-cell">
          <Button
            text="View"
            size="sm"
            appearance="ghost"
            type="button"
            onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}`)}
            testId={`accepted-view-${r.id}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Accepted notifications</h1>
        <p className="crvs-page-subtitle">Accepted notifications ready for registration.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="accepted-search">Search</label>
          <input id="accepted-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or child name" />
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
          emptyIcon="check_circle"
          emptyTitle="No accepted notifications"
          emptyDescription="Accepted notifications will appear here, ready for conversion to registration."
        />
      </div>
    </div>
  );
}
