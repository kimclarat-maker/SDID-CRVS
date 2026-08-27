import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication, MarriageExceptionType } from "@/domain/crvs/types";
import { applicantDisplayName } from "../marriageShared";
import "../shared.css";

export const MARRIAGE_EXCEPTION_TYPE_LABELS: Record<MarriageExceptionType, string> = {
  UNDERAGE_WITHOUT_APPROVED_EXCEPTION: "Underage exception",
  FOREIGN_DOCUMENT_REVIEW: "Foreign document review",
  ADVANCE_NOTICE_WAIVED: "Advance-notice waiver",
  EXISTING_MARRIAGE_CONFLICT: "Existing-marriage conflict",
  CIVIL_STATUS_MISMATCH: "Civil-status mismatch",
  OTHER: "Other",
};

/** Marriage exceptions queue: every application whose side-record exception
 * is currently OPEN (spec — marriage exceptions are a side-record, not a
 * dedicated top-level application status, unlike death's pathway statuses). */
export default function MarriageExceptionsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW);

  const [applications, setApplications] = useState<MarriageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListMarriageApplications({ limit: 500 });
      setApplications(data.filter((a) => a.exception?.status === "OPEN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage exceptions.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "type", header: "Exception type", render: (a) => (a.exception ? MARRIAGE_EXCEPTION_TYPE_LABELS[a.exception.type] : "—") },
    { key: "reason", header: "Reason", render: (a) => a.exception?.reason || "—" },
    { key: "assigned", header: "Assigned to", render: (a) => a.exception?.assignedTo || a.reviewerName || "Unassigned" },
    { key: "priority", header: "Priority", render: (a) => a.exception?.priority || "—" },
    { key: "actions", header: "", render: (a) => <Button text="Review" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-exceptions/${a.id}`)} testId={`mr-exception-view-${a.id}`} /> },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage exceptions" isFullScreen />
      </div>
    );
  }

  const byType = (type: MarriageExceptionType) => applications.filter((a) => a.exception?.type === type).length;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage exceptions</h1>
        <p className="crvs-page-subtitle">Applications routed for supervisor exception review — underage, foreign-document, advance-notice waiver, existing-marriage conflict, and civil-status mismatch cases.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Underage exception" count={byType("UNDERAGE_WITHOUT_APPROVED_EXCEPTION")} icon="child_care" color="var(--status-warning)" />
        <CardCount name="Foreign document review" count={byType("FOREIGN_DOCUMENT_REVIEW")} icon="badge" color="var(--status-warning)" />
        <CardCount name="Advance-notice waiver" count={byType("ADVANCE_NOTICE_WAIVED")} icon="schedule" color="var(--status-warning)" />
        <CardCount name="Existing-marriage conflict" count={byType("EXISTING_MARRIAGE_CONFLICT")} icon="report" color="var(--status-danger)" />
        <CardCount name="Civil-status mismatch" count={byType("CIVIL_STATUS_MISMATCH")} icon="fact_check" color="var(--status-warning)" />
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={applications}
          columns={columns}
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No exceptions right now"
          emptyDescription="Every marriage application is progressing through the standard flow."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
