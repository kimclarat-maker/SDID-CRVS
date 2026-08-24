import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import { getDemoData } from "@/demo/storage/demoStore";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { deceasedDisplayName } from "../deathShared";

export default function RegistrationOfficerHome() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const myCases = getDemoData().crvsRegistrations.filter((c) => c.officerId === currentAccountId);
  const canViewDeaths = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const myDeathCases = getDemoData().crvsDeathRegistrations.filter((c) => c.officerId === currentAccountId);
  const drafts = myCases.filter((c) => c.status === "DRAFT");
  const correctionRequired = myCases.filter((c) => c.status === "CORRECTION_REQUIRED");
  const submitted = myCases.filter((c) => !["DRAFT", "CORRECTION_REQUIRED", "CANCELLED"].includes(c.status));

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">My registrations</h1>
        <p className="crvs-page-subtitle">Drafts, correction requests and submitted cases you created.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Drafts" count={drafts.length} icon="edit_document" color="var(--status-neutral)" />
        <CardCount name="Correction required" count={correctionRequired.length} icon="undo" color="var(--status-warning)" />
        <CardCount name="Submitted" count={submitted.length} icon="send" color="var(--status-info)" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">My cases</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Child</th>
              <th>Last updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myCases.length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={4}>
                  No cases yet.
                </td>
              </tr>
            )}
            {myCases.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/births/${c.id}`)}>
                <td>{c.reference}</td>
                <td>{c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`}</td>
                <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                <td>
                  <StatusBadge kind="registration" status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button text="Start a birth registration" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/births/new")} testId="new-draft-registration" />
        <Button text="View corrections queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/births/corrections")} testId="view-corrections-queue" />
      </div>

      {canViewDeaths && (
        <div className="crvs-section" style={{ marginTop: 24 }}>
          <h2 className="crvs-section-title">My death registrations</h2>
          <table className="crvs-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Deceased</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myDeathCases.length === 0 && (
                <tr>
                  <td className="crvs-empty-row" colSpan={3}>
                    No death cases yet.
                  </td>
                </tr>
              )}
              {myDeathCases.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}`)}>
                  <td>{c.reference}</td>
                  <td>{deceasedDisplayName(c.deceased)}</td>
                  <td>
                    <StatusBadge kind="deathRegistration" status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Button text="Start a death registration" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/death-registrations/new")} testId="new-draft-death-registration" />
          </div>
        </div>
      )}
    </div>
  );
}
