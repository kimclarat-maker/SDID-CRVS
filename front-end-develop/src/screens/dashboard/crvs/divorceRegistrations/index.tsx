import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { DivorceRegistration, DivorceRegistrationStatus } from "@/domain/crvs/types";
import { divorceSlaState, formatDate, formatDateTime, formerSpousesLabel, marriageReferenceLabel } from "../divorceShared";
import BulkAssignDivorceModal from "./components/modals/BulkAssignDivorceModal";
import "../shared.css";

type TabKey =
  | "MY_DRAFTS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "JUDGMENT_VERIFICATION"
  | "FOREIGN_JUDGMENT_REVIEW"
  | "EXCEPTION_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REGISTERED";

const TAB_META: { key: TabKey; label: string; statuses: DivorceRegistrationStatus[] }[] = [
  { key: "MY_DRAFTS", label: "My drafts", statuses: ["DRAFT"] },
  { key: "SUBMITTED", label: "Submitted", statuses: ["SUBMITTED"] },
  { key: "UNDER_REVIEW", label: "Under review", statuses: ["UNDER_REVIEW"] },
  { key: "CORRECTION_REQUIRED", label: "Correction required", statuses: ["CORRECTION_REQUIRED"] },
  { key: "RESUBMITTED", label: "Resubmitted", statuses: ["RESUBMITTED"] },
  { key: "JUDGMENT_VERIFICATION", label: "Judgment verification", statuses: ["JUDGMENT_VERIFICATION"] },
  { key: "FOREIGN_JUDGMENT_REVIEW", label: "Foreign judgment review", statuses: ["FOREIGN_JUDGMENT_REVIEW"] },
  { key: "EXCEPTION_REVIEW", label: "Exception review", statuses: ["EXCEPTION_REVIEW"] },
  { key: "APPROVED", label: "Approved", statuses: ["APPROVED"] },
  { key: "REJECTED", label: "Rejected / cancelled", statuses: ["REJECTED", "CANCELLED"] },
  { key: "REGISTERED", label: "Registered", statuses: ["REGISTERED"] },
];

/**
 * Divorce-registrations queue: saved-view tabs plus bulk assignment only —
 * never bulk approval, rejection, registration or exception resolution, each
 * of which is a legal decision taken one case at a time.
 */
export default function DivorceRegistrationsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_EDIT);
  const canReassign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CASE_REASSIGN);

  const [activeTab, setActiveTab] = useState<TabKey>("SUBMITTED");
  const [registrations, setRegistrations] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
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
      const { data } = await demoListDivorceRegistrations({ limit: 500 });
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load divorce registrations.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const tabRows = useMemo(() => {
    const meta = TAB_META.find((t) => t.key === activeTab)!;
    let rows = registrations.filter((r) => meta.statuses.includes(r.status));
    if (activeTab === "MY_DRAFTS") rows = rows.filter((r) => r.officerId === currentAccountId);
    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (r) =>
          r.reference.toLowerCase().includes(term) ||
          r.judgment.courtCaseNumber.toLowerCase().includes(term) ||
          r.judgment.judgmentNumber.toLowerCase().includes(term) ||
          r.judgment.courtOrAuthorityName.toLowerCase().includes(term) ||
          marriageReferenceLabel(r).toLowerCase().includes(term) ||
          formerSpousesLabel(r).toLowerCase().includes(term) ||
          r.processingOffice.selectedProcessingOfficeName.toLowerCase().includes(term)
      );
    }
    return rows;
  }, [registrations, activeTab, currentAccountId, search]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: QueueColumn<DivorceRegistration>[] = [
    {
      key: "select",
      header: "",
      render: (r) =>
        canReassign ? (
          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} aria-label={`Select ${r.reference}`} data-testid={`dr-select-${r.id}`} />
        ) : null,
    },
    { key: "reference", header: "Registration reference", render: (r) => r.reference },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "marriage", header: "Marriage number", render: (r) => marriageReferenceLabel(r) },
    { key: "court", header: "Court", render: (r) => r.judgment.courtOrAuthorityName || "—" },
    { key: "judgment", header: "Judgment number", render: (r) => r.judgment.judgmentNumber || "—" },
    { key: "effective", header: "Effective date", render: (r) => formatDate(r.registrationEvent?.effectiveDate || r.judgment.registrationEffectiveDate) },
    { key: "office", header: "Processing office", render: (r) => r.processingOffice.selectedProcessingOfficeName },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="divorceRegistration" status={r.status} /> },
    { key: "officer", header: "Assigned officer", render: (r) => r.reviewerName || r.officerName || "Unassigned" },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        if (r.status === "REGISTERED" || r.status === "REJECTED" || r.status === "CANCELLED" || r.status === "DRAFT") return "—";
        const sla = divorceSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    { key: "updated", header: "Updated", render: (r) => formatDateTime(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const editableStatus = r.status === "DRAFT" || r.status === "CORRECTION_REQUIRED";
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}`)} testId={`dr-view-${r.id}`} />
            {editableStatus && (
              <Button
                text="Edit"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canEdit}
                onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}/edit`)}
                testId={`dr-edit-${r.id}`}
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
        <Empty icon="lock" title="You don't have access to divorce registrations" description="Viewing divorce registrations requires divorce-registration-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce registrations</h1>
        <p className="crvs-page-subtitle">Every divorce registration request, organized into saved views.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        {canCreate && <Button text="New divorce registration" appearance="primary" startIcon="add_circle" type="button" onClick={() => navigate("/dashboard/crvs/divorce-registrations/new")} testId="dr-new" />}
        {canReassign ? (
          <Button
            text={`Bulk assign${selected.size ? ` (${selected.size})` : ""}`}
            appearance="ghost"
            type="button"
            disabled={selected.size === 0}
            onClick={() => setShowBulkAssign(true)}
            testId="dr-bulk-assign"
          />
        ) : (
          <span className="crvs-form-hint">Bulk assignment requires divorce-case-reassign access.</span>
        )}
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="dr-search">Search this view</label>
          <input id="dr-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, judgment, marriage number, names, office…" data-testid="dr-search" />
        </div>
      </div>

      <div className="crvs-tabs" role="tablist">
        {TAB_META.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`crvs-tab ${activeTab === tab.key ? "is-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={tabRows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Nothing in this view"
          emptyDescription="There are no divorce registrations matching this saved view right now."
          emptyIcon="inbox"
        />
      </div>

      <BulkAssignDivorceModal
        show={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        registrationIds={Array.from(selected)}
        onAssigned={() => {
          setShowBulkAssign(false);
          setSelected(new Set());
          load();
        }}
      />
    </div>
  );
}
