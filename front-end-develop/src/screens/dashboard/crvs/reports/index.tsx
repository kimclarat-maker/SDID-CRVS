import CardCount from "@/components/card/count";
import { getDemoData } from "@/demo/storage/demoStore";
import "../shared.css";

/** Supervisor workload/analytics view (spec §16 "View staff workload"). */
export default function Reports() {
  const db = getDemoData();
  const registrations = db.crvsRegistrations;
  const notifications = db.crvsNotifications;

  const byOfficer = new Map<string, number>();
  registrations.forEach((c) => byOfficer.set(c.officerName, (byOfficer.get(c.officerName) || 0) + 1));

  const registered = registrations.filter((c) => c.status === "REGISTERED");
  const avgProcessingDays =
    registered.length > 0
      ? Math.round(
          registered.reduce((sum, c) => {
            const submitted = c.submittedAt ? new Date(c.submittedAt).getTime() : 0;
            const registeredAt = c.registeredAt ? new Date(c.registeredAt).getTime() : 0;
            return sum + Math.max(0, (registeredAt - submitted) / (1000 * 60 * 60 * 24));
          }, 0) / registered.length
        )
      : 0;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Workload &amp; reports</h1>
        <p className="crvs-page-subtitle">Staff workload and processing analytics across the CRVS workspace.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Notifications" count={notifications.length} icon="campaign" color="var(--status-info)" />
        <CardCount name="Registrations" count={registrations.length} icon="folder" color="var(--status-info)" />
        <CardCount name="Registered" count={registered.length} icon="verified" color="var(--status-success)" />
        <CardCount name="Avg. days to register" count={avgProcessingDays} icon="timer" color="var(--status-neutral)" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Staff workload</h2>
        {byOfficer.size === 0 ? (
          <p className="crvs-form-hint">No cases recorded yet.</p>
        ) : (
          <table className="crvs-table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byOfficer.entries()).map(([name, count]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
