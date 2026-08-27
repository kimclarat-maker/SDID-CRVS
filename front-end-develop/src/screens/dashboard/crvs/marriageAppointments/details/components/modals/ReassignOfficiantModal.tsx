import { useEffect, useState } from "react";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { getCurrentActorName } from "@/utils/workspace";
import { demoReassignMarriageOfficiant } from "@/demo/services/crvsMarriageAppointments";
import { MarriageAppointment } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";

export type ReassignOfficiantModalProps = {
  show: boolean;
  onClose: () => void;
  appointment: MarriageAppointment;
  onReassigned: (appointment: MarriageAppointment) => void;
};

/** Small wrapper around ConfirmActionModal (same shape as marriageApplications'
 * BulkAssignModal) — reassigns the officiant recorded on an appointment. */
export default function ReassignOfficiantModal({ show, onClose, appointment, onReassigned }: ReassignOfficiantModalProps) {
  const [officiantId, setOfficiantId] = useState("");
  const [officiantName, setOfficiantName] = useState("");

  useEffect(() => {
    if (!show) return;
    setOfficiantId(appointment.officiantId || "");
    setOfficiantName(appointment.officiantName || "");
  }, [show, appointment]);

  return (
    <ConfirmActionModal
      show={show}
      onClose={onClose}
      title="Reassign officiant"
      description={appointment.reference}
      confirmLabel="Reassign"
      disabled={!officiantId.trim() || !officiantName.trim()}
      testId="reassign-officiant-modal"
      onConfirm={async () => {
        const actorName = getCurrentActorName();
        const updated = demoReassignMarriageOfficiant(appointment.id, officiantId.trim(), officiantName.trim(), actorName);
        toastMessage("success", `${updated.reference} reassigned to ${updated.officiantName}.`);
        onReassigned(updated);
      }}
    >
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="reassign-officiant-id">Officiant account / ID</label>
          <input id="reassign-officiant-id" value={officiantId} onChange={(e) => setOfficiantId(e.target.value)} data-testid="reassign-officiant-id" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="reassign-officiant-name">Officiant name</label>
          <input id="reassign-officiant-name" value={officiantName} onChange={(e) => setOfficiantName(e.target.value)} data-testid="reassign-officiant-name" />
        </div>
      </div>
    </ConfirmActionModal>
  );
}
