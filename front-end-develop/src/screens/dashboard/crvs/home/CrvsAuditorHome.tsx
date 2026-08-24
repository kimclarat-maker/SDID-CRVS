import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";

/** Read-only oversight home — Auditor has no create/edit/approve authority,
 * so this is purely a jumping-off point to the audit trail and read-only
 * queues (spec §2 "restricted to users without the explicit permission"). */
export default function CrvsAuditorHome() {
  const navigate = useNavigate();
  const db = getDemoData();
  const recentAudit = db.auditEvents.filter((e) => e.module.startsWith("crvs.death")).slice(0, 10);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Audit oversight</h1>
        <p className="crvs-page-subtitle">Read-only access to death registrations and audit history.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent death-workflow activity</h2>
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button text="Open death audit history" appearance="primary" onClick={() => navigate("/dashboard/crvs/death-audit")} testId="auditor-open-death-audit" />
        <Button text="View death registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-registrations")} testId="auditor-open-death-registrations" />
      </div>
    </div>
  );
}
