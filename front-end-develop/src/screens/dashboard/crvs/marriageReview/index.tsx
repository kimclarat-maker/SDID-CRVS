import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../shared.css";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { demoListMarriageApplications, demoStartMarriageEligibilityReview } from "@/demo/services/crvsMarriageApplications";
import { canTransitionMarriageApplication } from "@/domain/crvs/statusMachines";
import { MarriageApplication } from "@/domain/crvs/types";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import { applicantDisplayName, formatDateTime } from "../marriageShared";
import StartMarriageReviewModal from "./components/modals/StartMarriageReviewModal";
import ActiveMarriageReviewConflictModal from "./components/modals/ActiveMarriageReviewConflictModal";

type TabKey = "UNASSIGNED" | "ASSIGNED_TO_ME" | "RESUBMITTED" | "READY_FOR_DECISION";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED_TO_ME", label: "Assigned to me" },
  { key: "RESUBMITTED", label: "Resubmitted" },
  { key: "READY_FOR_DECISION", label: "Ready for decision" },
];

export default function MarriageReviewQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW);

  const [applications, setApplications] = useState<MarriageApplication[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("UNASSIGNED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [startApp, setStartApp] = useState<MarriageApplication | undefined>();
  const [showStart, setShowStart] = useState(false);
  const [conflictApp, setConflictApp] = useState<MarriageApplication | undefined>();
  const [showConflict, setShowConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListMarriageApplications({ limit: 500 });
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the marriage review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const tabRows = useMemo(() => {
    const unassigned = applications.filter((a) => a.status === "SUBMITTED");
    const assignedToMe = applications.filter((a) => a.status === "ELIGIBILITY_REVIEW" && a.reviewerId === currentAccountId);
    const resubmitted = applications.filter((a) => a.status === "RESUBMITTED");
    const readyForDecision = assignedToMe.filter((a) => !!a.eligibility);
    return { UNASSIGNED: unassigned, ASSIGNED_TO_ME: assignedToMe, RESUBMITTED: resubmitted, READY_FOR_DECISION: readyForDecision } satisfies Record<TabKey, MarriageApplication[]>;
  }, [applications, currentAccountId]);

  const handleStartClick = (application: MarriageApplication) => {
    if (application.reviewerId && application.reviewerId !== currentAccountId) {
      setConflictApp(application);
      setShowConflict(true);
      return;
    }
    setStartApp(application);
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!startApp || !currentAccountId) return;
    try {
      const updated = demoStartMarriageEligibilityReview(startApp.id, currentAccountId, actorName);
      toastMessage("success", `You're now reviewing ${updated.reference}.`);
      navigate(`/dashboard/crvs/marriage-review/${updated.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setConflictApp(startApp);
        setShowConflict(true);
        return;
      }
      toastMessage("error", err);
    }
  };

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "proposedDate", header: "Proposed date", render: (a) => a.proposedMarriageDate?.slice(0, 10) || "—" },
    { key: "status", header: "Status", render: (a) => <StatusBadge kind="marriageApplication" status={a.status} /> },
    { key: "reviewer", header: "Reviewer", render: (a) => a.reviewerName || "Unassigned" },
    { key: "updated", header: "Updated", render: (a) => formatDateTime(a.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (a) => {
        const isMine = a.status === "ELIGIBILITY_REVIEW" && a.reviewerId === currentAccountId;
        const canGoUnderReview = canTransitionMarriageApplication(a.status, "ELIGIBILITY_REVIEW");
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isMine && <Button text="Continue review" size="sm" appearance="primary" onClick={() => navigate(`/dashboard/crvs/marriage-review/${a.id}`)} testId={`continue-marriage-review-${a.id}`} />}
            {!isMine && canGoUnderReview && canReview && (
              <Button text="Start review" size="sm" appearance="primary" onClick={() => handleStartClick(a)} testId={`start-marriage-review-${a.id}`} />
            )}
            <Button text="Preview" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId={`preview-marriage-application-${a.id}`} />
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the marriage review queue" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage review queue</h1>
        <p className="crvs-page-subtitle">Submitted marriage declarations awaiting eligibility review, within your jurisdiction.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tabs" role="tablist">
        {TAB_META.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`crvs-tab ${activeTab === tab.key ? "is-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
            <span className="review-tab-count">{tabRows[tab.key].length}</span>
          </button>
        ))}
      </div>

      <div className="crvs-section">
        <CaseQueueTable rows={tabRows[activeTab]} columns={columns} getRowKey={(a) => a.id} loading={loading} error={error} onRetry={load} emptyTitle="Nothing in this queue" emptyDescription="There are no applications matching this view right now." emptyIcon="inbox" />
      </div>

      <StartMarriageReviewModal show={showStart} onClose={() => setShowStart(false)} application={startApp} onConfirm={handleConfirmStart} />
      <ActiveMarriageReviewConflictModal show={showConflict} onClose={() => setShowConflict(false)} application={conflictApp} />
    </div>
  );
}
