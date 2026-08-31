import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListAnnulmentRegistrations } from "@/demo/services/crvsAnnulmentRegistrations";
import { ANNULMENT_EXCEPTION_TRIGGER_LABELS } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentExceptionType, AnnulmentRegistration } from "@/domain/crvs/types";
import { affectedPartiesLabel, annulmentSlaState, formatDateTime, marriageReferenceLabel } from "../annulmentShared";
import { AnnulmentRegistrationStatusPill } from "../registeredAnnulments/components/AnnulmentStatusPill";
import "../shared.css";

/** Icon per exception type for the summary tiles — every AnnulmentExceptionType
 * from annulmentPolicyConfig's ANNULMENT_EXCEPTION_TRIGGER_LABELS is
 * represented, so a new exception type can never silently drop off this
 * page. */
const EXCEPTION_ICONS: Record<AnnulmentExceptionType, string> = {
  MARRIAGE_RECORD_NOT_FOUND: "search_off",
  IDENTITY_NOT_FOUND_ONE: "person_search",
  IDENTITY_NOT_FOUND_BOTH: "group_off",
  MARRIAGE_PARTY_MISMATCH: "compare_arrows",
  DUPLICATE_ANNULMENT: "content_copy",
  DECISION_NUMBER_DUPLICATE: "file_copy",
  DECISION_NOT_FINAL: "gavel",
  COURT_CANNOT_BE_VERIFIED: "help",
  EFFECTIVE_DATE_UNCLEAR: "event_busy",
  LEGAL_EFFECT_UNCLEAR: "balance",
  EXISTING_DIVORCE_CONFLICT: "block",
  EXISTING_ANNULMENT_CONFLICT: "block",
  EXISTING_JUDICIAL_SEPARATION_CONFLICT: "call_split",
  MARRIAGE_CORRECTION_IN_PROGRESS: "edit",
  CONFLICTING_CIVIL_STATUS: "fact_check",
  FOREIGN_DOCUMENT_ISSUE: "public",
  WRONG_PROCESSING_OFFICE: "location_off",
  LATE_REGISTRATION: "schedule",
  APPLICANT_AUTHORITY_UNCLEAR: "badge",
  SDID_RELATIONSHIP_MISSING: "link_off",
  CERTIFICATE_STATUS_CONFLICT: "workspace_premium",
  OTHER: "report",
};

const HIGH_SEVERITY_TYPES: AnnulmentExceptionType[] = ["DUPLICATE_ANNULMENT", "EXISTING_ANNULMENT_CONFLICT", "EXISTING_DIVORCE_CONFLICT"];

const EXCEPTION_TYPES = Object.keys(ANNULMENT_EXCEPTION_TRIGGER_LABELS) as AnnulmentExceptionType[];

/** Annulment exceptions queue: every registration whose exception record is
 * currently OPEN, summarised by trigger type — mirrors
 * divorceExceptions/index.tsx. */
export default function AnnulmentExceptionsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EXCEPTIONS_VIEW);
  const canResolve = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EXCEPTION_REVIEW);

  const [registrations, setRegistrations] = useState<AnnulmentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<AnnulmentExceptionType | "">("");
  const [priorityFilter, setPriorityFilter] = useState<"" | "LOW" | "MEDIUM" | "HIGH">("");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListAnnulmentRegistrations({ limit: 500 });
      setRegistrations(data.filter((r) => r.exception?.status === "OPEN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load annulment exceptions.");
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

  const byType = (type: AnnulmentExceptionType) => registrations.filter((r) => r.exception?.type === type).length;
  const presentTypes = EXCEPTION_TYPES.filter((type) => byType(type) > 0);

  const columns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "marriage", header: "Marriage", render: (r) => marriageReferenceLabel(r) },
    { key: "type", header: "Exception type", render: (r) => (r.exception ? ANNULMENT_EXCEPTION_TRIGGER_LABELS[r.exception.type] : "—") },
    { key: "reason", header: "Reason", render: (r) => r.exception?.reason || "—" },
    { key: "rule", header: "Triggering rule", render: (r) => r.exception?.triggeringRule || "—" },
    { key: "assigned", header: "Assigned supervisor", render: (r) => r.exception?.assignedTo || r.reviewerName || "Unassigned" },
    { key: "priority", header: "Priority", render: (r) => r.exception?.priority || "—" },
    { key: "status", header: "Case status", render: (r) => <AnnulmentRegistrationStatusPill status={r.status} /> },
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
      render: (r) => (
        <Button text={canResolve ? "Review" : "View"} size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/annulment-exceptions/${r.id}`)} testId={`ae-view-${r.id}`} />
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to annulment exceptions" description="Viewing the annulment exceptions queue requires annulment-exceptions-view access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Annulment exceptions</h1>
        <p className="crvs-page-subtitle">
          Marriage-annulment registrations routed for supervisor exception review — marriage-record, identity, duplicate, finality, legal-effect, civil-status, foreign-document, jurisdiction,
          late-registration and authority cases.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {presentTypes.length > 0 && (
        <div className="crvs-tile-grid">
          {presentTypes.map((type) => (
            <CardCount
              key={type}
              name={ANNULMENT_EXCEPTION_TRIGGER_LABELS[type]}
              count={byType(type)}
              icon={EXCEPTION_ICONS[type]}
              color={HIGH_SEVERITY_TYPES.includes(type) ? "var(--status-danger)" : "var(--status-warning)"}
              onClick={() => setTypeFilter((current) => (current === type ? "" : type))}
            />
          ))}
        </div>
      )}

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="ae-type">Exception type</label>
          <select id="ae-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AnnulmentExceptionType | "")} data-testid="ae-type-filter">
            <option value="">All types</option>
            {EXCEPTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {ANNULMENT_EXCEPTION_TRIGGER_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="ae-priority">Priority</label>
          <select id="ae-priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "" | "LOW" | "MEDIUM" | "HIGH")} data-testid="ae-priority-filter">
            <option value="">Any priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        {!canResolve && <span className="crvs-form-hint">You have view-only access — resolving an exception requires annulment-exception-review access.</span>}
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
          emptyDescription="Every annulment registration is progressing through the standard flow."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
