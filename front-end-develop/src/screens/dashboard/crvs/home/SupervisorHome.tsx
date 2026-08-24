import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { deceasedDisplayName } from "../deathShared";

export default function SupervisorHome() {
  const navigate = useNavigate();
  const db = getDemoData();
  const registrations = db.crvsRegistrations;
  const lateRegistrations = registrations.filter((c) => c.status === "LATE_REGISTRATION_REVIEW");
  const exceptions = registrations.filter((c) => c.status === "EXCEPTION_REVIEW");
  const syncFailures = registrations.filter((c) => c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW");
  const recentAudit = db.auditEvents.filter((e) => e.module.startsWith("crvs.")).slice(0, 8);

  const canViewDeathExceptions = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW);
  const deathRegistrations = db.crvsDeathRegistrations;
  const deathExceptionCases = deathRegistrations.filter((c) => ["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"].includes(c.status));
  const deathSyncFailures = deathRegistrations.filter((c) => c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW");

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">CRVS workload overview</h1>
        <p className="crvs-page-subtitle">Exceptions, late registrations, synchronization failures and audit activity.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Late registrations" count={lateRegistrations.length} icon="schedule" color="var(--status-warning)" />
        <CardCount name="Open exceptions" count={exceptions.length} icon="warning" color="var(--status-warning)" />
        <CardCount name="Sync failures" count={syncFailures.length} icon="sync_problem" color="var(--status-danger)" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Exceptions &amp; late registrations</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Child</th>
              <th>Days after birth</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...lateRegistrations, ...exceptions].length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={4}>
                  No exceptions or late registrations right now.
                </td>
              </tr>
            )}
            {[...lateRegistrations, ...exceptions].map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/exceptions/${c.id}`)}>
                <td>{c.reference}</td>
                <td>{c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`}</td>
                <td>{c.daysAfterBirth}</td>
                <td>
                  <StatusBadge kind="registration" status={c.status} />
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
        <Button text="Open exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/exceptions")} testId="open-exceptions" />
        <Button text="View audit history" appearance="ghost" onClick={() => navigate("/dashboard/crvs/audit")} testId="open-audit" />
      </div>

      {canViewDeathExceptions && (
        <>
          <div className="crvs-section" style={{ marginTop: 24 }}>
            <h2 className="crvs-section-title">Death exceptions &amp; late registrations</h2>
            <div className="crvs-tile-grid">
              <CardCount name="Exception review" count={deathExceptionCases.length} icon="warning" color="var(--status-warning)" />
              <CardCount name="Sync failures" count={deathSyncFailures.length} icon="sync_problem" color="var(--status-danger)" />
            </div>
            <table className="crvs-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Deceased</th>
                  <th>Days after death</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deathExceptionCases.length === 0 && (
                  <tr>
                    <td className="crvs-empty-row" colSpan={4}>
                      No death exceptions right now.
                    </td>
                  </tr>
                )}
                {deathExceptionCases.map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/death-exceptions/${c.id}`)}>
                    <td>{c.reference}</td>
                    <td>{deceasedDisplayName(c.deceased)}</td>
                    <td>{c.daysAfterDeath}</td>
                    <td>
                      <StatusBadge kind="deathRegistration" status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button text="Open death exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-exceptions")} testId="open-death-exceptions" />
            <Button text="View death audit history" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-audit")} testId="open-death-audit" />
          </div>
        </>
      )}
    </div>
  );
}
