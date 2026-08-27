import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { getCurrentAccountId, getCurrentActorName } from "@/utils/workspace";
import { demoScheduleMarriageAppointment, demoGetSlotAvailability } from "@/demo/services/crvsMarriageAppointments";
import { demoListMarriageApplications } from "@/demo/services/crvsMarriageApplications";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MARRIAGE_OFFICIANT_DEMO_ID, MARRIAGE_OFFICIANT_DEMO_NAME } from "@/demo/seed/crvsAccounts";
import { MarriageApplication, MarriageAppointment } from "@/domain/crvs/types";
import { applicantDisplayName } from "../../../marriageShared";
import toastMessage from "@/utils/common/toastMessage";

export function generateTimeSlots(): string[] {
  const { officeOpenTime, officeCloseTime, slotDurationMinutes } = marriagePolicyConfig.appointmentCapacity;
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const start = toMinutes(officeOpenTime);
  const end = toMinutes(officeCloseTime);
  const slots: string[] = [];
  for (let t = start; t + slotDurationMinutes <= end; t += slotDurationMinutes) {
    slots.push(`${toTime(t)}-${toTime(t + slotDurationMinutes)}`);
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

export type ScheduleAppointmentModalProps = {
  show: boolean;
  onClose: () => void;
  defaultApplicationId?: string;
  defaultDate?: string;
  officeId: string;
  officeName: string;
  onScheduled: (appointment: MarriageAppointment) => void;
};

/** Custom-form modal for booking a marriage-ceremony appointment (spec §6) —
 * dropped to the raw Modal primitive per the "genuinely custom forms" carve-
 * out in the shared modal conventions, since none of the generic
 * confirm/reason/warning primitives have a live-availability display or a
 * date/time/officiant form. When reached without an applicationId in the
 * URL, includes a small application picker over APPROVED applications
 * (only APPROVED applications may transition to APPOINTMENT_SCHEDULED). */
export default function ScheduleAppointmentModal({ show, onClose, defaultApplicationId, defaultDate, officeId, officeName, onScheduled }: ScheduleAppointmentModalProps) {
  const [applicationId, setApplicationId] = useState(defaultApplicationId || "");
  const [applications, setApplications] = useState<MarriageApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [date, setDate] = useState(defaultDate || "");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0] || "");
  const [officiantId, setOfficiantId] = useState(MARRIAGE_OFFICIANT_DEMO_ID);
  const [officiantName, setOfficiantName] = useState(MARRIAGE_OFFICIANT_DEMO_NAME);
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!show) return;
    setApplicationId(defaultApplicationId || "");
    setDate(defaultDate || "");
    setTimeSlot(TIME_SLOTS[0] || "");
    setOfficiantId(MARRIAGE_OFFICIANT_DEMO_ID);
    setOfficiantName(MARRIAGE_OFFICIANT_DEMO_NAME);
    setRoom("");
    setNotes("");
    setError(undefined);

    if (!defaultApplicationId) {
      setLoadingApplications(true);
      demoListMarriageApplications({ status: "APPROVED", limit: 50 })
        .then((res) => setApplications(res.data))
        .catch(() => setApplications([]))
        .finally(() => setLoadingApplications(false));
    }
  }, [show, defaultApplicationId, defaultDate]);

  const availability = useMemo(() => {
    if (!date) return undefined;
    return demoGetSlotAvailability(officeId, date);
  }, [officeId, date, show]);

  const dateBlocked = availability && (availability.status === "FULL" || availability.status === "BLOCKED" || availability.status === "HOLIDAY");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!applicationId) {
      setError("Select an application.");
      return;
    }
    if (!date) {
      setError("Select a date.");
      return;
    }
    if (!timeSlot) {
      setError("Select a time slot.");
      return;
    }
    if (dateBlocked) {
      setError("This date is not available for booking. Choose a different date.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const actorId = getCurrentAccountId() || "";
      const actorName = getCurrentActorName();
      const appointment = demoScheduleMarriageAppointment(
        {
          applicationId,
          officeId,
          officeName,
          date,
          timeSlot,
          officiantId: officiantId.trim() || undefined,
          officiantName: officiantId.trim() ? officiantName.trim() || undefined : undefined,
          room: room.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        actorId,
        actorName
      );
      toastMessage("success", `Appointment ${appointment.reference} scheduled for ${date} ${timeSlot}.`);
      onScheduled(appointment);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't schedule this appointment.";
      setError(message);
      toastMessage("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Schedule appointment" description={officeName} size="sm" testId="schedule-appointment-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {!defaultApplicationId && (
          <div className="crvs-form-group">
            <label htmlFor="sched-application">Application</label>
            <select id="sched-application" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} disabled={loadingApplications} data-testid="schedule-application">
              <option value="">{loadingApplications ? "Loading approved applications…" : "Select an approved application…"}</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.reference} — {applicantDisplayName(a.applicant1)} &amp; {applicantDisplayName(a.applicant2)}
                </option>
              ))}
            </select>
            {!loadingApplications && applications.length === 0 && <p className="crvs-form-hint">No approved applications are awaiting an appointment right now.</p>}
          </div>
        )}

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="sched-date">Date</label>
            <input id="sched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="schedule-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sched-slot">Time slot</label>
            <select id="sched-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} data-testid="schedule-timeslot">
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {date && availability && (
          <div className={`crvs-banner ${dateBlocked ? "crvs-banner-danger" : availability.status === "RESERVED" ? "crvs-banner-warning" : "crvs-banner-info"}`}>
            {availability.status === "AVAILABLE" && `Available — ${availability.booked} of ${availability.capacity} slots booked.`}
            {availability.status === "RESERVED" && `Filling up — ${availability.booked} of ${availability.capacity} slots booked.`}
            {availability.status === "FULL" && "This date is fully booked at this office. Choose a different date."}
            {availability.status === "BLOCKED" && `Appointments must be booked at least ${marriagePolicyConfig.appointmentCapacity.minBookingLeadDays} days in advance.`}
            {availability.status === "HOLIDAY" && "This date is a designated office-closure day."}
            {availability.isSpecialDay && " This is a designated high-volume ceremony date (special-day fee applies)."}
          </div>
        )}

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="sched-officiant-id">Officiant account / ID (optional)</label>
            <input id="sched-officiant-id" value={officiantId} onChange={(e) => setOfficiantId(e.target.value)} data-testid="schedule-officiant-id" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sched-officiant-name">Officiant name (optional)</label>
            <input id="sched-officiant-name" value={officiantName} onChange={(e) => setOfficiantName(e.target.value)} data-testid="schedule-officiant-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sched-room">Room (optional)</label>
            <input id="sched-room" value={room} onChange={(e) => setRoom(e.target.value)} data-testid="schedule-room" />
          </div>
        </div>

        <div className="crvs-form-group">
          <label htmlFor="sched-notes">Notes (optional)</label>
          <textarea id="sched-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="schedule-notes" />
        </div>

        {error && (
          <p className="crvs-banner crvs-banner-danger" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button type="button" text="Cancel" appearance="ghost" onClick={handleClose} disabled={submitting} testId="schedule-appointment-cancel" />
        <Button
          type="button"
          text="Schedule"
          appearance="primary"
          loading={submitting}
          disabled={submitting || !applicationId || !date || !timeSlot || Boolean(dateBlocked)}
          onClick={handleSubmit}
          testId="schedule-appointment-confirm"
        />
      </div>
    </Modal>
  );
}
