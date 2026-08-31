import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import AnnulmentStatusPill from "./components/AnnulmentStatusPill";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoListAnnulmentRegistrations, demoStartAnnulmentReview } from "@/demo/services/crvsAnnulmentRegistrations";
import { canTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";
import { affectedPartiesLabel, annulmentSlaState, formatDateTime, marriageReferenceLabel } from "../annulmentShared";
import { ActiveAnnulmentReviewConflictModal, StartAnnulmentReviewModal } from "./components/modals/StartAnnulmentReviewModal";
import "../shared.css";
import "../review/review.css";

type TabKey = "UNASSIGNED" | "ASSIGNED_TO_ME" | "RESUBMITTED" | "SPECIALIST_REVIEW" | "READY_FOR_DECISION" | "APPROVED";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED_TO_ME", label: "Assigned to me" },
  { key: "RESUBMITTED", label: "Resubmitted" },
  { key: "SPECIALIST_REVIEW", label: "Specialist review" },
  { key: "READY_FOR_DECISION", label: "Ready for decision" },
  { key: "APPROVED", label: "Awaiting registration" },
];

/** Marriage-annulment review queue — the Civil Registrar's entry point into
 * the case workspace. Mirrors divorceReview/index.tsx, with a "Specialist
 * review" view spanning annulment's four specialist branches (decision
 * verification, legal-effect review, foreign-decision review, exception
 * review). */
export default function AnnulmentReviewQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW);

  const [registrations, setRegistrations] = useState<AnnulmentRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("UNASSIGNED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [startTarget, setStartTarget] = useState<AnnulmentRegistration | undefined>();
  const [showStart, setShowStart] = useState(false);
  const [conflictTarget, setConflictTarget] = useState<AnnulmentRegistration | undefined>();
  const [showConflict, setShowConflict] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListAnnulmentRegistrations({ limit: 500 });
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the annulment review queue.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const tabRows = useMemo(() => {
    const unassigned = registrations.filter((r) => r.status === "SUBMITTED" && !r.reviewerId);
    const assignedToMe = registrations.filter((r) => r.status === "UNDER_REVIEW" && r.reviewerId === currentAccountId);
    const resubmitted = registrations.filter((r) => r.status === "RESUBMITTED");
    const specialist = registrations.filter(
      (r) => r.status === "DECISION_VERIFICATION" || r.status === "LEGAL_EFFECT_REVIEW" || r.status === "FOREIGN_DECISION_REVIEW" || r.status === "EXCEPTION_REVIEW"
    );
    const readyForDecision = assignedToMe.filter((r) => Object.values(r.reviewSections).every((s) => s !== "NOT_REVIEWED"));
    const approved = registrations.filter((r) => r.status === "APPROVED");
    return {
      UNASSIGNED: unassigned,
      ASSIGNED_TO_ME: assignedToMe,
      RESUBMITTED: resubmitted,
      SPECIALIST_REVIEW: specialist,
      READY_FOR_DECISION: readyForDecision,
      APPROVED: approved,
    } satisfies Record<TabKey, AnnulmentRegistration[]>;
  }, [registrations, currentAccountId]);

  const handleStartClick = (registration: AnnulmentRegistration) => {
    if (registration.reviewerId && registration.reviewerId !== currentAccountId) {
      setConflictTarget(registration);
      setShowConflict(true);
      return;
    }
    setStartTarget(registration);
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!startTarget || !currentAccountId) return;
    try {
      const updated = await demoStartAnnulmentReview(startTarget.id, currentAccountId, actorName);
      toastMessage("success", `You're now reviewing ${updated.reference}.`);
      setShowStart(false);
      navigate(`/dashboard/crvs/annulment-review/${updated.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setConflictTarget(startTarget);
        setShowConflict(true);
        return;
      }
      toastMessage("error", err);
    }
  };

  const columns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "marriage", header: "Marriage", render: (r) => marriageReferenceLabel(r) },
    { key: "decision", header: "Decision number", render: (r) => r.decision.decisionNumber || "—" },
    { key: "status", header: "Status", render: (r) => <AnnulmentStatusPill kind="annulmentRegistration" status={r.status} /> },
    { key: "reviewer", header: "Reviewer", render: (r) => r.reviewerName || "Unassigned" },
    {
      key: "flags",
      header: "Flags",
      render: (r) => {
        const flags: string[] = [];
        if (r.decision.isForeign) flags.push("Foreign");
        if (r.exception?.status === "OPEN") flags.push("Exception");
        if (r.correctionRequests.some((c) => !c.resolvedAt)) flags.push("Open correction");
        return flags.length === 0 ? "—" : flags.join(", ");
      },
    },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        const sla = annulmentSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    { key: "updated", header: "Updated", render: (r) => formatDateTime(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const isMine = r.status === "UNDER_REVIEW" && r.reviewerId === currentAccountId;
        const canStartHere = canTransitionAnnulmentRegistration(r.status, "UNDER_REVIEW");
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isMine && <Button text="Continue review" size="sm" appearance="primary" type="button" onClick={() => navigate(`/dashboard/crvs/annulment-review/${r.id}`)} testId={`an-continue-review-${r.id}`} />}
            {!isMine && canStartHere && (
              <Button
                text="Start review"
                size="sm"
                appearance="primary"
                type="button"
                disabled={!canReview}
                onClick={() => handleStartClick(r)}
                testId={`an-start-review-${r.id}`}
              />
            )}
            <Button text="Open workspace" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/annulment-review/${r.id}`)} testId={`an-open-workspace-${r.id}`} />
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the annulment review queue" description="Reviewing marriage-annulment registrations requires annulment-registration-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage annulment review queue</h1>
        <p className="crvs-page-subtitle">Submitted marriage-annulment registrations awaiting Civil Registrar review, within your jurisdiction.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {!canReview && (
        <div className="crvs-banner crvs-banner-info">
          You have view-only access to this queue. Starting a review requires annulment-registration-review access.
        </div>
      )}

      <div className="crvs-tabs" role="tablist">
        {TAB_META.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`crvs-tab ${activeTab === tab.key ? "is-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
            <span className="review-tab-count">{tabRows[tab.key].length}</span>
          </button>
        ))}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={tabRows[activeTab]}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Nothing in this queue"
          emptyDescription="There are no annulment registrations matching this view right now."
          emptyIcon="inbox"
        />
      </div>

      <StartAnnulmentReviewModal show={showStart} onClose={() => setShowStart(false)} registration={startTarget} onConfirm={handleConfirmStart} />
      <ActiveAnnulmentReviewConflictModal show={showConflict} onClose={() => setShowConflict(false)} registration={conflictTarget} />
    </div>
  );
}
