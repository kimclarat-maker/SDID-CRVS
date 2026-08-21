import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import { crvsBirthNotifications } from "@/demo/seed/crvs";

export default function BirthNotificationOfficerHome() {
  const navigate = useNavigate();
  const newCount = crvsBirthNotifications.filter((n) => n.status === "new").length;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth notifications</h1>
        <p className="crvs-page-subtitle">
          Recent notifications for your assigned facility.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount
          name="New notifications"
          count={newCount}
          icon="campaign"
          color="var(--color-primary-500)"
        />
        <CardCount
          name="Total this month"
          count={crvsBirthNotifications.length}
          icon="event_note"
          color="var(--status-success)"
        />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent notifications</h2>
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
            {crvsBirthNotifications.map((n) => (
              <tr key={n.id}>
                <td>{n.reference}</td>
                <td>{n.childName}</td>
                <td>{n.dateOfBirth}</td>
                <td>
                  <span
                    className={`crvs-status-pill ${
                      n.status === "new" ? "crvs-status-info" : "crvs-status-neutral"
                    }`}
                  >
                    {n.status === "new" ? "New" : "Acknowledged"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        text="Create notification"
        startIcon="add_circle"
        onClick={() => navigate("/dashboard/crvs/births/new")}
        testId="create-birth-notification"
      />
    </div>
  );
}
