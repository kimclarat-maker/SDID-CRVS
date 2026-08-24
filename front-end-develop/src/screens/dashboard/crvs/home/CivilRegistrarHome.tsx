import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import PendingReviewTable from "../components/PendingReviewTable";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";

export default function CivilRegistrarHome() {
  const navigate = useNavigate();
  const registrations = getDemoData().crvsRegistrations;
  const unassigned = registrations.filter((c) => c.status === "SUBMITTED");
  const underReview = registrations.filter((c) => c.status === "UNDER_REVIEW");
  const resubmitted = registrations.filter((c) => c.status === "RESUBMITTED");

  const canViewDeaths = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const deathRegistrations = getDemoData().crvsDeathRegistrations;
  const deathUnassigned = deathRegistrations.filter((c) => c.status === "SUBMITTED");
  const deathUnderReview = deathRegistrations.filter((c) => c.status === "UNDER_REVIEW");
  const deathExceptions = deathRegistrations.filter((c) => ["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"].includes(c.status));

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Review queue</h1>
        <p className="crvs-page-subtitle">Registrations awaiting your review, within your jurisdiction.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Unassigned" count={unassigned.length} icon="assignment_late" color="var(--status-info)" />
        <CardCount name="Under review" count={underReview.length} icon="fact_check" color="var(--brand-primary-500, var(--status-info))" />
        <CardCount name="Resubmitted" count={resubmitted.length} icon="outgoing_mail" color="var(--status-warning)" />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Ready for your decision</h2>
        <PendingReviewTable />
      </div>

      <Button text="Open review queue" startIcon="fact_check" onClick={() => navigate("/dashboard/crvs/review")} testId="open-review-queue" />

      {canViewDeaths && (
        <>
          <div className="crvs-section" style={{ marginTop: 24 }}>
            <h2 className="crvs-section-title">Death registration review</h2>
            <div className="crvs-tile-grid">
              <CardCount name="Unassigned" count={deathUnassigned.length} icon="assignment_late" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/death-review")} />
              <CardCount name="Under review" count={deathUnderReview.length} icon="fact_check" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/death-review")} />
              <CardCount name="Exception review" count={deathExceptions.length} icon="warning" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/death-exceptions")} />
            </div>
          </div>
          <Button text="Open death review queue" startIcon="fact_check" onClick={() => navigate("/dashboard/crvs/death-review")} testId="open-death-review-queue" />
        </>
      )}
    </div>
  );
}
