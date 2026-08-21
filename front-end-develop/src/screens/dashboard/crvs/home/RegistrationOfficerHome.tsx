import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import { crvsRegistrationCases, REGISTRATION_OFFICER_DEMO_ID } from "@/demo/seed/crvs";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  correctionRequested: "Correction requested",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "crvs-status-neutral",
  submitted: "crvs-status-info",
  correctionRequested: "crvs-status-warning",
  approved: "crvs-status-success",
  rejected: "crvs-status-warning",
};

export default function RegistrationOfficerHome() {
  const navigate = useNavigate();
  const myCases = crvsRegistrationCases.filter(
    (c) => c.submittedByOfficerId === REGISTRATION_OFFICER_DEMO_ID
  );
  const drafts = myCases.filter((c) => c.status === "draft");
  const returnedCorrections = myCases.filter((c) => c.status === "correctionRequested");
  const submitted = myCases.filter((c) => c.status === "submitted");

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">My registrations</h1>
        <p className="crvs-page-subtitle">Drafts, returned corrections and submitted cases.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Drafts" count={drafts.length} icon="edit_document" color="var(--status-neutral)" />
        <CardCount
          name="Returned for correction"
          count={returnedCorrections.length}
          icon="undo"
          color="var(--status-warning)"
        />
        <CardCount
          name="Submitted"
          count={submitted.length}
          icon="send"
          color="var(--color-primary-500)"
        />
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
              <tr key={c.id}>
                <td>{c.reference}</td>
                <td>{c.childName}</td>
                <td>{new Date(c.submittedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`crvs-status-pill ${STATUS_CLASS[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        text="New draft registration"
        startIcon="add_circle"
        onClick={() => navigate("/dashboard/crvs/births/new")}
        testId="new-draft-registration"
      />
    </div>
  );
}
