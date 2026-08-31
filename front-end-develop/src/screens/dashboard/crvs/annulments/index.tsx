import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { getDemoData } from "@/demo/storage/demoStore";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { ANNULMENT_NOTIFICATION_STATUS_LABELS, ANNULMENT_SYNC_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { AnnulmentNotification, AnnulmentRegistration } from "@/domain/crvs/types";
import { ANNULMENT_EXCEPTION_TRIGGER_LABELS } from "@/domain/crvs/annulmentPolicyConfig";
import { affectedPartiesLabel, annulmentSlaState, formatDate, formatDateTime, marriageReferenceLabel } from "../annulmentShared";
import "../shared.css";
// review.css owns .review-audit-list / .review-audit-item, which this page
// reuses for its recent-audit feed, exactly like divorces/index.tsx does.
import "../review/review.css";

type AttentionRow = { registration: AnnulmentRegistration; reasons: string[] };

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/**
 * Marriage-annulment workflow "home" dashboard (the /dashboard/crvs/annulments
 * landing page): permission-filtered bucket tiles, my assigned cases,
 * urgent/SLA cases, recent registrations, court-notification status, quick
 * actions, recent audit events, and cross-field search. Mirrors
 * divorces/index.tsx's tile-dashboard structure exactly, adapted to the
 * two-affected-party annulment entity set (spec §1: this module only ever
 * REGISTERS an annulment decision a competent court has already made).
 */
export default function AnnulmentsDashboard() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const [search, setSearch] = useState("");
  const [auditEvents, setAuditEvents] = useState<DemoAuditEvent[]>([]);

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE);
  const canViewNotifications = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_VIEW);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW);
  const canViewCorrections = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_CORRECTION_REQUEST);
  const canVerifyDecision = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_ORDER_VERIFY);
  const canClassifyLegalEffect = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY);
  const canViewForeign = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_FOREIGN_DECISION_REVIEW);
  const canViewExceptions = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EXCEPTIONS_VIEW);
  const canViewRegistered = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTERED_VIEW);
  const canViewSync = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_SDID_SYNC_VIEW);
  const canViewAudit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_AUDIT_VIEW);

  const db = getDemoData();
  const registrations = db.crvsAnnulmentRegistrations;
  const notifications = db.crvsAnnulmentNotifications;

  useEffect(() => {
    if (!canViewAudit) return;
    let cancelled = false;
    demoListCrvsAuditEvents({ limit: 200 }).then((res) => {
      if (cancelled) return;
      setAuditEvents(res.data.filter((e) => e.module.startsWith("crvs.annulment")).slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [canViewAudit]);

  const counts = useMemo(
    () => ({
      newCourtNotifications: notifications.filter((n) => n.status === "RECEIVED" || n.status === "VALIDATION_PENDING").length,
      applicantSubmissions: registrations.filter((r) => (r.status === "SUBMITTED" || r.status === "RESUBMITTED") && r.source !== "COURT_NOTIFICATION").length,
      awaitingReview: registrations.filter((r) => r.status === "SUBMITTED" || r.status === "RESUBMITTED" || r.status === "UNDER_REVIEW").length,
      decisionVerification: registrations.filter((r) => r.status === "DECISION_VERIFICATION").length,
      legalEffectReview: registrations.filter((r) => r.status === "LEGAL_EFFECT_REVIEW").length,
      corrections: registrations.filter((r) => r.status === "CORRECTION_REQUIRED").length,
      foreignReview: registrations.filter((r) => r.status === "FOREIGN_DECISION_REVIEW").length,
      exceptions: registrations.filter((r) => r.exception?.status === "OPEN").length,
      approved: registrations.filter((r) => r.status === "APPROVED").length,
      registeredToday: registrations.filter((r) => r.status === "REGISTERED" && isToday(r.registeredAt)).length,
      syncFailures: registrations.filter((r) => r.sdid.status === "PARTIAL_FAILURE" || r.sdid.status === "FAILED" || r.sdid.status === "MANUAL_REVIEW").length,
    }),
    [registrations, notifications]
  );

  const myCases = useMemo(
    () =>
      registrations.filter(
        (r) => !!currentAccountId && (r.reviewerId === currentAccountId || r.officerId === currentAccountId) && r.status !== "REGISTERED" && r.status !== "REJECTED" && r.status !== "CANCELLED"
      ),
    [registrations, currentAccountId]
  );

  const urgentCases = useMemo(() => {
    const map = new Map<string, AttentionRow>();
    const add = (registration: AnnulmentRegistration, reason: string) => {
      const entry = map.get(registration.id) || { registration, reasons: [] };
      entry.reasons.push(reason);
      map.set(registration.id, entry);
    };
    registrations.forEach((r) => {
      if (r.status === "REGISTERED" || r.status === "REJECTED" || r.status === "CANCELLED") {
        // A registered case can still carry a sync failure worth surfacing.
        if (canViewSync && (r.sdid.status === "PARTIAL_FAILURE" || r.sdid.status === "FAILED" || r.sdid.status === "MANUAL_REVIEW")) {
          add(r, `Synchronization: ${ANNULMENT_SYNC_STATUS_LABELS[r.sdid.status]}`);
        }
        return;
      }
      if (canViewExceptions && r.exception?.status === "OPEN") add(r, `Exception: ${ANNULMENT_EXCEPTION_TRIGGER_LABELS[r.exception.type]}`);
      if (canViewForeign && r.status === "FOREIGN_DECISION_REVIEW") add(r, "Foreign decision awaiting review");
      if (canClassifyLegalEffect && r.status === "LEGAL_EFFECT_REVIEW") add(r, "Legal-effect classification pending");
      const sla = annulmentSlaState(r);
      if (sla.breached) add(r, `SLA ${sla.label}`);
      if (canViewSync && (r.sdid.status === "PARTIAL_FAILURE" || r.sdid.status === "FAILED" || r.sdid.status === "MANUAL_REVIEW")) {
        add(r, `Synchronization: ${ANNULMENT_SYNC_STATUS_LABELS[r.sdid.status]}`);
      }
    });
    return Array.from(map.values());
  }, [registrations, canViewExceptions, canViewForeign, canViewSync, canClassifyLegalEffect]);

  const recentRegistrations = useMemo(
    () =>
      registrations
        .filter((r) => r.status === "REGISTERED")
        .sort((a, b) => ((a.registeredAt || "") < (b.registeredAt || "") ? 1 : -1))
        .slice(0, 5),
    [registrations]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return registrations
      .filter(
        (r) =>
          r.reference.toLowerCase().includes(term) ||
          r.decision.courtCaseNumber.toLowerCase().includes(term) ||
          r.decision.decisionNumber.toLowerCase().includes(term) ||
          r.decision.courtOrAuthorityName.toLowerCase().includes(term) ||
          marriageReferenceLabel(r).toLowerCase().includes(term) ||
          affectedPartiesLabel(r).toLowerCase().includes(term) ||
          (r.affectedParty1.nin || "").toLowerCase().includes(term) ||
          (r.affectedParty2.nin || "").toLowerCase().includes(term) ||
          r.processingOffice.selectedProcessingOfficeName.toLowerCase().includes(term) ||
          r.status.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [search, registrations]);

  const searchColumns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "decision", header: "Decision number", render: (r) => r.decision.decisionNumber || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="annulmentRegistration" status={r.status} /> },
    { key: "updated", header: "Updated", render: (r) => formatDateTime(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/annulment-registrations/${r.id}`)} testId={`annulments-open-${r.id}`} />,
    },
  ];

  const myCaseColumns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="annulmentRegistration" status={r.status} /> },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        const sla = annulmentSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/annulment-registrations/${r.id}`)} testId={`annulments-mycase-${r.id}`} />,
    },
  ];

  const urgentColumns: QueueColumn<AttentionRow>[] = [
    { key: "reference", header: "Reference", render: (row) => row.registration.reference },
    { key: "parties", header: "Affected persons", render: (row) => affectedPartiesLabel(row.registration) },
    { key: "reasons", header: "Needs attention for", render: (row) => row.reasons.join("; ") },
    { key: "status", header: "Status", render: (row) => <StatusBadge kind="annulmentRegistration" status={row.registration.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/annulment-registrations/${row.registration.id}`)} testId={`annulments-urgent-${row.registration.id}`} />,
    },
  ];

  const registeredColumns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "regNumber", header: "Registration number", render: (r) => r.registrationEvent?.registrationNumber || "—" },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "effective", header: "Effective date", render: (r) => formatDate(r.registrationEvent?.effectiveDate) },
    { key: "sync", header: "SDID sync", render: (r) => <StatusBadge kind="annulmentSync" status={r.sdid.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/registered-annulments/${r.id}`)} testId={`annulments-registered-${r.id}`} />,
    },
  ];

  const notificationColumns: QueueColumn<AnnulmentNotification>[] = [
    { key: "reference", header: "Notification", render: (n) => n.reference },
    { key: "court", header: "Court", render: (n) => n.courtName },
    { key: "case", header: "Court case number", render: (n) => n.courtCaseNumber },
    { key: "status", header: "Status", render: (n) => <StatusBadge kind="annulmentNotification" status={n.status} /> },
    { key: "notified", header: "Notified", render: (n) => formatDateTime(n.notifiedAt) },
    {
      key: "actions",
      header: "",
      render: (n) => <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/annulment-notifications/${n.id}`)} testId={`annulments-notification-${n.id}`} />,
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to the marriage-annulment workflow" description="Viewing annulment registrations requires annulment-registration-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage annulment registration</h1>
        <p className="crvs-page-subtitle">
          Court notifications, registration requests, review, decision verification, legal-effect classification, foreign-decision recognition, registration, and SDID synchronization for the
          marriage-annulment workflow. This module registers an annulment a competent court or legally recognized authority has already decided — it never starts proceedings or decides one itself.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 260 }}>
          <label htmlFor="annulments-search">Search by annulment reference, court case number, decision number, marriage number, NIN, person name, office, or status</label>
          <input id="annulments-search" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="annulments-dashboard-search" />
        </div>
      </div>

      {search.trim() && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Search results</h2>
          <CaseQueueTable rows={searchResults} columns={searchColumns} getRowKey={(r) => r.id} emptyTitle="No matches" emptyDescription="Try a different reference, decision number, name, or office." emptyIcon="search_off" />
        </div>
      )}

      <div className="crvs-tile-grid">
        {canViewNotifications && (
          <CardCount name="New court notifications" count={counts.newCourtNotifications} icon="gavel" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/annulment-notifications")} />
        )}
        <CardCount name="Applicant submissions" count={counts.applicantSubmissions} icon="outgoing_mail" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} />
        {canReview && <CardCount name="Awaiting review" count={counts.awaitingReview} icon="fact_check" color="var(--status-info)" onClick={() => navigate("/dashboard/crvs/annulment-review")} />}
        {canVerifyDecision && (
          <CardCount name="Decision verification pending" count={counts.decisionVerification} icon="verified_user" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} />
        )}
        {canClassifyLegalEffect && (
          <CardCount name="Legal-effect reviews" count={counts.legalEffectReview} icon="balance" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} />
        )}
        {canViewCorrections && <CardCount name="Corrections / evidence required" count={counts.corrections} icon="edit" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/annulment-corrections")} />}
        {canViewForeign && <CardCount name="Foreign decisions awaiting review" count={counts.foreignReview} icon="public" color="var(--status-warning)" onClick={() => navigate("/dashboard/crvs/foreign-annulments")} />}
        {canViewExceptions && <CardCount name="Exceptions" count={counts.exceptions} icon="report" color="var(--status-danger)" onClick={() => navigate("/dashboard/crvs/annulment-exceptions")} />}
        <CardCount name="Approved — awaiting registration" count={counts.approved} icon="check_circle" color="var(--status-success)" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} />
        {canViewRegistered && <CardCount name="Registered today" count={counts.registeredToday} icon="verified" color="var(--status-success)" onClick={() => navigate("/dashboard/crvs/registered-annulments")} />}
        {canViewSync && <CardCount name="SDID sync failures" count={counts.syncFailures} icon="sync_problem" color="var(--status-danger)" onClick={() => navigate("/dashboard/crvs/annulment-sync-failures")} />}
      </div>

      <div className="crvs-filter-bar">
        {canCreate && <Button text="New annulment registration" appearance="primary" startIcon="add_circle" type="button" onClick={() => navigate("/dashboard/crvs/annulment-registrations/new")} testId="annulments-quick-new" />}
        <Button text="Annulment registrations" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-registrations")} testId="annulments-quick-registrations" />
        {canViewNotifications && <Button text="Court notifications" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-notifications")} testId="annulments-quick-notifications" />}
        {canReview && <Button text="Review queue" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-review")} testId="annulments-quick-review" />}
        {canViewExceptions && <Button text="Exceptions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-exceptions")} testId="annulments-quick-exceptions" />}
        {canViewForeign && <Button text="Foreign decisions" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/foreign-annulments")} testId="annulments-quick-foreign" />}
        {canViewRegistered && <Button text="Registered annulments" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/registered-annulments")} testId="annulments-quick-registered" />}
        {canViewAudit && <Button text="Audit history" appearance="ghost" type="button" onClick={() => navigate("/dashboard/crvs/annulment-audit")} testId="annulments-quick-audit" />}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">My assigned cases</h2>
        <CaseQueueTable
          rows={myCases.slice(0, 10)}
          columns={myCaseColumns}
          getRowKey={(r) => r.id}
          emptyTitle="No cases assigned to you"
          emptyDescription="Cases you prepare or start reviewing appear here."
          emptyIcon="assignment_ind"
        />
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Urgent cases and SLA warnings</h2>
        <CaseQueueTable
          rows={urgentCases.slice(0, 10)}
          columns={urgentColumns}
          getRowKey={(row) => row.registration.id}
          emptyTitle="Nothing urgent right now"
          emptyDescription="No annulment case is past its configured SLA, blocked by an exception, or failing synchronization."
          emptyIcon="task_alt"
        />
      </div>

      {canViewNotifications && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Court-notification status</h2>
          <p className="crvs-form-hint" style={{ marginBottom: 8 }}>
            {notifications.length} notification(s) on record ·{" "}
            {(Object.keys(ANNULMENT_NOTIFICATION_STATUS_LABELS) as (keyof typeof ANNULMENT_NOTIFICATION_STATUS_LABELS)[])
              .map((key) => `${ANNULMENT_NOTIFICATION_STATUS_LABELS[key]}: ${notifications.filter((n) => n.status === key).length}`)
              .join(" · ")}
          </p>
          <CaseQueueTable
            rows={notifications.slice(0, 5)}
            columns={notificationColumns}
            getRowKey={(n) => n.id}
            emptyTitle="No court notifications yet"
            emptyDescription="Simulated court notifications appear here once received."
            emptyIcon="gavel"
          />
        </div>
      )}

      {canViewRegistered && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Recent registrations</h2>
          <CaseQueueTable
            rows={recentRegistrations}
            columns={registeredColumns}
            getRowKey={(r) => r.id}
            emptyTitle="No annulments registered yet"
            emptyDescription="Approved cases appear here once a Civil Registrar completes registration."
            emptyIcon="verified"
          />
        </div>
      )}

      {canViewAudit && (
        <div className="crvs-section">
          <h2 className="crvs-section-title">Recent audit events</h2>
          {auditEvents.length === 0 ? (
            <p className="crvs-form-hint">No annulment audit activity recorded yet.</p>
          ) : (
            <div className="review-audit-list">
              {auditEvents.map((ev) => (
                <div key={ev.id} className="review-audit-item">
                  <strong>{ev.actor}</strong> {ev.action} on {ev.targetRef} — {formatDateTime(ev.at)}
                  {ev.details && <div className="crvs-form-hint">{ev.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
