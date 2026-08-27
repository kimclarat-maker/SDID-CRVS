// Marriage-appointment scheduling — a genuinely new sub-entity with no
// birth/death precedent. Capacity/collision checking happens inside the
// single updateDemoData() mutation at write time (never pre-checked then
// written separately), so two concurrent bookings against an over-capacity
// slot can never both succeed. Built fresh rather than adapted from
// src/demo/seed/appointments.ts / src/demo/services/appointments.ts, which
// operate on the unrelated legacy SDID-enrolment appointment model with no
// capacity concept at all.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { MarriageAppointment, MarriageRescheduleEntry, MarriageCancellationEntry } from "@/domain/crvs/types";
import { assertTransitionMarriageAppointment, assertTransitionMarriageApplication } from "@/domain/crvs/statusMachines";
import { computeSlotAvailability } from "@/domain/crvs/marriageAppointmentAvailability";
import { isSpecialDay, marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError, SlotUnavailableError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

export type MarriageAppointmentListParams = {
  officeId?: string;
  officiantId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListMarriageAppointments = async (params: MarriageAppointmentListParams) => {
  const db = getDemoData();
  let results = db.crvsMarriageAppointments;
  if (params.officeId) results = results.filter((a) => a.officeId === params.officeId);
  if (params.officiantId) results = results.filter((a) => a.officiantId === params.officiantId);
  if (params.status) results = results.filter((a) => a.status === params.status!.toUpperCase());
  if (params.dateFrom) results = results.filter((a) => a.date >= params.dateFrom!);
  if (params.dateTo) results = results.filter((a) => a.date <= params.dateTo!);
  results = [...results].sort((a, b) => (a.date > b.date ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 100;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetMarriageAppointment = async (id: string): Promise<MarriageAppointment | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsMarriageAppointments.find((a) => a.id === id || a.reference === id));
};

export const demoGetSlotAvailability = (officeId: string, date: string) => {
  const db = getDemoData();
  return computeSlotAvailability(officeId, date, db.crvsMarriageAppointments);
};

const nextAppointmentReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsMarriageAppointments.length + 1;
  return `MA-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

export type ScheduleMarriageAppointmentInput = {
  applicationId: string;
  officeId: string;
  officeName: string;
  date: string;
  timeSlot: string;
  officiantId?: string;
  officiantName?: string;
  room?: string;
  notes?: string;
};

export const demoScheduleMarriageAppointment = (
  input: ScheduleMarriageAppointmentInput,
  actorId: string,
  actorName: string
): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === input.applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    assertTransitionMarriageApplication(app.status, "APPOINTMENT_SCHEDULED");

    const availability = computeSlotAvailability(input.officeId, input.date, db.crvsMarriageAppointments);
    if (availability.status === "FULL") throw new SlotUnavailableError("This date is fully booked at the selected office. Choose a different date.");
    if (availability.status === "BLOCKED") throw new SlotUnavailableError(`Appointments must be booked at least ${marriagePolicyConfig.appointmentCapacity.minBookingLeadDays} days in advance.`);
    if (availability.status === "HOLIDAY") throw new SlotUnavailableError("This date is a designated office-closure day.");

    const now = new Date().toISOString();
    const appointment: MarriageAppointment = {
      id: nextId("MA"),
      reference: nextAppointmentReference(db),
      applicationId: app.id,
      applicationReference: app.reference,
      status: "SCHEDULED",
      officeId: input.officeId,
      officeName: input.officeName,
      date: input.date,
      timeSlot: input.timeSlot,
      isSpecialDay: isSpecialDay(input.date),
      officiantId: input.officiantId,
      officiantName: input.officiantName,
      room: input.room,
      scheduledBy: actorId,
      scheduledByName: actorName,
      scheduledAt: now,
      rescheduleHistory: [],
      cancellationHistory: [],
      notes: input.notes,
    };
    db.crvsMarriageAppointments.unshift(appointment);

    app.status = "APPOINTMENT_SCHEDULED";
    app.appointmentId = appointment.id;
    app.appointmentReference = appointment.reference;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "APPOINTMENT_SCHEDULED", at: now, by: actorName });

    logCrvsAudit(db, actorName, "scheduled appointment", "crvs.marriage_appointment", app.reference, `${appointment.reference} at ${input.officeName} on ${input.date} ${input.timeSlot}.`);
    result = appointment;
    return db;
  });
  return result!;
};

export const demoRequestMarriageAppointmentReschedule = (
  appointmentId: string,
  requestedBy: "APPLICANT" | "STAFF",
  reason: string,
  preferredDate: string | undefined,
  actorName: string
): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new NotFoundError("Marriage appointment");
    assertTransitionMarriageAppointment(appointment.status, "RESCHEDULE_REQUESTED");
    appointment.status = "RESCHEDULE_REQUESTED";
    appointment.pendingRescheduleRequest = { requestedBy, requestedAt: new Date().toISOString(), reason, preferredDate };
    logCrvsAudit(db, actorName, "requested reschedule", "crvs.marriage_appointment", appointment.reference, reason);
    result = appointment;
    return db;
  });
  return result!;
};

/** Only staff can finalize a reschedule onto a new slot — an applicant's own
 * request is never allowed to directly overwrite an approved appointment
 * (spec §6 "must NOT allow applicants to directly overwrite an approved
 * appointment without staff review"). */
export const demoApproveMarriageAppointmentReschedule = (
  appointmentId: string,
  newDate: string,
  newTimeSlot: string,
  actorName: string
): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new NotFoundError("Marriage appointment");

    const availability = computeSlotAvailability(appointment.officeId, newDate, db.crvsMarriageAppointments, appointment.id);
    if (availability.status === "FULL" || availability.status === "BLOCKED" || availability.status === "HOLIDAY") {
      throw new SlotUnavailableError();
    }

    const now = new Date().toISOString();
    const historyEntry: MarriageRescheduleEntry = {
      requestedBy: appointment.pendingRescheduleRequest?.requestedBy || "STAFF",
      requestedAt: appointment.pendingRescheduleRequest?.requestedAt || now,
      previousDate: appointment.date,
      previousTimeSlot: appointment.timeSlot,
      reason: appointment.pendingRescheduleRequest?.reason || "Staff-initiated reschedule.",
      approvedBy: actorName,
      approvedAt: now,
    };
    appointment.rescheduleHistory.push(historyEntry);
    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
    appointment.isSpecialDay = isSpecialDay(newDate);
    appointment.status = "SCHEDULED";
    appointment.pendingRescheduleRequest = undefined;

    logCrvsAudit(db, actorName, "rescheduled appointment", "crvs.marriage_appointment", appointment.reference, `Moved to ${newDate} ${newTimeSlot}.`);
    result = appointment;
    return db;
  });
  return result!;
};

export const demoRequestMarriageAppointmentCancel = (
  appointmentId: string,
  requestedBy: "APPLICANT" | "STAFF",
  reason: string,
  actorName: string
): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new NotFoundError("Marriage appointment");
    if (requestedBy === "STAFF") {
      return db; // staff cancels directly via demoCancelMarriageAppointment
    }
    assertTransitionMarriageAppointment(appointment.status, "CANCEL_REQUESTED");
    appointment.status = "CANCEL_REQUESTED";
    appointment.pendingCancelRequest = { requestedBy, requestedAt: new Date().toISOString(), reason };
    logCrvsAudit(db, actorName, "requested cancellation", "crvs.marriage_appointment", appointment.reference, reason);
    result = appointment;
    return db;
  });
  return result!;
};

export const demoCancelMarriageAppointment = (appointmentId: string, reason: string, actorName: string): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new NotFoundError("Marriage appointment");
    assertTransitionMarriageAppointment(appointment.status, "CANCELLED");
    const now = new Date().toISOString();
    const entry: MarriageCancellationEntry = { requestedBy: "STAFF", reason, at: now, by: actorName };
    appointment.cancellationHistory.push(entry);
    appointment.status = "CANCELLED";
    appointment.pendingCancelRequest = undefined;

    const app = db.crvsMarriageApplications.find((a) => a.id === appointment.applicationId);
    if (app && app.status === "APPOINTMENT_SCHEDULED") {
      assertTransitionMarriageApplication(app.status, "CANCELLED");
      app.status = "CANCELLED";
      app.cancelledAt = now;
      app.cancellationReason = reason;
      app.updatedAt = now;
      app.version += 1;
      app.statusHistory.push({ status: "CANCELLED", at: now, by: actorName, note: reason });
    }

    logCrvsAudit(db, actorName, "cancelled appointment", "crvs.marriage_appointment", appointment.reference, reason);
    result = appointment;
    return db;
  });
  return result!;
};

export const demoReassignMarriageOfficiant = (
  appointmentId: string,
  officiantId: string,
  officiantName: string,
  actorName: string
): MarriageAppointment => {
  let result: MarriageAppointment | undefined;
  updateDemoData((db) => {
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new NotFoundError("Marriage appointment");
    appointment.officiantId = officiantId;
    appointment.officiantName = officiantName;
    logCrvsAudit(db, actorName, "reassigned officiant", "crvs.marriage_appointment", appointment.reference, `Assigned to ${officiantName}.`);
    result = appointment;
    return db;
  });
  return result!;
};
