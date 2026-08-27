import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { getCurrentActorName } from "@/utils/workspace";
import { demoApproveMarriageAppointmentReschedule, demoGetSlotAvailability } from "@/demo/services/crvsMarriageAppointments";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageAppointment } from "@/domain/crvs/types";
import { TIME_SLOTS } from "../../../components/modals/ScheduleAppointmentModal";
import toastMessage from "@/utils/common/toastMessage";

export type ApproveRescheduleModalProps = {
  show: boolean;
  onClose: () => void;
  appointment: MarriageAppointment;
  onApproved: (appointment: MarriageAppointment) => void;
};

/** Staff-only finalization of a pending reschedule request onto a new
 * slot — a custom form (date/time + live availability) rather than a
 * generic primitive composition, since it needs the same live-availability
 * display as scheduling itself (spec §6: "must NOT allow applicants to
 * directly overwrite an approved appointment without staff review"). */
export default function ApproveRescheduleModal({ show, onClose, appointment, onApproved }: ApproveRescheduleModalProps) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0] || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!show) return;
    setDate(appointment.pendingRescheduleRequest?.preferredDate?.slice(0, 10) || appointment.date.slice(0, 10));
    setTimeSlot(appointment.timeSlot);
    setError(undefined);
  }, [show, appointment]);

  const availability = useMemo(() => {
    if (!date) return undefined;
    return demoGetSlotAvailability(appointment.officeId, date);
  }, [appointment.officeId, date, show]);

  const dateBlocked = availability && (availability.status === "FULL" || availability.status === "BLOCKED" || availability.status === "HOLIDAY");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!date || !timeSlot) {
      setError("Select a date and time slot.");
      return;
    }
    if (dateBlocked) {
      setError("This date is not available. Choose a different date.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const actorName = getCurrentActorName();
      const updated = demoApproveMarriageAppointmentReschedule(appointment.id, date, timeSlot, actorName);
      toastMessage("success", `Appointment ${updated.reference} rescheduled to ${date} ${timeSlot}.`);
      onApproved(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't approve this reschedule.";
      setError(message);
      toastMessage("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Approve reschedule" description={appointment.reference} size="sm" testId="approve-reschedule-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {appointment.pendingRescheduleRequest && (
          <div className="crvs-banner crvs-banner-info">
            Requested by {appointment.pendingRescheduleRequest.requestedBy.toLowerCase()}: {appointment.pendingRescheduleRequest.reason}
          </div>
        )}
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="approve-reschedule-date">New date</label>
            <input id="approve-reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="approve-reschedule-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="approve-reschedule-slot">New time slot</label>
            <select id="approve-reschedule-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} data-testid="approve-reschedule-slot">
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>
        {date && availability && (
          <div className={`crvs-banner ${dateBlocked ? "crvs-banner-danger" : "crvs-banner-info"}`}>
            {availability.status === "AVAILABLE" && `Available — ${availability.booked} of ${availability.capacity} slots booked.`}
            {availability.status === "RESERVED" && `Filling up — ${availability.booked} of ${availability.capacity} slots booked.`}
            {availability.status === "FULL" && "This date is fully booked. Choose a different date."}
            {availability.status === "BLOCKED" && `Appointments must be booked at least ${marriagePolicyConfig.appointmentCapacity.minBookingLeadDays} days in advance.`}
            {availability.status === "HOLIDAY" && "This date is a designated office-closure day."}
          </div>
        )}
        {error && (
          <p className="crvs-banner crvs-banner-danger" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="approve-reschedule-cancel" />
        <Button
          type="button"
          text="Approve reschedule"
          appearance="primary"
          loading={submitting}
          disabled={submitting || !date || !timeSlot || Boolean(dateBlocked)}
          onClick={handleSubmit}
          testId="approve-reschedule-confirm"
        />
      </div>
    </Modal>
  );
}
