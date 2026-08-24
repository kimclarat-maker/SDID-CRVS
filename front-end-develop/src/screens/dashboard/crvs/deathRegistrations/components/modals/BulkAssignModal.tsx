import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { demoReassignDeathCase } from "@/demo/services/crvsDeathRegistrations";
import { getCurrentActorName } from "@/utils/workspace";

/** Bulk assignment only — per spec §6 explicitly excludes bulk approve/
 * reject, which stay single-case, maker-checker-gated actions. */
export default function BulkAssignModal({
  show,
  onClose,
  caseIds,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  caseIds: string[];
  onAssigned: () => void;
}) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Bulk assign cases"
      description={`${caseIds.length} case${caseIds.length === 1 ? "" : "s"} selected`}
      confirmLabel="Assign"
      disabled={!assigneeName.trim() || !assigneeId.trim()}
      testId="bulk-assign-modal"
      onConfirm={async () => {
        const actorName = getCurrentActorName();
        caseIds.forEach((id) => demoReassignDeathCase(id, assigneeId, assigneeName, "Bulk assignment", actorName));
        onAssigned();
        setAssigneeName("");
        setAssigneeId("");
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="bulk-assignee-name">Assignee name</label>
          <input id="bulk-assignee-name" value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} data-testid="bulk-assign-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="bulk-assignee-id">Assignee account / email</label>
          <input id="bulk-assignee-id" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} data-testid="bulk-assign-id" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}
