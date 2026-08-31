import { useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import Icon from "@/components/icon";
import { demoReassignAnnulmentCase } from "@/demo/services/crvsAnnulmentRegistrations";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { ANNULMENT_REGISTRATION_OFFICER_DEMO_ID, ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME } from "@/demo/seed/crvsAccounts";

/**
 * The annulment queue's only bulk action, mirroring BulkAssignDivorceModal
 * exactly: assignment. There is deliberately no bulk approve, reject,
 * register or exception-resolve anywhere in this module — each of those is a
 * legal decision taken one case at a time.
 */
export default function BulkAssignAnnulmentModal({
  show,
  onClose,
  registrationIds,
  onAssigned,
}: {
  show: boolean;
  onClose: () => void;
  registrationIds: string[];
  onAssigned: () => void;
}) {
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setAssigneeName("");
    setAssigneeId("");
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    if (registrationIds.length === 0) throw new Error("Select at least one case to assign.");
    if (!reason.trim()) throw new Error("A reason is required so the reassignment is explainable in the audit trail.");
    const name = assigneeName.trim() || ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME;
    const id = assigneeId.trim() || ANNULMENT_REGISTRATION_OFFICER_DEMO_ID;
    const actorName = getCurrentActorName();
    const failures: string[] = [];
    for (const registrationId of registrationIds) {
      try {
        await demoReassignAnnulmentCase(registrationId, id, name, reason.trim(), actorName);
      } catch (err) {
        failures.push(err instanceof Error ? err.message : registrationId);
      }
    }
    if (failures.length > 0) {
      toastMessage("warning", `Assigned ${registrationIds.length - failures.length} of ${registrationIds.length} case(s). ${failures.length} failed.`);
    } else {
      toastMessage("success", `Assigned ${registrationIds.length} case(s) to ${name}.`);
    }
    onAssigned();
    handleClose();
  };

  return (
    <ConfirmActionModal
      show={show}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Assign annulment cases"
      description={`${registrationIds.length} case(s) selected`}
      confirmLabel="Assign"
      disabled={registrationIds.length === 0}
      testId="bulk-assign-annulment-modal"
    >
      <div className="crvs-banner crvs-banner-info" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
        <Icon name="info" />
        <span>Assignment is the only bulk action available on annulment cases. Approval, rejection, registration and exception resolution are always taken one case at a time.</span>
      </div>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="bulk-assign-annulment-name">Assign to (name)</label>
          <input id="bulk-assign-annulment-name" value={assigneeName} placeholder={ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME} onChange={(e) => setAssigneeName(e.target.value)} data-testid="bulk-assign-annulment-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="bulk-assign-annulment-id">Assign to (account)</label>
          <input id="bulk-assign-annulment-id" value={assigneeId} placeholder={ANNULMENT_REGISTRATION_OFFICER_DEMO_ID} onChange={(e) => setAssigneeId(e.target.value)} data-testid="bulk-assign-annulment-id" />
        </div>
      </div>
      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="bulk-assign-annulment-reason">Reason</label>
        <textarea id="bulk-assign-annulment-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="bulk-assign-annulment-reason" />
      </div>
    </ConfirmActionModal>
  );
}
