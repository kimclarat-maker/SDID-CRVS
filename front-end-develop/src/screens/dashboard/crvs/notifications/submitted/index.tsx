import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import { demoListNotifications } from "@/demo/services/crvsNotifications";
import { BirthNotification } from "@/domain/crvs/types";
import { childFullName } from "../components/NotificationWizard";
import "../../shared.css";

/** Submitted birth notifications awaiting a CRVS Registration Officer's
 * accept/return decision. */
export default function SubmittedQueue() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListNotifications({
      status: "SUBMITTED",
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 100,
    })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load submitted notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, dateFrom, dateTo]);

  const columns: QueueColumn<BirthNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "child", header: "Child", render: (r) => childFullName(r.child) },
    { key: "dob", header: "Date of birth", render: (r) => r.child.dateOfBirth || "—" },
    { key: "facility", header: "Facility", render: (r) => r.facilityName },
    { key: "submitted", header: "Submitted", render: (r) => (r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—") },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="notification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="crvs-table-action-cell">
          <Button
            text="Review"
            size="sm"
            appearance="ghost"
            type="button"
            onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}`)}
            testId={`submitted-review-${r.id}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Submitted notifications</h1>
        <p className="crvs-page-subtitle">Awaiting review and acceptance.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="submitted-search">Search</label>
          <input id="submitted-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference or child name" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="submitted-from">Date of birth from</label>
          <input id="submitted-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="submitted-to">Date of birth to</label>
          <input id="submitted-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
          emptyIcon="outgoing_mail"
          emptyTitle="No submitted notifications"
          emptyDescription="Notifications waiting for review will appear here."
        />
      </div>
    </div>
  );
}
