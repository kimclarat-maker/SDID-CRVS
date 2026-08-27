import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceRegistration } from "@/domain/crvs/types";
import { daysSince, DIVORCE_REVIEW_SECTION_LABELS, formatDate, formatDateTime, formerSpousesLabel, latestOpenCorrection } from "../divorceShared";
import "../shared.css";

/** Divorce corrections queue: every registration with an open correction
 * request awaiting an applicant response. Driven off the same
 * demoListDivorceRegistrations status filter every other queue page uses. */
export default function DivorceCorrectionsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CORRECTION_REQUEST);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_EDIT);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW);

  const [registrations, setRegistrations] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [overdueOnly, setOverdueOnly] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceRegistrations({ limit: 500 });
      // Anything still carrying an unresolved correction request — normally
      // CORRECTION_REQUIRED, but a resubmitted case whose items are not yet
      // marked addressed still belongs in this queue.
      setRegistrations(data.filter((r) => r.correctionRequests.some((c) => !c.resolvedAt)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load divorce corrections.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const isOverdue = (r: DivorceRegistration) => {
    const correction = latestOpenCorrection(r);
    const elapsed = daysSince(correction?.requestedAt);
    if (elapsed === undefined) return false;
    return elapsed > divorcePolicyConfig.sla.correctionResponseDays;
  };

  const rows = useMemo(() => (overdueOnly ? registrations.filter(isOverdue) : registrations), [registrations, overdueOnly]);

  const columns: QueueColumn<DivorceRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "requestedBy", header: "Requested by", render: (r) => latestOpenCorrection(r)?.requestedBy || "—" },
    { key: "requestedAt", header: "Requested at", render: (r) => formatDateTime(latestOpenCorrection(r)?.requestedAt) },
    {
      key: "sections",
      header: "Sections affected",
      render: (r) => {
        const correction = latestOpenCorrection(r);
        if (!correction) return "—";
        return Array.from(new Set(correction.items.map((i) => DIVORCE_REVIEW_SECTION_LABELS[i.section]))).join(", ");
      },
    },
    {
      key: "fields",
      header: "Fields affected",
      render: (r) => {
        const correction = latestOpenCorrection(r);
        if (!correction) return "—";
        const fields = correction.items.flatMap((i) => (i.fields.length ? i.fields : [DIVORCE_REVIEW_SECTION_LABELS[i.section]]));
        return fields.length ? Array.from(new Set(fields)).join(", ") : "—";
      },
    },
    { key: "documents", header: "Documents required", render: (r) => (latestOpenCorrection(r)?.items.some((i) => i.documentsRequired) ? "Yes" : "No") },
    { key: "deadline", header: "Response deadline", render: (r) => formatDate(latestOpenCorrection(r)?.responseDeadline) },
    {
      key: "daysOpen",
      header: "Days open",
      render: (r) => {
        const days = daysSince(latestOpenCorrection(r)?.requestedAt);
        if (days === undefined) return "—";
        return <span className={`crvs-status-pill crvs-status-${isOverdue(r) ? "danger" : "info"}`}>{days}</span>;
      },
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="divorceRegistration" status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button text="View" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}`)} testId={`dc-view-${r.id}`} />
          {canReview && <Button text="Open review" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/divorce-review/${r.id}`)} testId={`dc-review-${r.id}`} />}
          {r.status === "CORRECTION_REQUIRED" && (
            <Button
              text="Edit"
              size="sm"
              appearance="primary"
              type="button"
              disabled={!canEdit}
              onClick={() => navigate(`/dashboard/crvs/divorce-registrations/${r.id}/edit`)}
              testId={`dc-edit-${r.id}`}
            />
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to divorce corrections" description="Viewing the corrections queue requires divorce-correction-request access." isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Divorce corrections</h1>
        <p className="crvs-page-subtitle">
          Divorce registrations awaiting a correction response. The configured response window is {divorcePolicyConfig.sla.correctionResponseDays} days.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="dc-overdue">Filter</label>
          <label htmlFor="dc-overdue" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
            <input id="dc-overdue" type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} data-testid="dc-overdue-filter" />
            Only overdue responses
          </label>
        </div>
        {currentAccountId && (
          <span className="crvs-form-hint">
            {registrations.filter((r) => r.officerId === currentAccountId).length} of these were prepared by you.
          </span>
        )}
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No corrections outstanding"
          emptyDescription="Every divorce registration is progressing without an open correction request."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
