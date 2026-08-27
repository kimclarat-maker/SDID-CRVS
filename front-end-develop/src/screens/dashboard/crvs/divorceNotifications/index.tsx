import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceNotifications } from "@/demo/services/crvsDivorceNotifications";
import { DIVORCE_NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DivorceNotification, DivorceNotificationStatus, ExistingMarriageMatchStatus } from "@/domain/crvs/types";
import { DEMO_DIVORCE_OFFICE_ID, DEMO_DIVORCE_OFFICE_NAME } from "@/demo/seed/crvsAccounts";
import { divorceNotificationSlaState, EXISTING_MARRIAGE_MATCH_LABELS, formatDate } from "../divorceShared";
import SimulateCourtNotificationModal from "./components/modals/SimulateCourtNotificationModal";
import {
  AssignDivorceNotificationModal,
  ConvertDivorceNotificationModal,
  EscalateDivorceNotificationModal,
  MarkDivorceNotificationDuplicateModal,
  ReturnDivorceNotificationModal,
  ValidateDivorceNotificationModal,
} from "./components/modals/DivorceNotificationActionModals";
import "../shared.css";

type ActionKind = "ASSIGN" | "VALIDATE" | "RETURN" | "DUPLICATE" | "CONVERT" | "ESCALATE";
type AssignmentFilter = "" | "ME" | "UNASSIGNED" | "OTHERS";

/**
 * Court-notification queue (spec §14). Deliberately has no bulk actions:
 * every notification is validated, returned, marked duplicate or converted
 * one at a time. The "Simulate court notification" action stands in for the
 * mock court integration, since there is no inbound API in this demo.
 */
