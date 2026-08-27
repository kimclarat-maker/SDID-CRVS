import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName } from "../marriageShared";
import "../shared.css";

function affectedSpouses(a: MarriageApplication): string {
  const s1 = a.sdid.applicant1.status === "FAILED" || a.sdid.applicant1.status === "MANUAL_REVIEW";
  const s2 = a.sdid.applicant2.status === "FAILED" || a.sdid.applicant2.status === "MANUAL_REVIEW";
  if (s1 && s2) return "Both";
  if (s1) return "Applicant 1";
  if (s2) return "Applicant 2";
  return "—";
}

function lastFailureCode(a: MarriageApplication): string {
  return a.sdid.applicant1.lastFailureCode || a.sdid.applicant2.lastFailureCode || "—";
}

/** Marriage SDID sync-failure queue: cases whose case-level sync aggregate
 * is PARTIAL_FAILURE, FAILED, or MANUAL_REVIEW. Row actions navigate into
 * registeredMarriages/details, which owns the actual per-spouse retry /
 * assign-manual-review UI — the simplest option per this module's brief,
 * avoiding a second parallel sync-management surface. */
export default function MarriageSyncFailures() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_VIEW);
  const canRetry = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_RETRY);

  const [rows, setRows] = useState<MarriageApplication[]>([]);
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
      const { data } = await demoListMarriageApplications({ limit: 500 });
      setRows(data.filter((a) => a.sdid.status === "PARTIAL_FAILURE" || a.sdid.status === "FAILED" || a.sdid.status === "MANUAL_REVIEW"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage synchronization failures.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "spouses", header: "Spouses", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "sync", header: "Sync status", render: (a) => <StatusBadge kind="marriageSync" status={a.sdid.status} /> },
    { key: "affected", header: "Affected spouse(s)", render: affectedSpouses },
    { key: "failureCode", header: "Last failure code", render: lastFailureCode },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <Button
          text={canRetry ? "Manage synchronization" : "View"}
          size="sm"
          appearance="ghost"
          onClick={() => navigate(`/dashboard/crvs/registered-marriages/${a.id}`)}
          testId={`mr-sync-failure-manage-${a.id}`}
        />
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage synchronization failures" isFullScreen />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage synchronization failures</h1>
        <p className="crvs-page-subtitle">Registered marriages whose SDID marital-status synchronization needs attention for one or both spouses.</p>
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
          emptyTitle="No synchronization failures"
          emptyDescription="Every registered marriage's SDID synchronization is either pending, in progress, or complete for both spouses."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
