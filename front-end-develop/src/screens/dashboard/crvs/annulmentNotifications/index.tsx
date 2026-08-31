import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoListAnnulmentNotifications } from "@/demo/services/crvsAnnulmentNotifications";
import { ANNULMENT_NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { AnnulmentNotification, AnnulmentNotificationStatus, AnnulmentExistingMarriageMatchStatus } from "@/domain/crvs/types";
import { annulmentNotificationSlaState, EXISTING_MARRIAGE_MATCH_LABELS, formatDate } from "../annulmentShared";
import SimulateCourtAnnulmentNotificationModal from "./components/modals/SimulateCourtAnnulmentNotificationModal";
import {
  AssignAnnulmentNotificationModal,
  ConvertAnnulmentNotificationModal,
  EscalateAnnulmentNotificationModal,
  MarkAnnulmentNotificationDuplicateModal,
  ReturnAnnulmentNotificationModal,
  ValidateAnnulmentNotificationModal,
} from "./components/modals/AnnulmentNotificationActionModals";
import { DEMO_ANNULMENT_OFFICE_ID, DEMO_ANNULMENT_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import "../shared.css";

type ActionKind = "ASSIGN" | "VALIDATE" | "RETURN" | "DUPLICATE" | "CONVERT" | "ESCALATE";
type AssignmentFilter = "" | "ME" | "UNASSIGNED" | "OTHERS";

/**
 * Court-notification queue for marriage annulments (mirrors
 * DivorceNotificationsQueue exactly). Deliberately has no bulk actions: every
 * notification is validated, returned, marked duplicate or converted one at a
 * time. "Simulate court notification" stands in for the mock court
 * integration, since there is no inbound API in this demo.
 */
export default function AnnulmentNotificationsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_CREATE);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_EDIT);
  const canValidate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_VALIDATE);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_RETURN);
  const canMarkDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_MARK_DUPLICATE);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_NOTIFICATION_CONVERT);

  const [notifications, setNotifications] = useState<AnnulmentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [search, setSearch] = useState("");
  const [courtFilter, setCourtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnnulmentNotificationStatus | "">("");
  const [matchFilter, setMatchFilter] = useState<AnnulmentExistingMarriageMatchStatus | "">("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showSimulate, setShowSimulate] = useState(false);
  const [action, setAction] = useState<{ kind: ActionKind; notification: AnnulmentNotification } | undefined>();

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListAnnulmentNotifications({ limit: 500 });
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load court notifications.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const courts = useMemo(() => Array.from(new Set(notifications.map((n) => n.courtName))).sort(), [notifications]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((n) => {
      if (term && ![n.reference, n.courtCaseNumber, n.decisionNumber, n.applicantNamesAsReported, n.courtName].some((v) => v.toLowerCase().includes(term))) return false;
      if (courtFilter && n.courtName !== courtFilter) return false;
      if (statusFilter && n.status !== statusFilter) return false;
      if (matchFilter && n.marriageMatch.status !== matchFilter) return false;
      if (duplicatesOnly && !n.duplicateWarning) return false;
      if (dateFrom && n.notifiedAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && n.notifiedAt.slice(0, 10) > dateTo) return false;
      if (assignmentFilter === "ME" && n.assignedOfficerId !== currentAccountId) return false;
      if (assignmentFilter === "UNASSIGNED" && !!n.assignedOfficerId) return false;
      if (assignmentFilter === "OTHERS" && (!n.assignedOfficerId || n.assignedOfficerId === currentAccountId)) return false;
      return true;
    });
  }, [notifications, search, courtFilter, statusFilter, matchFilter, assignmentFilter, duplicatesOnly, dateFrom, dateTo, currentAccountId]);

  const applyUpdated = (updated: AnnulmentNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setAction(undefined);
  };

  const columns: QueueColumn<AnnulmentNotification>[] = [
    {
      key: "reference",
      header: "Notification reference",
      render: (n) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {n.reference}
          {n.duplicateWarning && (
            <span className="crvs-status-pill crvs-status-warning crvs-status-icon-label" title="A notification with the same court case or decision number already exists">
              <Icon name="content_copy" />
              Possible duplicate
            </span>
          )}
        </span>
      ),
    },
    { key: "court", header: "Court / authority", render: (n) => n.courtName },
    { key: "case", header: "Court case number", render: (n) => n.courtCaseNumber },
    { key: "decision", header: "Decision number", render: (n) => n.decisionNumber },
    { key: "parties", header: "Affected persons", render: (n) => n.applicantNamesAsReported },
    { key: "match", header: "Marriage match", render: (n) => EXISTING_MARRIAGE_MATCH_LABELS[n.marriageMatch.status] },
    { key: "notified", header: "Notification date", render: (n) => formatDate(n.notifiedAt) },
    { key: "status", header: "Validation status", render: (n) => <StatusBadge kind="annulmentNotification" status={n.status} /> },
    { key: "assigned", header: "Assigned officer", render: (n) => n.assignedOfficerName || "Unassigned" },
    {
      key: "sla",
      header: "SLA",
      render: (n) => {
        if (n.status === "CONVERTED_TO_REGISTRATION" || n.status === "DUPLICATE" || n.status === "CANCELLED") return "—";
        const sla = annulmentNotificationSlaState(n.notifiedAt);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (n) => {
        const open = n.status !== "CONVERTED_TO_REGISTRATION" && n.status !== "DUPLICATE" && n.status !== "CANCELLED";
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/annulment-notifications/${n.id}`)} testId={`an-notif-view-${n.id}`} />
            {open && (
              <Button
                text="Assign"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canEdit}
                styles={!canEdit ? { cursor: "not-allowed" } : undefined}
                onClick={() => setAction({ kind: "ASSIGN", notification: n })}
                testId={`an-notif-assign-${n.id}`}
              />
            )}
            {open && (n.status === "RECEIVED" || n.status === "RETURNED") && (
              <Button text="Validate" size="sm" appearance="primary" type="button" disabled={!canValidate} onClick={() => setAction({ kind: "VALIDATE", notification: n })} testId={`an-notif-validate-${n.id}`} />
            )}
            {open && n.status === "VALIDATION_PENDING" && (
              <Button text="Return" size="sm" appearance="ghost" type="button" disabled={!canReturn} onClick={() => setAction({ kind: "RETURN", notification: n })} testId={`an-notif-return-${n.id}`} />
            )}
            {open && n.status === "VALIDATED" && (
              <Button text="Convert" size="sm" appearance="primary" type="button" disabled={!canConvert} onClick={() => setAction({ kind: "CONVERT", notification: n })} testId={`an-notif-convert-${n.id}`} />
            )}
            {open && (
              <Button
                text="Mark duplicate"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canMarkDuplicate}
                onClick={() => setAction({ kind: "DUPLICATE", notification: n })}
                testId={`an-notif-duplicate-${n.id}`}
              />
            )}
            {open && n.status === "VALIDATION_PENDING" && (
              <Button text="Escalate" size="sm" appearance="ghost" type="button" disabled={!canReturn} onClick={() => setAction({ kind: "ESCALATE", notification: n })} testId={`an-notif-escalate-${n.id}`} />
            )}
            {!open && <span className="crvs-form-hint">Closed</span>}
          </div>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to court notifications" description="Viewing marriage-annulment court notifications requires annulment-notification-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage-annulment court notifications</h1>
        <p className="crvs-page-subtitle">Notifications pushed in by the simulated court integration, awaiting validation and conversion into an annulment registration.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        {canCreate ? (
          <Button text="Simulate court notification" appearance="primary" startIcon="gavel" type="button" onClick={() => setShowSimulate(true)} testId="an-notif-simulate" />
        ) : (
          <Button text="Simulate court notification" appearance="primary" startIcon="gavel" type="button" disabled styles={{ cursor: "not-allowed" }} onClick={() => undefined} testId="an-notif-simulate-disabled" />
        )}
        {!canCreate && <span className="crvs-form-hint">Simulating a court notification requires annulment-notification-create access.</span>}
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="an-notif-search">Search</label>
          <input id="an-notif-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, court case, decision, names…" data-testid="an-notif-search" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-court">Court</label>
          <select id="an-notif-court" value={courtFilter} onChange={(e) => setCourtFilter(e.target.value)} data-testid="an-notif-court-filter">
            <option value="">All courts</option>
            {courts.map((court) => (
              <option key={court} value={court}>
                {court}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-status">Status</label>
          <select id="an-notif-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AnnulmentNotificationStatus | "")} data-testid="an-notif-status-filter">
            <option value="">All statuses</option>
            {(Object.keys(ANNULMENT_NOTIFICATION_STATUS_LABELS) as AnnulmentNotificationStatus[]).map((key) => (
              <option key={key} value={key}>
                {ANNULMENT_NOTIFICATION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-match">Marriage match</label>
          <select id="an-notif-match" value={matchFilter} onChange={(e) => setMatchFilter(e.target.value as AnnulmentExistingMarriageMatchStatus | "")} data-testid="an-notif-match-filter">
            <option value="">Any result</option>
            {(Object.keys(EXISTING_MARRIAGE_MATCH_LABELS) as AnnulmentExistingMarriageMatchStatus[]).map((key) => (
              <option key={key} value={key}>
                {EXISTING_MARRIAGE_MATCH_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-assignment">Assignment</label>
          <select id="an-notif-assignment" value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value as AssignmentFilter)} data-testid="an-notif-assignment-filter">
            <option value="">Anyone</option>
            <option value="ME">Assigned to me</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="OTHERS">Assigned to others</option>
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-date-from">Notified from</label>
          <input id="an-notif-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="an-notif-date-from" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-date-to">Notified to</label>
          <input id="an-notif-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="an-notif-date-to" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="an-notif-duplicates">Duplicate warning</label>
          <label htmlFor="an-notif-duplicates" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
            <input id="an-notif-duplicates" type="checkbox" checked={duplicatesOnly} onChange={(e) => setDuplicatesOnly(e.target.checked)} data-testid="an-notif-duplicates-filter" />
            Only possible duplicates
          </label>
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(n) => n.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No court notifications match this view"
          emptyDescription="Adjust the filters, or simulate a court notification to exercise the workflow."
          emptyIcon="gavel"
        />
      </div>

      <SimulateCourtAnnulmentNotificationModal show={showSimulate} onClose={() => setShowSimulate(false)} actorName={actorName} onSimulated={(created) => setNotifications((prev) => [created, ...prev])} />

      <AssignAnnulmentNotificationModal
        show={action?.kind === "ASSIGN"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "ASSIGN" ? action.notification : undefined}
        actorName={actorName}
        defaultOfficerId={currentAccountId}
        defaultOfficerName={actorName}
        onAssigned={applyUpdated}
      />
      <ValidateAnnulmentNotificationModal
        show={action?.kind === "VALIDATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "VALIDATE" ? action.notification : undefined}
        actorName={actorName}
        onValidated={applyUpdated}
      />
      <ReturnAnnulmentNotificationModal
        show={action?.kind === "RETURN"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "RETURN" ? action.notification : undefined}
        actorName={actorName}
        onReturned={applyUpdated}
      />
      <MarkAnnulmentNotificationDuplicateModal
        show={action?.kind === "DUPLICATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "DUPLICATE" ? action.notification : undefined}
        actorName={actorName}
        onMarked={applyUpdated}
      />
      <EscalateAnnulmentNotificationModal
        show={action?.kind === "ESCALATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "ESCALATE" ? action.notification : undefined}
        actorName={actorName}
        onEscalated={applyUpdated}
      />
      <ConvertAnnulmentNotificationModal
        show={action?.kind === "CONVERT"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "CONVERT" ? action.notification : undefined}
        actorId={currentAccountId || "unknown"}
        actorName={actorName}
        defaultOfficeId={DEMO_ANNULMENT_OFFICE_ID}
        defaultOfficeName={DEMO_ANNULMENT_OFFICE_NAME}
        onConverted={(created) => {
          setAction(undefined);
          load();
          navigate(`/dashboard/crvs/annulment-registrations/${created.id}/edit`);
        }}
      />
    </div>
  );
}
