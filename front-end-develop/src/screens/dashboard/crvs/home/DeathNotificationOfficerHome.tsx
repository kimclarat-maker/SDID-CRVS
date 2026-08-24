import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";
import { deceasedDisplayName } from "../deathShared";

export default function DeathNotificationOfficerHome() {
  const navigate = useNavigate();
  const notifications = getDemoData().crvsDeathNotifications;
  const drafts = notifications.filter((n) => n.status === "DRAFT");
  const submitted = notifications.filter((n) => n.status === "SUBMITTED");
  const returned = notifications.filter((n) => n.status === "RETURNED");
  const accepted = notifications.filter((n) => n.status === "ACCEPTED");
  const recent = [...notifications].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death notifications</h1>
        <p className="crvs-page-subtitle">Notifications created today and recent activity for your facility.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Drafts" count={drafts.length} icon="edit_document" color="var(--status-neutral)" />
        <CardCount name="Submitted" count={submitted.length} icon="outgoing_mail" color="var(--status-info)" />
        <CardCount name="Returned" count={returned.length} icon="undo" color="var(--status-warning)" />
        <CardCount name="Accepted" count={accepted.length} icon="check_circle" color="var(--status-success)" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent notification activity</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Deceased</th>
              <th>Date of death</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={4}>
                  No notifications yet.
                </td>
              </tr>
            )}
            {recent.map((n) => (
              <tr key={n.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/death-notifications/${n.id}`)}>
                <td>{n.reference}</td>
                <td>{deceasedDisplayName(n.deceased)}</td>
                <td>{n.occurrence.dateOfDeath?.slice(0, 10) || "—"}</td>
                <td>
                  <StatusBadge kind="deathNotification" status={n.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button text="Create death notification" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/death-notifications/new")} testId="create-death-notification-home" />
        <Button text="View all death notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-notifications")} testId="view-death-notifications-home" />
      </div>
    </div>
  );
}
