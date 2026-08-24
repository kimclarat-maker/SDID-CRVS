import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { demoListDeathRegistrations } from "@/demo/services/crvsDeathRegistrations";
import { DeathRegistrationCase, DeathRegistrationStatus } from "@/domain/crvs/types";
import { deceasedDisplayName, formatDateTime } from "../deathShared";
import BulkAssignModal from "./components/modals/BulkAssignModal";
import "../shared.css";

type TabKey = "MY_DRAFTS" | "SUBMITTED" | "UNDER_REVIEW" | "CORRECTIONS" | "RESUBMITTED" | "EXCEPTIONS" | "APPROVED" | "REJECTED" | "REGISTERED";

const TAB_META: { key: TabKey; label: string; statuses: DeathRegistrationStatus[] }[] = [
  { key: "MY_DRAFTS", label: "My drafts", statuses: ["DRAFT"] },
  { key: "SUBMITTED", label: "Submitted", statuses: ["SUBMITTED"] },
  { key: "UNDER_REVIEW", label: "Under review", statuses: ["UNDER_REVIEW"] },
  { key: "CORRECTIONS", label: "Corrections required", statuses: ["CORRECTION_REQUIRED"] },
  { key: "RESUBMITTED", label: "Resubmitted", statuses: ["RESUBMITTED"] },
  { key: "EXCEPTIONS", label: "Exception review", statuses: ["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"] },
  { key: "APPROVED", label: "Approved", statuses: ["APPROVED"] },
  { key: "REJECTED", label: "Rejected", statuses: ["REJECTED"] },
  { key: "REGISTERED", label: "Registered", statuses: ["REGISTERED"] },
];

/** Death-registration queue (spec §6): saved-view tabs, bulk assignment
 * only (no bulk approve/reject). */
export default function DeathRegistrationsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW);
  const canReassign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CASE_REASSIGN);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE);

  const [activeTab, setActiveTab] = useState<TabKey>("SUBMITTED");
  const [cases, setCases] = useState<DeathRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDeathRegistrations({ limit: 500 });
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load death registrations.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const tabRows = useMemo(() => {
    const meta = TAB_META.find((t) => t.key === activeTab)!;
    let rows = cases.filter((c) => meta.statuses.includes(c.status));
    if (activeTab === "MY_DRAFTS") rows = rows.filter((c) => c.officerId === currentAccountId);
    return rows;
  }, [cases, activeTab, currentAccountId]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: QueueColumn<DeathRegistrationCase>[] = [
    {
      key: "select",
      header: "",
      render: (c) =>
        canReassign ? (
          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelected(c.id)} aria-label={`Select ${c.reference}`} data-testid={`select-${c.id}`} />
        ) : null,
    },
    { key: "reference", header: "Reference", render: (c) => c.reference },
    { key: "deceased", header: "Deceased", render: (c) => deceasedDisplayName(c.deceased) },
    { key: "pathway", header: "Pathway", render: (c) => c.pathway.replace(/_/g, " ") },
    { key: "jurisdiction", header: "Jurisdiction", render: (c) => c.jurisdiction },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="deathRegistration" status={c.status} /> },
    { key: "reviewer", header: "Assigned to", render: (c) => c.reviewerName || c.officerName || "Unassigned" },
    { key: "updated", header: "Updated", render: (c) => formatDateTime(c.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}`)} testId={`dr-view-${c.id}`} />
          {(c.status === "DRAFT" || c.status === "CORRECTION_REQUIRED") && c.officerId === currentAccountId && (
            <Button text="Edit" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/death-registrations/${c.id}/edit`)} testId={`dr-edit-${c.id}`} />
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to death registrations" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Death registrations</h1>
        <p className="crvs-page-subtitle">Every death-registration case, organized into saved views.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        {canCreate && <Button text="New death registration" appearance="primary" startIcon="add_circle" type="button" onClick={() => navigate("/dashboard/crvs/death-registrations/new")} testId="dr-new" />}
        {canReassign && (
          <Button
            text={`Bulk assign${selected.size ? ` (${selected.size})` : ""}`}
            appearance="ghost"
            type="button"
            disabled={selected.size === 0}
            onClick={() => setShowBulkAssign(true)}
            testId="dr-bulk-assign"
          />
        )}
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
          </button>
        ))}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={tabRows}
          columns={columns}
          getRowKey={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Nothing in this view"
          emptyDescription="There are no cases matching this saved view right now."
          emptyIcon="inbox"
        />
      </div>

      <BulkAssignModal
        show={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        caseIds={Array.from(selected)}
        onAssigned={() => {
          setShowBulkAssign(false);
          setSelected(new Set());
          load();
        }}
      />
    </div>
  );
}
