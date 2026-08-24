import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import "../shared.css";

export default function Exceptions() {
  const navigate = useNavigate();
  const db = getDemoData();
  const lateRegistrations = db.crvsRegistrations.filter((c) => c.status === "LATE_REGISTRATION_REVIEW");
  const exceptionReview = db.crvsRegistrations.filter((c) => c.status === "EXCEPTION_REVIEW");
  const syncFailures = db.crvsRegistrations.filter((c) => c.sdid.status === "FAILED" || c.sdid.status === "MANUAL_REVIEW");
  const combined = [...lateRegistrations, ...exceptionReview];

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "child", header: "Child", render: (c) => (c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`) },
    { key: "days", header: "Days after birth", render: (c) => c.daysAfterBirth },
    { key: "reason", header: "Reason", render: (c) => c.delayReason || c.exception?.reason || "—" },
    { key: "assigned", header: "Assigned to", render: (c) => c.reviewerName || "Unassigned" },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
    {
      key: "action",
      header: "",
      render: (c) => <Button text="Review" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/exceptions/${c.id}`)} testId={`review-exception-${c.id}`} />,
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Exceptions &amp; late registrations</h1>
        <p className="crvs-page-subtitle">Cases outside the standard registration window, or needing exception resolution.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Late registrations" count={lateRegistrations.length} icon="schedule" color="var(--status-warning)" />
        <CardCount name="Exception review" count={exceptionReview.length} icon="report" color="var(--status-warning)" />
        <CardCount name="Sync failures" count={syncFailures.length} icon="sync_problem" color="var(--status-danger)" />
      </div>

      <div className="crvs-filter-bar">
        <Button text="Late registrations" appearance="ghost" onClick={() => navigate("/dashboard/crvs/exceptions/late-registrations")} testId="tab-late-registrations" />
        <Button text="Duplicates" appearance="ghost" onClick={() => navigate("/dashboard/crvs/exceptions/duplicates")} testId="tab-duplicates" />
        <Button text="Sync failures" appearance="ghost" onClick={() => navigate("/dashboard/crvs/exceptions/sync-failures")} testId="tab-sync-failures" />
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={combined}
          columns={columns}
          getRowKey={(c) => c.id}
          emptyTitle="No exceptions or late registrations"
          emptyDescription="Every case is within the standard registration window."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
