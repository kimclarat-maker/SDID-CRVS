import CardCount from "@/components/card/count";
import { crvsRegistrationCases } from "@/demo/seed/crvs";
import PendingReviewTable from "../components/PendingReviewTable";

export default function CivilRegistrarHome() {
  const pendingReview = crvsRegistrationCases.filter((c) => c.status === "submitted");

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Pending review</h1>
        <p className="crvs-page-subtitle">
          Submitted registrations awaiting your review, within your jurisdiction.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount
          name="Pending review"
          count={pendingReview.length}
          icon="fact_check"
          color="var(--color-primary-500)"
        />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Pending review queue</h2>
        <PendingReviewTable />
      </div>
    </div>
  );
}
