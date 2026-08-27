import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { demoReassignMarriageCase } from "@/demo/services/crvsMarriageApplications";
import { getCurrentActorName } from "@/utils/workspace";

/** Bulk assignment only — never bulk approve/reject/register, which stay
 * single-case, maker-checker-gated actions (spec §7). */
export default function BulkAssignModal({
  show,
  onClose,
  applicationIds,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  applicationIds: string[];
  onAssigned: () => void;
}) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Bulk assign applications"
      description={`${applicationIds.length} application${applicationIds.length === 1 ? "" : "s"} selected`}
      confirmLabel="Assign"
      disabled={!assigneeName.trim() || !assigneeId.trim()}
      testId="marriage-bulk-assign-modal"
      onConfirm={async () => {
        const actorName = getCurrentActorName();
        applicationIds.forEach((id) => demoReassignMarriageCase(id, assigneeId, assigneeName, "Bulk assignment", actorName));
        onAssigned();
        setAssigneeName("");
        setAssigneeId("");
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="marriage-bulk-assignee-name">Assignee name</label>
          <input id="marriage-bulk-assignee-name" value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} data-testid="marriage-bulk-assign-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="marriage-bulk-assignee-id">Assignee account / email</label>
          <input id="marriage-bulk-assignee-id" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} data-testid="marriage-bulk-assign-id" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}
