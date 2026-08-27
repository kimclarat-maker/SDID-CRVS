import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageApplication } from "@/domain/crvs/types";
import { applicantDisplayName, formatDateTime } from "../marriageShared";
import "../shared.css";

/** Objection queue (spec §5): only ever rendered when
 * marriagePolicyConfig.objection.enabled is true — a direct URL visit while
 * disabled degrades to an explained Empty state rather than a blank/broken
 * page, same as the sidebar link being hidden. */
export default function MarriageObjectionsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW);

  const [applications, setApplications] = useState<MarriageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!canView || !marriagePolicyConfig.objection.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListMarriageApplications({ limit: 500 });
      setApplications(data.filter((a) => a.objection !== undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load marriage objections.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: QueueColumn<MarriageApplication>[] = [
    { key: "reference", header: "Reference", render: (a) => a.reference },
    { key: "applicants", header: "Applicants", render: (a) => `${applicantDisplayName(a.applicant1)} & ${applicantDisplayName(a.applicant2)}` },
    { key: "raisedBy", header: "Raised by", render: (a) => a.objection?.raisedBy || "—" },
    { key: "raisedAt", header: "Raised at", render: (a) => formatDateTime(a.objection?.raisedAt) },
    { key: "status", header: "Status", render: (a) => (a.objection ? <StatusBadge kind="marriageObjection" status={a.objection.status} /> : "—") },
    { key: "actions", header: "", render: (a) => <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/marriage-objections/${a.id}`)} testId={`mr-objection-view-${a.id}`} /> },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to marriage objections" isFullScreen />
      </div>
    );
  }

  if (!marriagePolicyConfig.objection.enabled) {
    return (
      <div className="crvs-page">
        <div className="crvs-page-header">
          <h1 className="crvs-page-title">Marriage objections</h1>
          <span className="crvs-demo-note">Demo data — fictional</span>
        </div>
        <Empty
          icon="block"
          title="Objections are not enabled by current policy"
          description="marriagePolicyConfig.objection.enabled is set to false, so objection handling is switched off workspace-wide. No objection can be raised or resolved until policy re-enables it."
          isFullScreen
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Marriage objections</h1>
        <p className="crvs-page-subtitle">Objections raised against a marriage declaration during the public-notice window.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={applications}
          columns={columns}
          getRowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No objections raised"
          emptyDescription="No marriage declaration currently has an objection on file."
          emptyIcon="task_alt"
        />
      </div>
    </div>
  );
}
