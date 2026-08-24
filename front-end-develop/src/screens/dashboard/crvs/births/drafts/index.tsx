import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import CaseQueueTable from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import StructuredReasonModal from "@/components/crvs/modals/StructuredReasonModal";
import { demoListRegistrations, demoCancelRegistrationDraft } from "@/demo/services/crvsRegistrations";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { getCurrentAccountId, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { childDisplayName, formatDate, getActorName } from "../shared";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

/** Queue of the current officer's own DRAFT registration cases. */
export default function BirthRegistrationDrafts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BirthRegistrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toCancel, setToCancel] = useState<BirthRegistrationCase | undefined>();

  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT);
  const accountId = getCurrentAccountId();

  const load = () => {
    setLoading(true);
    setError(undefined);
    demoListRegistrations({ assignedOfficerId: accountId, limit: 100 })
      .then((res) => setRows(res.data.filter((c) => c.status === "DRAFT" && c.officerId === accountId)))
      .catch((err) => setError(err?.message || "Couldn't load your drafts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (reason: string) => {
    if (!toCancel) return;
    try {
      demoCancelRegistrationDraft(toCancel.id, reason, getActorName());
      setToCancel(undefined);
      load();
    } catch (err) {
      toastMessage("error", err);
    }
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">My draft registrations</h1>
        <p className="crvs-page-subtitle">Continue or cancel a registration you've started but not yet submitted.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button type="button" text="New registration" startIcon="add_circle" appearance="primary" onClick={() => navigate("/dashboard/crvs/births/new")} testId="drafts-new" />
      </div>

      <CaseQueueTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No drafts yet"
        emptyDescription="Start a new registration to see it here."
        emptyIcon="edit_document"
        getRowKey={(c) => c.id}
        columns={[
          { key: "reference", header: "Reference", render: (c) => c.reference },
          { key: "child", header: "Child", render: (c) => childDisplayName(c.child) },
          { key: "dob", header: "Date of birth", render: (c) => formatDate(c.dateOfBirth) },
          { key: "updated", header: "Last updated", render: (c) => formatDate(c.updatedAt) },
          { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
          {
            key: "actions",
            header: "",
            render: (c) => (
              <div className="crvs-table-action-cell" style={{ display: "flex", gap: 8 }}>
                <Button type="button" text="Continue" size="sm" appearance="primary" onClick={() => navigate(`/dashboard/crvs/births/${c.id}/edit`)} testId={`continue-draft-${c.id}`} />
                {canEdit && (
                  <Button type="button" text="Cancel" size="sm" appearance="ghost" color="red" onClick={() => setToCancel(c)} testId={`cancel-draft-${c.id}`} />
                )}
              </div>
            ),
          },
        ]}
      />

      <StructuredReasonModal
        show={!!toCancel}
        onClose={() => setToCancel(undefined)}
        onSubmit={(value) => handleCancel(value.reason)}
        title="Cancel this draft?"
        description={toCancel ? `Cancelling ${toCancel.reference} removes it from your active drafts. This can't be undone.` : undefined}
        reasonOptions={[
          { value: "Created in error", label: "Created in error" },
          { value: "Duplicate draft", label: "Duplicate draft" },
          { value: "No longer needed", label: "No longer needed" },
          { value: "Other", label: "Other" },
        ]}
        submitLabel="Cancel draft"
        destructive
        testId="cancel-draft"
      />
    </div>
  );
}
