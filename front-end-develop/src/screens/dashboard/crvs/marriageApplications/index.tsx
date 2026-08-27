import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication, MarriageApplicationStatus } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../marriageShared";
import BulkAssignModal from "./components/modals/BulkAssignModal";
import "../shared.css";

type TabKey = "MY_DRAFTS" | "PARTNER_PENDING" | "SUBMITTED" | "ELIGIBILITY_REVIEW" | "CORRECTIONS" | "PAYMENT" | "APPROVED" | "APPOINTMENTS" | "CEREMONY" | "REJECTED" | "REGISTERED";

const TAB_META: { key: TabKey; label: string; statuses: MarriageApplicationStatus[] }[] = [
  { key: "MY_DRAFTS", label: "My drafts", statuses: ["DRAFT"] },
  { key: "PARTNER_PENDING", label: "Partner response pending", statuses: ["PARTNER_VERIFICATION_REQUIRED"] },
  { key: "SUBMITTED", label: "Submitted", statuses: ["SUBMITTED", "RESUBMITTED"] },
  { key: "ELIGIBILITY_REVIEW", label: "Eligibility review", statuses: ["ELIGIBILITY_REVIEW"] },
  { key: "CORRECTIONS", label: "Corrections required", statuses: ["CORRECTION_REQUIRED"] },
  { key: "PAYMENT", label: "Payment", statuses: ["PAYMENT_PENDING", "PAID"] },
  { key: "APPROVED", label: "Approved", statuses: ["APPROVED"] },
  { key: "APPOINTMENTS", label: "Appointment scheduled", statuses: ["APPOINTMENT_SCHEDULED"] },
  { key: "CEREMONY", label: "Ceremony", statuses: ["READY_FOR_CEREMONY", "CEREMONY_COMPLETED", "NO_SHOW", "POSTPONED"] },
  { key: "REJECTED", label: "Rejected / cancelled", statuses: ["REJECTED", "CANCELLED"] },
  { key: "REGISTERED", label: "Registered", statuses: ["REGISTERED"] },
];

/** Marriage-applications queue (spec §7): saved-view tabs, bulk assignment
 * only — never bulk approve/reject/register (spec §7 "allow bulk assignment
 * but never bulk approval, rejection, ceremony completion, or registration"). */
export default function MarriageApplicationsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW);
  const canReassign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CASE_REASSIGN);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE);

  const [activeTab, setActiveTab] = useState<TabKey>("SUBMITTED");
  const [applications, setApplications] = useState<MarriageApplication[]>([]);
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
      const { data } = await demoListMarriageApplications({ limit: 500 });
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage applications.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const tabRows = useMemo(() => {
    const meta = TAB_META.find((t) => t.key === activeTab)!;
    let rows = applications.filter((a) => meta.statuses.includes(a.status));
    if (activeTab === "MY_DRAFTS") rows = rows.filter((a) => a.officerId === currentAccountId);
    return rows;
  }, [applications, activeTab, currentAccountId]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: QueueColumn<MarriageApplication>[] = [
    {
      key: "select",
      header: "",
      render: (a) =>
        canReassign ? (
          <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelected(a.id)} aria-label={`Select ${a.reference}`} data-testid={`select-${a.id}`} />
        ) : null,
    },
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "proposedDate", header: "Proposed date", render: (a) => a.proposedMarriageDate?.slice(0, 10) || "—" },
    { key: "office", header: "Office", render: (a) => a.officeName },
    { key: "eligibility", header: "Eligibility", render: (a) => a.eligibility?.overallOutcome || "Not checked" },
    { key: "payment", header: "Payment", render: (a) => a.payment.status.replace(/_/g, " ") },
    { key: "status", header: "Status", render: (a) => <StatusBadge kind="marriageApplication" status={a.status} /> },
    { key: "officer", header: "Assigned to", render: (a) => a.reviewerName || a.officerName || "Unassigned" },
    { key: "updated", header: "Updated", render: (a) => formatDateTime(a.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId={`mr-view-${a.id}`} />
          {(a.status === "DRAFT" || a.status === "CORRECTION_REQUIRED") && a.officerId === currentAccountId && (
            <Button text="Edit" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}/edit`)} testId={`mr-edit-${a.id}`} />
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage applications" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage applications</h1>
        <p className="crvs-page-subtitle">Every marriage declaration, organized into saved views.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        {canCreate && <Button text="New marriage declaration" appearance="primary" startIcon="add_circle" type="button" onClick={() => navigate("/dashboard/crvs/marriage-applications/new")} testId="mr-new" />}
        {canReassign && (
          <Button
            text={`Bulk assign${selected.size ? ` (${selected.size})` : ""}`}
            appearance="ghost"
            type="button"
            disabled={selected.size === 0}
            onClick={() => setShowBulkAssign(true)}
            testId="mr-bulk-assign"
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
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Nothing in this view"
          emptyDescription="There are no applications matching this saved view right now."
          emptyIcon="inbox"
        />
      </div>

      <BulkAssignModal
        show={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        applicationIds={Array.from(selected)}
        onAssigned={() => {
          setShowBulkAssign(false);
          setSelected(new Set());
          load();
        }}
      />
    </div>
  );
}
