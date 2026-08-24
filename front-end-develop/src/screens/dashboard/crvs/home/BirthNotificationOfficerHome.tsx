import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";

export default function BirthNotificationOfficerHome() {
  const navigate = useNavigate();
  const notifications = getDemoData().crvsNotifications;
  const drafts = notifications.filter((n) => n.status === "DRAFT");
  const submitted = notifications.filter((n) => n.status === "SUBMITTED");
  const returned = notifications.filter((n) => n.status === "RETURNED");
  const accepted = notifications.filter((n) => n.status === "ACCEPTED");
  const recent = [...notifications].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth notifications</h1>
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
              <th>Child</th>
              <th>Date of birth</th>
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
              <tr key={n.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/notifications/${n.id}`)}>
                <td>{n.reference}</td>
                <td>{n.child.firstName ? `${n.child.firstName} ${n.child.lastName}` : `Unnamed ${n.child.lastName}`}</td>
                <td>{new Date(n.child.dateOfBirth).toLocaleDateString()}</td>
                <td>
                  <StatusBadge kind="notification" status={n.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button
          text="Create birth notification"
          startIcon="add_circle"
          onClick={() => navigate("/dashboard/crvs/notifications/new")}
          testId="create-birth-notification"
        />
        <Button text="View all drafts" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications/drafts")} testId="view-notification-drafts" />
        <Button text="View submitted" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications/submitted")} testId="view-notification-submitted" />
        <Button text="View returned" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications/returned")} testId="view-notification-returned" />
      </div>
    </div>
  );
}
