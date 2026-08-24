import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../shared.css";
import "./review.css";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { allMandatorySectionsReviewed, demoListRegistrations, demoStartReview } from "@/demo/services/crvsRegistrations";
import { canTransitionRegistration } from "@/domain/crvs/statusMachines";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import StartReviewModal from "./components/modals/StartReviewModal";
import ActiveReviewConflictModal from "./components/modals/ActiveReviewConflictModal";
import { formatDateTime, fullName, getCurrentActorName, returnedFromLateReview } from "./utils";

type TabKey =
  | "UNASSIGNED"
  | "ASSIGNED_TO_ME"
  | "RESUBMITTED"
  | "POTENTIAL_DUPLICATES"
  | "LATE_RETURNED"
  | "READY_FOR_DECISION";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED_TO_ME", label: "Assigned to me" },
  { key: "RESUBMITTED", label: "Resubmitted" },
  { key: "POTENTIAL_DUPLICATES", label: "Potential duplicates" },
  { key: "LATE_RETURNED", label: "Late-registration (from supervisor)" },
  { key: "READY_FOR_DECISION", label: "Ready for decision" },
];

/**
 * Civil Registrar review queue (spec: "review queue and review workspace").
 * Fetches the full working set of registration cases once and slices it
 * into six tabs client-side — the demo backend's demoListRegistrations only
 * filters on a single `status` value, and several of these tabs need
 * OR-across-status or derived (duplicateCheck level, status-history)
 * predicates that a single status filter can't express.
 */
export default function ReviewQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EVIDENCE_REVIEW);

  const [activeTab, setActiveTab] = useState<TabKey>("UNASSIGNED");
  const [cases, setCases] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [startCase, setStartCase] = useState<BirthRegistrationCase | undefined>(undefined);
  const [showStart, setShowStart] = useState(false);
  const [conflictCase, setConflictCase] = useState<BirthRegistrationCase | undefined>(undefined);
  const [showConflict, setShowConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListRegistrations({ limit: 500 });
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const tabRows = useMemo(() => {
    const unassigned = cases.filter((c) => c.status === "SUBMITTED");
    const assignedToMe = cases.filter((c) => c.status === "UNDER_REVIEW" && c.reviewerId === currentAccountId);
    const resubmitted = cases.filter((c) => c.status === "RESUBMITTED");
    const potentialDuplicates = cases.filter(
      (c) => c.duplicateCheck?.overallLevel === "POTENTIAL" || c.duplicateCheck?.overallLevel === "PROBABLE"
    );
    const lateReturned = cases.filter((c) => c.status === "LATE_REGISTRATION_REVIEW" || returnedFromLateReview(c));
    const readyForDecision = assignedToMe.filter((c) => allMandatorySectionsReviewed(c));

    return {
      UNASSIGNED: unassigned,
      ASSIGNED_TO_ME: assignedToMe,
      RESUBMITTED: resubmitted,
      POTENTIAL_DUPLICATES: potentialDuplicates,
      LATE_RETURNED: lateReturned,
      READY_FOR_DECISION: readyForDecision,
    } satisfies Record<TabKey, BirthRegistrationCase[]>;
  }, [cases, currentAccountId]);

  const handleStartClick = (registrationCase: BirthRegistrationCase) => {
    if (registrationCase.reviewerId && registrationCase.reviewerId !== currentAccountId) {
      setConflictCase(registrationCase);
      setShowConflict(true);
      return;
    }
    setStartCase(registrationCase);
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!startCase || !currentAccountId) return;
    try {
      const updated = demoStartReview(startCase.id, currentAccountId, actorName);
      toastMessage("success", `You're now reviewing ${updated.reference}.`);
      navigate(`/dashboard/crvs/review/${updated.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setConflictCase(startCase);
        setShowConflict(true);
        return;
      }
      throw err;
    }
  };

  const handleReassignStub = () => {
    toastMessage("info", "Reassignment is handled from the Supervisor's exceptions queue.");
  };

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "child", header: "Child", render: (c) => fullName(c.child.firstName, c.child.middleName, c.child.lastName) },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
    {
      key: "duplicate",
      header: "Duplicate level",
      render: (c) =>
        c.duplicateCheck && c.duplicateCheck.overallLevel !== "NONE" ? (
          <span
            className={`crvs-status-pill ${
              c.duplicateCheck.overallLevel === "EXACT" ? "crvs-status-danger" : "crvs-status-warning"
            }`}
          >
            {c.duplicateCheck.overallLevel}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "reviewer", header: "Reviewer", render: (c) => c.reviewerName || "Unassigned" },
    { key: "updated", header: "Updated", render: (c) => formatDateTime(c.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (c) => {
        const isMine = c.status === "UNDER_REVIEW" && c.reviewerId === currentAccountId;
        const canGoUnderReview = canTransitionRegistration(c.status, "UNDER_REVIEW");
        return (
          <div className="crvs-table-action-cell" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isMine && (
              <Button
                text="Continue review"
                size="sm"
                appearance="primary"
                onClick={() => navigate(`/dashboard/crvs/review/${c.id}`)}
                testId={`continue-review-${c.id}`}
              />
            )}
            {!isMine && canGoUnderReview && canReview && (
              <Button
                text="Start review"
                size="sm"
                appearance="primary"
                onClick={() => handleStartClick(c)}
                testId={`start-review-${c.id}`}
              />
            )}
            <Button
              text="Preview"
              size="sm"
              appearance="ghost"
              onClick={() => navigate(`/dashboard/crvs/births/${c.id}`)}
              testId={`preview-${c.id}`}
            />
            {canReview && (
              <Button
                text="Reassign"
                size="sm"
                appearance="subtle"
                onClick={handleReassignStub}
                testId={`reassign-${c.id}`}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the review queue" isFullScreen />
      </div>
    );
  }

  const rows = tabRows[activeTab];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Review queue</h1>
        <p className="crvs-page-subtitle">
          Submitted birth registrations awaiting Civil Registrar review, within your jurisdiction.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tabs" role="tablist">
        {TAB_META.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`crvs-tab ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="review-tab-count">{tabRows[tab.key].length}</span>
          </button>
        ))}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Nothing in this queue"
          emptyDescription="There are no cases matching this view right now."
          emptyIcon="inbox"
        />
      </div>

      <StartReviewModal
        show={showStart}
        onClose={() => setShowStart(false)}
        registrationCase={startCase}
        onConfirm={handleConfirmStart}
      />
      <ActiveReviewConflictModal
        show={showConflict}
        onClose={() => setShowConflict(false)}
        registrationCase={conflictCase}
      />
    </div>
  );
}
