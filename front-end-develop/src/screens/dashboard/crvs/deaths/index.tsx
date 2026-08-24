import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { getDemoData } from "@/demo/storage/demoStore";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { deceasedDisplayName, formatDateTime } from "../deathShared";
import "../shared.css";

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Death "home" dashboard (spec §6): permission-filtered metrics, workload,
 * my assigned cases, recent activity, urgent exceptions, quick actions,
 * and search — the /dashboard/crvs/deaths landing page. */
export default function DeathsDashboard() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const [search, setSearch] = useState("");

  const canViewNotifications = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW);
  const canViewRegistrations = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const canViewExceptions = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW);
  const canCreateNotification = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE);
  const canCreateDraft = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW);

  const db = getDemoData();
  const notifications = db.crvsDeathNotifications;
  const registrations = db.crvsDeathRegistrations;

  const counts = useMemo(
    () => ({
      draftNotifications: notifications.filter((n) => n.status === "DRAFT").length,
      submittedNotifications: notifications.filter((n) => n.status === "SUBMITTED").length,
      awaitingReview: registrations.filter((c) => c.status === "SUBMITTED").length,
      correctionsRequired: registrations.filter((c) => c.status === "CORRECTION_REQUIRED").length,
      late: registrations.filter((c) => c.status === "LATE_REGISTRATION_REVIEW").length,
      medicoLegal: registrations.filter((c) => c.status === "MEDICO_LEGAL_REVIEW").length,
      unidentified: registrations.filter((c) => c.status === "UNIDENTIFIED_PERSON_REVIEW").length,
      registeredToday: registrations.filter((c) => c.status === "REGISTERED" && c.registeredAt?.slice(0, 10) === todayIso()).length,
      syncFailures: registrations.filter((c) => c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW").length,
    }),
    [notifications, registrations]
  );

  const myCases = registrations.filter((c) => c.officerId === currentAccountId || c.reviewerId === currentAccountId);
  const urgentExceptions = registrations.filter((c) => ["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"].includes(c.status));
  const recentAudit = db.auditEvents.filter((e) => e.module.startsWith("crvs.death")).slice(0, 8);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return registrations
      .filter((c) => c.reference.toLowerCase().includes(term) || deceasedDisplayName(c.deceased).toLowerCase().includes(term) || (c.facilityName || "").toLowerCase().includes(term) || (c.deceased.nin || "").toLowerCase().includes(term))
      .slice(0, 10);
  }, [search, registrations]);

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="deathRegistration" status={c.status} /> },
    { key: "updated", header: "Updated", render: (c) => formatDateTime(c.updatedAt) },
    { key: "actions", header: "", render: (c) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}`)} testId={`deaths-open-${c.id}`} /> },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death registration</h1>
        <p className="crvs-page-subtitle">Notifications, registrations, exceptions, and SDID synchronization for the death workflow.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="deaths-search">Search by reference, NIN, name, facility, or status</label>
          <input id="deaths-search" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="deaths-dashboard-search" />
        </div>
      </div>

      {search.trim() && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Search results</h2>
          <CaseQueueTable rows={searchResults} columns={columns} getRowKey={(c) => c.id} emptyTitle="No matches" emptyDescription="Try a different reference, name, or NIN." emptyIcon="search_off" />
        </div>
      )}

      <div className="crvs-tile-grid">
        {canViewNotifications && <CardCount name="Draft notifications" count={counts.draftNotifications} icon="edit_note" color="var(--status-neutral)" onClick={() => navigate("/dashboard/crvs/death-notifications")} />}
        {canViewNotifications && <CardCount name="Submitted notifications" count={counts.submittedNotifications} icon="outgoing_mail" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/death-notifications")} />}
        {canViewRegistrations && <CardCount name="Awaiting review" count={counts.awaitingReview} icon="fact_check" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/death-review")} />}
        {canViewRegistrations && <CardCount name="Corrections required" count={counts.correctionsRequired} icon="edit" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/death-registrations")} />}
        {canViewExceptions && <CardCount name="Late cases" count={counts.late} icon="schedule" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/death-exceptions")} />}
        {canViewExceptions && <CardCount name="Medico-legal cases" count={counts.medicoLegal} icon="gavel" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/death-exceptions")} />}
        {canViewExceptions && <CardCount name="Unidentified-person cases" count={counts.unidentified} icon="person_search" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/death-exceptions")} />}
        {canViewRegistrations && <CardCount name="Registered today" count={counts.registeredToday} icon="verified" color="var(--status-success)" onClick={() => navigate("/dashboard/crvs/registered-deaths")} />}
        {canViewExceptions && <CardCount name="SDID sync failures" count={counts.syncFailures} icon="sync_problem" color="var(--status-danger)" onClick={() => navigate("/dashboard/crvs/death-sync-failures")} />}
      </div>

      <div className="crvs-filter-bar">
        {canCreateNotification && <Button text="New death notification" appearance="primary" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/death-notifications/new")} testId="deaths-quick-new-notification" />}
        {canCreateDraft && <Button text="New death registration" appearance="ghost" startIcon="assignment" onClick={() => navigate("/dashboard/crvs/death-registrations/new")} testId="deaths-quick-new-registration" />}
        {canViewRegistrations && <Button text="Death registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-registrations")} testId="deaths-quick-registrations" />}
        {canViewExceptions && <Button text="Exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-exceptions")} testId="deaths-quick-exceptions" />}
        {canViewAudit && <Button text="Audit history" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-audit")} testId="deaths-quick-audit" />}
      </div>

      {canViewRegistrations && myCases.length > 0 && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">My assigned cases</h2>
          <CaseQueueTable rows={myCases.slice(0, 10)} columns={columns} getRowKey={(c) => c.id} emptyTitle="No cases assigned" emptyIcon="assignment" />
        </div>
      )}

      {canViewExceptions && urgentExceptions.length > 0 && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Urgent exceptions</h2>
          <CaseQueueTable rows={urgentExceptions.slice(0, 10)} columns={columns} getRowKey={(c) => c.id} emptyTitle="No urgent exceptions" emptyIcon="task_alt" />
        </div>
      )}

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Recent activity</h2>
          <table className="crvs-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.length === 0 && (
                <tr>
                  <td className="crvs-empty-row" colSpan={4}>
                    No recent activity.
                  </td>
                </tr>
              )}
              {recentAudit.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.actor}</td>
                  <td>{entry.action}</td>
                  <td>{entry.details}</td>
                  <td>{new Date(entry.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
