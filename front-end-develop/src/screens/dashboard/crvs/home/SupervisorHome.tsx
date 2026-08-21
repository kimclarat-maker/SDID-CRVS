import CardCount from "@/components/card/count";
import { crvsExceptions, crvsAuditLog, crvsWorkloadSummary } from "@/demo/seed/crvs";

export default function SupervisorHome() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">CRVS workload overview</h1>
        <p className="crvs-page-subtitle">
          Exceptions, late registrations, staff workload and audit activity.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount
          name="Pending review"
          count={crvsWorkloadSummary.pendingReview}
          icon="fact_check"
          color="var(--color-primary-500)"
        />
        <CardCount
          name="Open exceptions"
          count={crvsWorkloadSummary.openExceptions}
          icon="warning"
          color="var(--status-warning)"
        />
        <CardCount
          name="Open corrections"
          count={crvsWorkloadSummary.openCorrections}
          icon="edit_note"
          color="var(--status-neutral)"
        />
        <CardCount
          name="Staff on duty"
          count={crvsWorkloadSummary.staffOnDuty}
          icon="groups"
          color="var(--status-success)"
        />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Exceptions &amp; late registrations</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Child</th>
              <th>Days late</th>
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

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent audit activity</h2>
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
            {crvsAuditLog.map((entry) => (
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
    </div>
  );
}
