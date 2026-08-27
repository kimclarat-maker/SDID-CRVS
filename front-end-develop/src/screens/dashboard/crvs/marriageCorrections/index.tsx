import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission, getCurrentAccountId } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication, MarriageCorrectionRequest } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../marriageShared";
import "../shared.css";

function latestOpenCorrection(a: MarriageApplication): MarriageCorrectionRequest | undefined {
  const open = a.correctionRequests.filter((c) => !c.resolvedAt);
  return open[open.length - 1] || a.correctionRequests[a.correctionRequests.length - 1];
}

function daysOpen(requestedAt?: string): string {
  if (!requestedAt) return "—";
  const days = Math.floor((Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60 * 24));
  return days < 0 ? "0" : String(days);
}

/** Corrections queue (marriage workflow): every application currently in
 * CORRECTION_REQUIRED status, driven off the same demoListMarriageApplications
 * status filter every other queue page uses. */
export default function MarriageCorrectionsQueue() {
  const navigate = useNavigate();
  const currentAccountId = getCurrentAccountId();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CORRECTION_REQUEST);

  const [applications, setApplications] = useState<MarriageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListMarriageApplications({ status: "CORRECTION_REQUIRED", limit: 500 });
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage corrections.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => applications, [applications]);

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "requestedBy", header: "Requested by", render: (a) => latestOpenCorrection(a)?.requestedBy || "—" },
    { key: "requestedAt", header: "Requested at", render: (a) => formatDateTime(latestOpenCorrection(a)?.requestedAt) },
    {
      key: "fields",
      header: "Fields affected",
      render: (a) => {
        const c = latestOpenCorrection(a);
        if (!c) return "—";
        const fields = c.items.flatMap((i) => (i.fields.length ? i.fields : [i.section.replace(/_/g, " ")]));
        return fields.length ? fields.join(", ") : "—";
      },
    },
    { key: "daysOpen", header: "Days open", render: (a) => daysOpen(latestOpenCorrection(a)?.requestedAt) },
    { key: "status", header: "Status", render: (a) => <StatusBadge kind="marriageApplication" status={a.status} /> },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}`)} testId={`mr-correction-view-${a.id}`} />
          {a.officerId === currentAccountId && (
            <Button text="Edit" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-applications/${a.id}/edit`)} testId={`mr-correction-edit-${a.id}`} />
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage corrections" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage corrections</h1>
        <p className="crvs-page-subtitle">Applications currently awaiting a correction response from the applicants.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No corrections outstanding"
          emptyDescription="Every marriage application is progressing without an open correction request."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
