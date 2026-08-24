import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../shared.css";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { demoListDeathRegistrations, demoStartDeathReview, allMandatoryDeathSectionsReviewed } from "@/demo/services/crvsDeathRegistrations";
import { canTransitionDeathRegistration } from "@/domain/crvs/statusMachines";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import { deceasedDisplayName, formatDateTime } from "../deathShared";
import StartDeathReviewModal from "./components/modals/StartDeathReviewModal";
import ActiveDeathReviewConflictModal from "./components/modals/ActiveDeathReviewConflictModal";

type TabKey = "UNASSIGNED" | "ASSIGNED_TO_ME" | "RESUBMITTED" | "EXCEPTIONS" | "READY_FOR_DECISION";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED_TO_ME", label: "Assigned to me" },
  { key: "RESUBMITTED", label: "Resubmitted" },
  { key: "EXCEPTIONS", label: "Late / medico-legal / unidentified" },
  { key: "READY_FOR_DECISION", label: "Ready for decision" },
];

export default function DeathReviewQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW);

  const [activeTab, setActiveTab] = useState<TabKey>("UNASSIGNED");
  const [cases, setCases] = useState<DeathRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [startCase, setStartCase] = useState<DeathRegistrationCase | undefined>();
  const [showStart, setShowStart] = useState(false);
  const [conflictCase, setConflictCase] = useState<DeathRegistrationCase | undefined>();
  const [showConflict, setShowConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDeathRegistrations({ limit: 500 });
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the death review queue.");
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
    const exceptions = cases.filter((c) => ["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"].includes(c.status));
    const readyForDecision = assignedToMe.filter((c) => allMandatoryDeathSectionsReviewed(c));
    return { UNASSIGNED: unassigned, ASSIGNED_TO_ME: assignedToMe, RESUBMITTED: resubmitted, EXCEPTIONS: exceptions, READY_FOR_DECISION: readyForDecision } satisfies Record<TabKey, DeathRegistrationCase[]>;
  }, [cases, currentAccountId]);

  const handleStartClick = (deathCase: DeathRegistrationCase) => {
    if (deathCase.reviewerId && deathCase.reviewerId !== currentAccountId) {
      setConflictCase(deathCase);
      setShowConflict(true);
      return;
    }
    setStartCase(deathCase);
    setShowStart(true);
  };

  const handleConfirmStart = async () => {
    if (!startCase || !currentAccountId) return;
    try {
      const updated = demoStartDeathReview(startCase.id, currentAccountId, actorName);
      toastMessage("success", `You're now reviewing ${updated.reference}.`);
      navigate(`/dashboard/crvs/death-review/${updated.id}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("already being reviewed")) {
        setShowStart(false);
        setConflictCase(startCase);
        setShowConflict(true);
        return;
      }
      toastMessage("error", err);
    }
  };

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "pathway", header: "Pathway", render: (c) => c.pathway.replace(/_/g, " ") },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="deathRegistration" status={c.status} /> },
    { key: "reviewer", header: "Reviewer", render: (c) => c.reviewerName || "Unassigned" },
    { key: "updated", header: "Updated", render: (c) => formatDateTime(c.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (c) => {
        const isMine = c.status === "UNDER_REVIEW" && c.reviewerId === currentAccountId;
        const canGoUnderReview = canTransitionDeathRegistration(c.status, "UNDER_REVIEW");
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isMine && <Button text="Continue review" size="sm" appearance="primary" onClick={() => navigate(`/dashboard/crvs/death-review/${c.id}`)} testId={`continue-death-review-${c.id}`} />}
            {!isMine && canGoUnderReview && canReview && (
              <Button text="Start review" size="sm" appearance="primary" onClick={() => handleStartClick(c)} testId={`start-death-review-${c.id}`} />
            )}
            <Button text="Preview" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}`)} testId={`preview-death-case-${c.id}`} />
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the death review queue" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death review queue</h1>
        <p className="crvs-page-subtitle">Submitted death registrations awaiting Civil Registrar review, within your jurisdiction.</p>
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
        <CaseQueueTable rows={tabRows[activeTab]} columns={columns} getRowKey={(c) => c.id} loading={loading} error={error} onRetry={load} emptyTitle="Nothing in this queue" emptyDescription="There are no cases matching this view right now." emptyIcon="inbox" />
      </div>

      <StartDeathReviewModal show={showStart} onClose={() => setShowStart(false)} deathCase={startCase} onConfirm={handleConfirmStart} />
      <ActiveDeathReviewConflictModal show={showConflict} onClose={() => setShowConflict(false)} deathCase={conflictCase} />
    </div>
  );
}