export default function DivorceNotificationsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const actorName = getCurrentActorName();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VIEW);
  const canCreate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_CREATE);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_EDIT);
  const canValidate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VALIDATE);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_RETURN);
  const canMarkDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_MARK_DUPLICATE);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_CONVERT);

  const [notifications, setNotifications] = useState<DivorceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [search, setSearch] = useState("");
  const [courtFilter, setCourtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DivorceNotificationStatus | "">("");
  const [matchFilter, setMatchFilter] = useState<ExistingMarriageMatchStatus | "">("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showSimulate, setShowSimulate] = useState(false);
  const [action, setAction] = useState<{ kind: ActionKind; notification: DivorceNotification } | undefined>();

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceNotifications({ limit: 500 });
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
      if (term && ![n.reference, n.courtCaseNumber, n.judgmentNumber, n.applicantNamesAsReported, n.courtName].some((v) => v.toLowerCase().includes(term))) return false;
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

  const applyUpdated = (updated: DivorceNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setAction(undefined);
  };

  const columns: QueueColumn<DivorceNotification>[] = [
    {
      key: "reference",
      header: "Notification reference",
      render: (n) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {n.reference}
          {n.duplicateWarning && (
            <span className="crvs-status-pill crvs-status-warning crvs-status-icon-label" title="A notification with the same court case or judgment number already exists">
              <Icon name="content_copy" />
              Possible duplicate
            </span>
          )}
        </span>
      ),
    },
    { key: "court", header: "Court", render: (n) => n.courtName },
    { key: "case", header: "Court case number", render: (n) => n.courtCaseNumber },
    { key: "judgment", header: "Judgment number", render: (n) => n.judgmentNumber },
    { key: "spouses", header: "Former spouses", render: (n) => n.applicantNamesAsReported },
    { key: "match", header: "Marriage match", render: (n) => EXISTING_MARRIAGE_MATCH_LABELS[n.marriageMatch.status] },
    { key: "notified", header: "Notification date", render: (n) => formatDate(n.notifiedAt) },
    { key: "status", header: "Validation status", render: (n) => <StatusBadge kind="divorceNotification" status={n.status} /> },
    { key: "assigned", header: "Assigned officer", render: (n) => n.assignedOfficerName || "Unassigned" },
    {
      key: "sla",
      header: "SLA",
      render: (n) => {
        if (n.status === "CONVERTED_TO_REGISTRATION" || n.status === "DUPLICATE" || n.status === "CANCELLED") return "—";
        const sla = divorceNotificationSlaState(n.notifiedAt);
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
            <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-notifications/${n.id}`)} testId={`dn-view-${n.id}`} />
            {open && (
              <Button
                text="Assign"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canEdit}
                styles={!canEdit ? { cursor: "not-allowed" } : undefined}
                onClick={() => setAction({ kind: "ASSIGN", notification: n })}
                testId={`dn-assign-${n.id}`}
              />
            )}
            {open && (n.status === "RECEIVED" || n.status === "RETURNED") && (
              <Button text="Validate" size="sm" appearance="primary" type="button" disabled={!canValidate} onClick={() => setAction({ kind: "VALIDATE", notification: n })} testId={`dn-validate-${n.id}`} />
            )}
            {open && n.status === "VALIDATION_PENDING" && (
              <Button text="Return" size="sm" appearance="ghost" type="button" disabled={!canReturn} onClick={() => setAction({ kind: "RETURN", notification: n })} testId={`dn-return-${n.id}`} />
            )}
            {open && n.status === "VALIDATED" && (
              <Button text="Convert" size="sm" appearance="primary" type="button" disabled={!canConvert} onClick={() => setAction({ kind: "CONVERT", notification: n })} testId={`dn-convert-${n.id}`} />
            )}
            {open && (
              <Button
                text="Mark duplicate"
                size="sm"
                appearance="ghost"
                type="button"
                disabled={!canMarkDuplicate}
                onClick={() => setAction({ kind: "DUPLICATE", notification: n })}
                testId={`dn-duplicate-${n.id}`}
              />
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
        <Empty icon="lock" title="You don't have access to court notifications" description="Viewing divorce court notifications requires divorce-notification-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce court notifications</h1>
        <p className="crvs-page-subtitle">Notifications pushed in by the simulated court integration, awaiting validation and conversion into a divorce registration.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        {canCreate ? (
          <Button text="Simulate court notification" appearance="primary" startIcon="gavel" type="button" onClick={() => setShowSimulate(true)} testId="dn-simulate" />
        ) : (
          <Button
            text="Simulate court notification"
            appearance="primary"
            startIcon="gavel"
            type="button"
            disabled
            styles={{ cursor: "not-allowed" }}
            onClick={() => undefined}
            testId="dn-simulate-disabled"
          />
        )}
        {!canCreate && <span className="crvs-form-hint">Simulating a court notification requires divorce-notification-create access.</span>}
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="dn-search">Search</label>
          <input id="dn-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, court case, judgment, names…" data-testid="dn-search" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-court">Court</label>
          <select id="dn-court" value={courtFilter} onChange={(e) => setCourtFilter(e.target.value)} data-testid="dn-court-filter">
            <option value="">All courts</option>
            {courts.map((court) => (
              <option key={court} value={court}>
                {court}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-status">Status</label>
          <select id="dn-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DivorceNotificationStatus | "")} data-testid="dn-status-filter">
            <option value="">All statuses</option>
            {(Object.keys(DIVORCE_NOTIFICATION_STATUS_LABELS) as DivorceNotificationStatus[]).map((key) => (
              <option key={key} value={key}>
                {DIVORCE_NOTIFICATION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-match">Marriage match</label>
          <select id="dn-match" value={matchFilter} onChange={(e) => setMatchFilter(e.target.value as ExistingMarriageMatchStatus | "")} data-testid="dn-match-filter">
            <option value="">Any result</option>
            {(Object.keys(EXISTING_MARRIAGE_MATCH_LABELS) as ExistingMarriageMatchStatus[]).map((key) => (
              <option key={key} value={key}>
                {EXISTING_MARRIAGE_MATCH_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-assignment">Assignment</label>
          <select id="dn-assignment" value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value as AssignmentFilter)} data-testid="dn-assignment-filter">
            <option value="">Anyone</option>
            <option value="ME">Assigned to me</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="OTHERS">Assigned to others</option>
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-date-from">Notified from</label>
          <input id="dn-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="dn-date-from" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-date-to">Notified to</label>
          <input id="dn-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="dn-date-to" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="dn-duplicates">Duplicate warning</label>
          <label htmlFor="dn-duplicates" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
            <input id="dn-duplicates" type="checkbox" checked={duplicatesOnly} onChange={(e) => setDuplicatesOnly(e.target.checked)} data-testid="dn-duplicates-filter" />
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

      <SimulateCourtNotificationModal show={showSimulate} onClose={() => setShowSimulate(false)} actorName={actorName} onSimulated={(created) => setNotifications((prev) => [created, ...prev])} />

      <AssignDivorceNotificationModal
        show={action?.kind === "ASSIGN"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "ASSIGN" ? action.notification : undefined}
        actorName={actorName}
        defaultOfficerId={currentAccountId}
        defaultOfficerName={actorName}
        onAssigned={applyUpdated}
      />
      <ValidateDivorceNotificationModal
        show={action?.kind === "VALIDATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "VALIDATE" ? action.notification : undefined}
        actorName={actorName}
        onValidated={applyUpdated}
      />
      <ReturnDivorceNotificationModal
        show={action?.kind === "RETURN"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "RETURN" ? action.notification : undefined}
        actorName={actorName}
        onReturned={applyUpdated}
      />
      <MarkDivorceNotificationDuplicateModal
        show={action?.kind === "DUPLICATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "DUPLICATE" ? action.notification : undefined}
        actorName={actorName}
        onMarked={applyUpdated}
      />
      <EscalateDivorceNotificationModal
        show={action?.kind === "ESCALATE"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "ESCALATE" ? action.notification : undefined}
        actorName={actorName}
        onEscalated={applyUpdated}
      />
      <ConvertDivorceNotificationModal
        show={action?.kind === "CONVERT"}
        onClose={() => setAction(undefined)}
        notification={action?.kind === "CONVERT" ? action.notification : undefined}
        actorId={currentAccountId || "unknown"}
        actorName={actorName}
        defaultOfficeId={DEMO_DIVORCE_OFFICE_ID}
        defaultOfficeName={DEMO_DIVORCE_OFFICE_NAME}
        onConverted={(created) => {
          setAction(undefined);
          load();
          navigate(`/dashboard/crvs/divorce-registrations/${created.id}/edit`);
        }}
      />
    </div>
  );
}
