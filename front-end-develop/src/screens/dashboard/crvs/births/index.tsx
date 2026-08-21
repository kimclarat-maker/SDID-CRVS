import { crvsBirthNotifications } from "@/demo/seed/crvs";
import "../shared.css";

export default function Births() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth notifications</h1>
        <p className="crvs-page-subtitle">All notifications for your facility/jurisdiction.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Child</th>
              <th>Date of birth</th>
              <th>Facility</th>
              <th>Notified by</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {crvsBirthNotifications.map((n) => (
              <tr key={n.id}>
                <td>{n.reference}</td>
                <td>{n.childName}</td>
                <td>{n.dateOfBirth}</td>
                <td>{n.facility}</td>
                <td>{n.notifiedBy}</td>
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
    </div>
  );
}
