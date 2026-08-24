import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RequirePermission from "@/navigation/guards/RequirePermission";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { missingEvidence } from "@/domain/crvs/evidenceRequirements";
import { demoListRegistrations } from "@/demo/services/crvsRegistrations";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import "../../shared.css";

/** Evidence-completeness summary for a queue row — "Complete" or "N missing"
 * driven by the same missingEvidence() the case-details/review screens use,
 * never a screen-local duplicate of the evidence rules. */
function evidenceCompleteness(registrationCase: BirthRegistrationCase): string {
  const missing = missingEvidence(registrationCase);
  return missing.length === 0 ? "Complete" : `${missing.length} missing`;
}

function LateRegistrationsQueue() {
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ status: "LATE_REGISTRATION_REVIEW", limit: 200 })
      .then((res) => setRows(res.data))
      .catch((e) => setError(e?.message || "Something went wrong loading this queue."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    {
      key: "reference",
      header: "Application reference",
      render: (c) => <Link to={`/dashboard/crvs/exceptions/${c.id}`}>{c.reference}</Link>,
    },
    {
      key: "child",
      header: "Child",
      render: (c) => `${c.child.firstName || ""} ${c.child.lastName}`.trim(),
    },
    {
      key: "daysAfterBirth",
      header: "Days after deadline",
      render: (c) => c.daysAfterBirth,
    },
    {
      key: "delayReason",
      header: "Reason for delay",
      render: (c) => c.delayReason || "—",
    },
    {
      key: "evidence",
      header: "Evidence",
      render: (c) => evidenceCompleteness(c),
    },
    {
      key: "jurisdiction",
      header: "Jurisdiction",
      render: (c) => c.jurisdiction,
    },
    {
      key: "officer",
      header: "Assigned officer",
      render: (c) => c.reviewerName || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge kind="registration" status={c.status} />,
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Late registrations</h1>
        <p className="crvs-page-subtitle">
          Birth registrations submitted beyond the standard registration window, awaiting supervisor review.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No late registrations to review"
          emptyDescription="Every late registration currently in your queue has been resolved."
          emptyIcon="schedule"
        />
      </div>
    </div>
  );
}

export default function LateRegistrations() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.LATE_REGISTRATION_REVIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to this queue" />
        </div>
      }
    >
      <LateRegistrationsQueue />
    </RequirePermission>
  );
}
