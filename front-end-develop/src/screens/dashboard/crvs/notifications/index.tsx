import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getAssignmentForWorkspace } from "@/utils/workspace";
import { demoListNotifications } from "@/demo/services/crvsNotifications";
import { BirthNotification, BirthNotificationStatus } from "@/domain/crvs/types";
import { DEMO_FACILITY_NAME } from "@/demo/seed/crvsAccounts";
import { childFullName } from "./components/NotificationWizard";
import "../shared.css";

type Counts = Record<"DRAFT" | "SUBMITTED" | "RETURNED" | "ACCEPTED", number>;

/** Birth-notification workspace landing page: today's status counts, recent
 * activity, quick links to every queue, and the primary "create" action. */
export default function NotificationsDashboard() {
  const navigate = useNavigate();
  const assignment = getAssignmentForWorkspace("CRVS");

  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE);
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW);

  const [counts, setCounts] = useState<Counts>({ DRAFT: 0, SUBMITTED: 0, RETURNED: 0, ACCEPTED: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  const [rows, setRows] = useState<BirthNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<BirthNotificationStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!canView) {
      setCountsLoading(false);
      return;
    }
    setCountsLoading(true);
    Promise.all(
      (["DRAFT", "SUBMITTED", "RETURNED", "ACCEPTED"] as const).map((status) =>
        demoListNotifications({ status, limit: 1 }).then((res) => [status, res.total] as const)
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
    demoListNotifications({
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 10,
    })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err?.message || "Couldn't load recent activity."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [canView, statusFilter, dateFrom, dateTo]);

  const columns: QueueColumn<BirthNotification>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "child", header: "Child", render: (r) => childFullName(r.child) },
    { key: "dob", header: "Date of birth", render: (r) => r.child.dateOfBirth || "—" },
    { key: "facility", header: "Facility", render: (r) => r.facilityName },
    { key: "updated", header: "Last updated", render: (r) => new Date(r.updatedAt).toLocaleString() },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="notification" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          text="View"
          size="sm"
          appearance="ghost"
          type="button"
          onClick={() => navigate(`/dashboard/crvs/notifications/${r.id}`)}
          testId={`dashboard-view-${r.id}`}
        />
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth notifications</h1>
        <p className="crvs-page-subtitle">
          {assignment?.facilityId ? `${DEMO_FACILITY_NAME} — ` : ""}
          Health-facility birth notifications.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount
          name="Drafts"
          count={counts.DRAFT}
          loading={countsLoading}
          icon="edit_note"
          color="var(--status-neutral)"
          onClick={() => navigate("/dashboard/crvs/notifications/drafts")}
        />
        <CardCount
          name="Submitted"
          count={counts.SUBMITTED}
          loading={countsLoading}
          icon="outgoing_mail"
          color="var(--status-info)"
          onClick={() => navigate("/dashboard/crvs/notifications/submitted")}
        />
        <CardCount
          name="Returned"
          count={counts.RETURNED}
          loading={countsLoading}
          icon="undo"
          color="var(--status-warning)"
          onClick={() => navigate("/dashboard/crvs/notifications/returned")}
        />
        <CardCount
          name="Accepted"
          count={counts.ACCEPTED}
          loading={countsLoading}
          icon="check_circle"
          color="var(--status-success)"
          onClick={() => navigate("/dashboard/crvs/notifications/accepted")}
        />
      </div>

      <div className="crvs-filter-bar">
        {canCreate && (
          <Button
            text="Create birth notification"
            appearance="primary"
            startIcon="add_circle"
            type="button"
            onClick={() => navigate("/dashboard/crvs/notifications/new")}
            testId="dashboard-create"
          />
        )}
        <Button text="Drafts" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/notifications/drafts")} testId="dashboard-goto-drafts" />
        <Button text="Submitted" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/notifications/submitted")} testId="dashboard-goto-submitted" />
        <Button text="Returned" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/notifications/returned")} testId="dashboard-goto-returned" />
        <Button text="Accepted" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/notifications/accepted")} testId="dashboard-goto-accepted" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent activity</h2>

        <div className="crvs-filter-bar">
          <div className="crvs-filter-field">
            <label htmlFor="dashboard-status">Status</label>
            <select id="dashboard-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BirthNotificationStatus | "")}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="RETURNED">Returned for correction</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="dashboard-from">Date of birth from</label>
            <input id="dashboard-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="dashboard-to">Date of birth to</label>
            <input id="dashboard-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="crvs-filter-field">
            <label htmlFor="dashboard-facility">Facility</label>
            <input id="dashboard-facility" value={DEMO_FACILITY_NAME} disabled readOnly />
          </div>
        </div>

        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="inbox"
          emptyTitle="No recent activity"
          emptyDescription="Notifications you create or that change status will appear here."
        />
      </div>
    </div>
  );
}
