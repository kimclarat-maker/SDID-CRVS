import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { DIVORCE_EXCEPTION_TRIGGER_LABELS } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceExceptionType, DivorceRegistration } from "@/domain/crvs/types";
import { divorceSlaState, formatDateTime, formerSpousesLabel, marriageReferenceLabel } from "../divorceShared";
import "../shared.css";

/** Icon per exception type for the summary tiles — every DivorceExceptionType
 * from divorcePolicyConfig's DIVORCE_EXCEPTION_TRIGGER_LABELS is represented,
 * so a new exception type can never silently drop off this page. */
const EXCEPTION_ICONS: Record<DivorceExceptionType, string> = {
  MARRIAGE_RECORD_NOT_FOUND: "search_off",
  IDENTITY_NOT_FOUND_ONE: "person_search",
  IDENTITY_NOT_FOUND_BOTH: "group_off",
  MARRIAGE_IDENTITY_MISMATCH: "compare_arrows",
  DUPLICATE_DIVORCE: "content_copy",
  JUDGMENT_NUMBER_DUPLICATE: "file_copy",
  JUDGMENT_NOT_FINAL: "gavel",
  COURT_DETAILS_CANNOT_BE_VERIFIED: "help",
  CONFLICTING_MARITAL_STATUS: "fact_check",
  EXISTING_ANNULMENT: "block",
  EXISTING_JUDICIAL_SEPARATION: "call_split",
  FOREIGN_DOCUMENT_ISSUE: "public",
  WRONG_PROCESSING_OFFICE: "location_off",
  LATE_REGISTRATION: "schedule",
  APPLICANT_AUTHORITY_UNCLEAR: "badge",
  SDID_RELATIONSHIP_MISSING: "link_off",
  OTHER: "report",
};

const EXCEPTION_TYPES = Object.keys(DIVORCE_EXCEPTION_TRIGGER_LABELS) as DivorceExceptionType[];

/** Divorce exceptions queue: every registration whose exception record is
 * currently OPEN, summarised by trigger type. */
export default function DivorceExceptionsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTION_REVIEW);

  const [registrations, setRegistrations] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<DivorceExceptionType | "">("");
  const [priorityFilter, setPriorityFilter] = useState<"" | "LOW" | "MEDIUM" | "HIGH">("");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceRegistrations({ limit: 500 });
      setRegistrations(data.filter((r) => r.exception?.status === "OPEN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load divorce exceptions.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(
    () =>
      registrations.filter((r) => {
        if (typeFilter && r.exception?.type !== typeFilter) return false;
        if (priorityFilter && r.exception?.priority !== priorityFilter) return false;
        return true;
      }),
    [registrations, typeFilter, priorityFilter]
  );

  const byType = (type: DivorceExceptionType) => registrations.filter((r) => r.exception?.type === type).length;
  const presentTypes = EXCEPTION_TYPES.filter((type) => byType(type) > 0);

  const columns: QueueColumn<DivorceRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "marriage", header: "Marriage", render: (r) => marriageReferenceLabel(r) },
    { key: "type", header: "Exception type", render: (r) => (r.exception ? DIVORCE_EXCEPTION_TRIGGER_LABELS[r.exception.type] : "—") },
    { key: "reason", header: "Reason", render: (r) => r.exception?.reason || "—" },
    { key: "rule", header: "Triggering rule", render: (r) => r.exception?.triggeringRule || "—" },
    { key: "assigned", header: "Assigned supervisor", render: (r) => r.exception?.assignedTo || r.reviewerName || "Unassigned" },
    { key: "priority", header: "Priority", render: (r) => r.exception?.priority || "—" },
    { key: "status", header: "Case status", render: (r) => <StatusBadge kind="divorceRegistration" status={r.status} /> },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        const sla = divorceSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    { key: "updated", header: "Updated", render: (r) => formatDateTime(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button text={canResolve ? "Review" : "View"} size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-exceptions/${r.id}`)} testId={`de-view-${r.id}`} />
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to divorce exceptions" description="Viewing the divorce exceptions queue requires divorce-exceptions-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce exceptions</h1>
        <p className="crvs-page-subtitle">
          Divorce registrations routed for supervisor exception review — marriage-record, identity, duplicate, finality, civil-status, foreign-document, jurisdiction, late-registration and authority cases.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {presentTypes.length > 0 && (
        <div className="crvs-tile-grid">
          {presentTypes.map((type) => (
            <CardCount
              key={type}
              name={DIVORCE_EXCEPTION_TRIGGER_LABELS[type]}
              count={byType(type)}
              icon={EXCEPTION_ICONS[type]}
              color={type === "DUPLICATE_DIVORCE" || type === "EXISTING_ANNULMENT" ? "var(--status-danger)" : "var(--status-warning)"}
              onClick={() => setTypeFilter((current) => (current === type ? "" : type))}
            />
          ))}
        </div>
      )}

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="de-type">Exception type</label>
          <select id="de-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as DivorceExceptionType | "")} data-testid="de-type-filter">
            <option value="">All types</option>
            {EXCEPTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {DIVORCE_EXCEPTION_TRIGGER_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="de-priority">Priority</label>
          <select id="de-priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "" | "LOW" | "MEDIUM" | "HIGH")} data-testid="de-priority-filter">
            <option value="">Any priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        {!canResolve && <span className="crvs-form-hint">You have view-only access — resolving an exception requires divorce-exception-review access.</span>}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No open exceptions"
          emptyDescription="Every divorce registration is progressing through the standard flow."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
