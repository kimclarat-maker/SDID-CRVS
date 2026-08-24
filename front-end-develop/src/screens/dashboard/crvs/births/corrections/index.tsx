import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import CaseQueueTable from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import { demoListRegistrations } from "@/demo/services/crvsRegistrations";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { getCurrentAccountId } from "@/utils/workspace";
import { childDisplayName, formatDate } from "../shared";
import "../../shared.css";

/** Queue of the current officer's CORRECTION_REQUIRED cases, each linking to
 * the correction page for that case. */
export default function BirthRegistrationCorrections() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const accountId = getCurrentAccountId();

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ assignedOfficerId: accountId, status: "CORRECTION_REQUIRED", limit: 100 })
      .then((res) => setRows(res.data.filter((c) => c.officerId === accountId)))
      .catch((err) => setError(err?.message || "Couldn't load your corrections."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dueDateOf = (c: BirthRegistrationCase) => {
    const open = c.correctionRequests.find((r) => !r.resolvedAt);
    const due = open?.items.map((i) => i.dueDate).find(Boolean);
    return due ? formatDate(due) : "—";
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Corrections requested</h1>
        <p className="crvs-page-subtitle">Cases returned to you with required changes before they can go back to review.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <CaseQueueTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No corrections requested"
        emptyDescription="Cases a registrar returns for correction will appear here."
        emptyIcon="edit_note"
        getRowKey={(c) => c.id}
        columns={[
          { key: "reference", header: "Reference", render: (c) => c.reference },
          { key: "child", header: "Child", render: (c) => childDisplayName(c.child) },
          { key: "due", header: "Due date", render: (c) => dueDateOf(c) },
          { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
          {
            key: "actions",
            header: "",
            render: (c) => (
              <div className="crvs-table-action-cell">
                <Button type="button" text="Respond" size="sm" appearance="primary" onClick={() => navigate(`/dashboard/crvs/births/${c.id}/correct`)} testId={`respond-correction-${c.id}`} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
