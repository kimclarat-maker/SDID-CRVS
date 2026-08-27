import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { getDemoData } from "@/demo/storage/demoStore";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MARRIAGE_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../marriageShared";
import "../shared.css";

type AttentionRow = { app: MarriageApplication; reasons: string[] };

/** Marriage-workflow "home" dashboard: permission-filtered bucket tiles,
 * recent review decisions, an attention-required list (open exceptions /
 * pending objections / sync failures), and search — the
 * /dashboard/crvs/marriages landing page. Mirrors deaths/index.tsx's
 * tile-dashboard structure exactly. */
export default function MarriagesDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE);
  const canViewCorrections = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CORRECTION_REQUEST);
  const canViewAppointments = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW);
  const canViewCeremony = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW);
  const canViewExceptions = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW);
  const canViewObjections = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW) && marriagePolicyConfig.objection.enabled;
  const canViewSync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_VIEW);
  const canViewRegistered = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW);

  const db = getDemoData();
  const applications = db.crvsMarriageApplications;

  const counts = useMemo(
    () => ({
      draft: applications.filter((a) => a.status === "DRAFT").length,
      submitted: applications.filter((a) => a.status === "SUBMITTED" || a.status === "RESUBMITTED").length,
      partnerPending: applications.filter((a) => a.status === "PARTNER_VERIFICATION_REQUIRED").length,
      eligibilityReview: applications.filter((a) => a.status === "ELIGIBILITY_REVIEW").length,
      corrections: applications.filter((a) => a.status === "CORRECTION_REQUIRED").length,
      paymentPending: applications.filter((a) => a.status === "PAYMENT_PENDING").length,
      approved: applications.filter((a) => a.status === "APPROVED").length,
      appointments: applications.filter((a) => a.status === "APPOINTMENT_SCHEDULED").length,
      ceremonyReady: applications.filter((a) => a.status === "READY_FOR_CEREMONY").length,
      exceptionsObjections: applications.filter((a) => a.exception?.status === "OPEN" || a.objection?.status === "PENDING").length,
      awaitingSync: applications.filter((a) => a.status === "REGISTERED" && a.sdid.status !== "BOTH_IDENTITIES_UPDATED").length,
      syncFailures: applications.filter((a) => a.sdid.status === "PARTIAL_FAILURE" || a.sdid.status === "FAILED" || a.sdid.status === "MANUAL_REVIEW").length,
    }),
    [applications]
  );

  const recentDecisions = useMemo(
    () =>
      applications
        .flatMap((a) => a.reviewDecisions.map((d) => ({ ...d, reference: a.reference, applicationId: a.id })))
        .sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))
        .slice(0, 5),
    [applications]
  );

  const attentionItems = useMemo(() => {
    const map = new Map<string, AttentionRow>();
    const add = (app: MarriageApplication, reason: string) => {
      const entry = map.get(app.id) || { app, reasons: [] };
      entry.reasons.push(reason);
      map.set(app.id, entry);
    };
    applications.forEach((a) => {
      if (canViewExceptions && a.exception?.status === "OPEN") add(a, `Exception: ${a.exception.type.replace(/_/g, " ")}`);
      if (canViewObjections && a.objection?.status === "PENDING") add(a, "Objection pending");
      if (canViewSync && (a.sdid.status === "PARTIAL_FAILURE" || a.sdid.status === "FAILED" || a.sdid.status === "MANUAL_REVIEW")) {
        add(a, `Sync: ${MARRIAGE_SYNC_STATUS_LABELS[a.sdid.status]}`);
      }
    });
    return Array.from(map.values());
  }, [applications, canViewExceptions, canViewObjections, canViewSync]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return applications
      .filter(
        (a) =>
          a.reference.toLowerCase().includes(term) ||
          applicantDisplayName(a.applicant1).toLowerCase().includes(term) ||
          applicantDisplayName(a.applicant2).toLowerCase().includes(term) ||
          a.officeName.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [search, applications]);

  const searchColumns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "status", header: "Status", render: (a) => <StatusBadge kind="marriageApplication" status={a.status} /> },
    { key: "updated", header: "Updated", render: (a) => formatDateTime(a.updatedAt) },
    { key: "actions", header: "", render: (a) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId={`marriages-open-${a.id}`} /> },
  ];

  const attentionColumns: QueueColumn<AttentionRow>[] = [
    { key: "reference", header: "Reference", render: (r) => r.app.reference },
    { key: "applicants", header: "Applicants", render: (r) => `${applicantDisplayName(r.app.applicant1)} & ${applicantDisplayName(r.app.applicant2)}` },
    { key: "reasons", header: "Needs attention for", render: (r) => r.reasons.join("; ") },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="marriageApplication" status={r.app.status} /> },
    { key: "actions", header: "", render: (r) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${r.app.id}`)} testId={`marriages-attention-${r.app.id}`} /> },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the marriage workflow" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage registration</h1>
        <p className="crvs-page-subtitle">Declarations, eligibility review, appointments, ceremonies, registration, and SDID synchronization for the marriage workflow.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="marriages-search">Search by reference, applicant name, or office</label>
          <input id="marriages-search" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="marriages-dashboard-search" />
        </div>
      </div>

      {search.trim() && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Search results</h2>
          <CaseQueueTable rows={searchResults} columns={searchColumns} getRowKey={(a) => a.id} emptyTitle="No matches" emptyDescription="Try a different reference, name, or office." emptyIcon="search_off" />
        </div>
      )}

      <div className="crvs-tile-grid">
        <CardCount name="Draft declarations" count={counts.draft} icon="edit_note" color="var(--status-neutral)" onClick={() => navigate("/dashboard/crvs/marriage-applications")} />
        <CardCount name="Submitted applications" count={counts.submitted} icon="outgoing_mail" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/marriage-applications")} />
        <CardCount name="Partner responses pending" count={counts.partnerPending} icon="mark_email_unread" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/marriage-applications")} />
        <CardCount name="Eligibility reviews" count={counts.eligibilityReview} icon="fact_check" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/marriage-review")} />
        {canViewCorrections && <CardCount name="Corrections required" count={counts.corrections} icon="edit" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/marriage-corrections")} />}
        <CardCount name="Payment pending" count={counts.paymentPending} icon="payments" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/marriage-applications")} />
        <CardCount name="Approved applications" count={counts.approved} icon="check_circle" color="var(--status-success)" onClick={() => navigate("/dashboard/crvs/marriage-applications")} />
        {canViewAppointments && <CardCount name="Upcoming appointments" count={counts.appointments} icon="event" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/marriage-appointments")} />}
        {canViewCeremony && <CardCount name="Ready for ceremony" count={counts.ceremonyReady} icon="how_to_reg" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/marriage-ceremonies")} />}
        {(canViewExceptions || canViewObjections) && (
          <CardCount
            name="Exceptions / objections"
            count={counts.exceptionsObjections}
            icon="report"
            color="var(--status-warning)"
            onClick={() => navigate(canViewExceptions ? "/dashboard/crvs/marriage-exceptions" : "/dashboard/crvs/marriage-objections")}
          />
        )}
        {canViewRegistered && <CardCount name="Awaiting SDID sync" count={counts.awaitingSync} icon="sync" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/registered-marriages")} />}
        {canViewSync && <CardCount name="Synchronization failures" count={counts.syncFailures} icon="sync_problem" color="var(--status-danger)" onClick={() => navigate("/dashboard/crvs/marriage-sync-failures")} />}
      </div>

      <div className="crvs-filter-bar">
        {canCreate && <Button text="New marriage declaration" appearance="primary" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/marriage-applications/new")} testId="marriages-quick-new" />}
        <Button text="Marriage applications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-applications")} testId="marriages-quick-applications" />
        {canViewExceptions && <Button text="Exceptions" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-exceptions")} testId="marriages-quick-exceptions" />}
        {canViewObjections && <Button text="Objections" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-objections")} testId="marriages-quick-objections" />}
        {canViewRegistered && <Button text="Registered marriages" appearance="ghost" onClick={() => navigate("/dashboard/crvs/registered-marriages")} testId="marriages-quick-registered" />}
        {canViewAudit && <Button text="Audit history" appearance="ghost" onClick={() => navigate("/dashboard/crvs/marriage-audit")} testId="marriages-quick-audit" />}
      </div>

      {attentionItems.length > 0 && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Attention required</h2>
          <CaseQueueTable rows={attentionItems.slice(0, 10)} columns={attentionColumns} getRowKey={(r) => r.app.id} emptyTitle="Nothing needs attention" emptyIcon="task_alt" />
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Recent decisions</h2>
        <table className="crvs-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Decision</th>
              <th>By</th>
              <th>When</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {recentDecisions.length === 0 && (
              <tr>
                <td className="crvs-empty-row" colSpan={5}>
                  No review decisions recorded yet.
                </td>
              </tr>
            )}
            {recentDecisions.map((d, i) => (
              <tr key={`${d.applicationId}-${i}`}>
                <td>{d.reference}</td>
                <td>{d.type.replace(/_/g, " ")}</td>
                <td>{d.decidedBy}</td>
                <td>{formatDateTime(d.decidedAt)}</td>
                <td>{d.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
