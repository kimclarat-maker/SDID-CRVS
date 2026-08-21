import { crvsExceptions } from "@/demo/seed/crvs";
import "../shared.css";

export default function Exceptions() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Exceptions &amp; late registrations</h1>
        <p className="crvs-page-subtitle">Cases outside the standard registration window.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Child</th>
              <th>Days late</th>
              <th>Reason</th>
              <th>Assigned to</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {crvsExceptions.map((e) => (
              <tr key={e.id}>
                <td>{e.reference}</td>
                <td>{e.childName}</td>
                <td>{e.daysLate}</td>
                <td>{e.reason}</td>
                <td>{e.assignedTo || "Unassigned"}</td>
                <td>
                  <span
                    className={`crvs-status-pill ${
                      e.status === "unassigned" ? "crvs-status-warning" : "crvs-status-info"
                    }`}
                  >
                    {e.status === "unassigned" ? "Unassigned" : "In progress"}
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
