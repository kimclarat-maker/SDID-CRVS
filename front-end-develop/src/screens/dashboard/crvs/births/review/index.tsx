import PendingReviewTable from "../../components/PendingReviewTable";
import "../../shared.css";

export default function ReviewQueue() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Review queue</h1>
        <p className="crvs-page-subtitle">
          Submitted registrations awaiting review within your jurisdiction.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <PendingReviewTable />
      </div>
    </div>
  );
}
