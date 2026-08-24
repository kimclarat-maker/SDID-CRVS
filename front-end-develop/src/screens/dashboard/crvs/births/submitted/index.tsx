import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import CaseQueueTable from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import { demoListRegistrations } from "@/demo/services/crvsRegistrations";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { getCurrentAccountId } from "@/utils/workspace";
import { childDisplayName, formatDate, SOURCE_TYPE_LABELS } from "../shared";
import "../../shared.css";

const NON_SUBMITTED: BirthRegistrationCase["status"][] = ["DRAFT", "CANCELLED"];

/** Queue of the current officer's submitted-and-beyond registration cases —
 * everything past DRAFT, including cases already routed to review,
 * correction, late/exception review, or a final decision. */
export default function BirthRegistrationSubmitted() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const accountId = getCurrentAccountId();

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ assignedOfficerId: accountId, limit: 200 })
      .then((res) => setRows(res.data.filter((c) => c.officerId === accountId && !NON_SUBMITTED.includes(c.status))))
      .catch((err) => setError(err?.message || "Couldn't load your submitted cases."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">My submitted registrations</h1>
        <p className="crvs-page-subtitle">Every registration case you've submitted, from review through to a final decision.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <CaseQueueTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No submitted cases yet"
        emptyDescription="Cases you submit will appear here."
        emptyIcon="outgoing_mail"
        getRowKey={(c) => c.id}
        columns={[
          { key: "reference", header: "Reference", render: (c) => c.reference },
          { key: "child", header: "Child", render: (c) => childDisplayName(c.child) },
          { key: "source", header: "Source", render: (c) => SOURCE_TYPE_LABELS[c.sourceType] },
          { key: "submitted", header: "Submitted", render: (c) => formatDate(c.submittedAt) },
          { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
          {
            key: "actions",
            header: "",
            render: (c) => (
              <div className="crvs-table-action-cell">
                <Button type="button" text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/births/${c.id}`)} testId={`view-submitted-${c.id}`} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
