// Pure availability computation for the marriage-appointment calendar.
// Deliberately not adapted from src/demo/seed/appointments.ts /
// src/demo/services/appointments.ts — those operate on the unrelated
// legacy SDID-enrolment appointment model with no capacity or collision
// concept at all. Availability here is always a DERIVED display value read
// from marriagePolicyConfig, never a persisted flag on the appointment
// record itself — consistent with how death computes `isLateDeathReporting`
// rather than storing a redundant boolean.
import { MarriageAppointment } from "./types";
import { capacityFor, isBlockedDate, isSpecialDay, marriagePolicyConfig } from "./marriagePolicyConfig";

export type SlotAvailabilityStatus = "AVAILABLE" | "RESERVED" | "FULL" | "BLOCKED" | "HOLIDAY";

export type SlotAvailability = {
  status: SlotAvailabilityStatus;
  capacity: number;
  booked: number;
  isSpecialDay: boolean;
};

const isWithinMinLeadTime = (date: string): boolean => {
  const target = new Date(date).getTime();
  const now = Date.now();
  if (Number.isNaN(target)) return false;
  const leadMs = marriagePolicyConfig.appointmentCapacity.minBookingLeadDays * 24 * 60 * 60 * 1000;
  return target - now < leadMs;
};

/** Computes the derived availability state for one office+date, given the
 * appointments already booked there. Booked count only counts appointments
 * that still hold a slot (SCHEDULED/RESCHEDULE_REQUESTED/CANCEL_REQUESTED —
 * a request in flight still occupies the slot until resolved). */
export function computeSlotAvailability(
  officeId: string,
  date: string,
  existingAppointments: MarriageAppointment[],
  excludeAppointmentId?: string
): SlotAvailability {
  const special = isSpecialDay(date);
  const capacity = capacityFor(date);

  if (isBlockedDate(date)) {
    return { status: "HOLIDAY", capacity, booked: 0, isSpecialDay: special };
  }

  const booked = existingAppointments.filter(
    (a) =>
      a.id !== excludeAppointmentId &&
      a.officeId === officeId &&
      a.date.slice(0, 10) === date.slice(0, 10) &&
      (a.status === "SCHEDULED" || a.status === "RESCHEDULE_REQUESTED" || a.status === "CANCEL_REQUESTED")
  ).length;

  if (isWithinMinLeadTime(date)) {
    return { status: "BLOCKED", capacity, booked, isSpecialDay: special };
  }
  if (booked >= capacity) {
    return { status: "FULL", capacity, booked, isSpecialDay: special };
  }
  if (booked > 0) {
    return { status: "RESERVED", capacity, booked, isSpecialDay: special };
  }
  return { status: "AVAILABLE", capacity, booked, isSpecialDay: special };
}

/** Scans forward from `fromDate` (inclusive) for the next date at the given
 * office that isn't FULL, BLOCKED, or HOLIDAY — used by the wizard's
 * "select proposed date" step and the calendar's quick-book action. */
export function nextAvailableSlot(
  officeId: string,
  fromDate: string,
  existingAppointments: MarriageAppointment[],
  maxDaysToScan = 60
): string | undefined {
  const start = new Date(fromDate);
  if (Number.isNaN(start.getTime())) return undefined;
  for (let i = 0; i < maxDaysToScan; i++) {
    const candidate = new Date(start);
    candidate.setDate(candidate.getDate() + i);
    const iso = candidate.toISOString().slice(0, 10);
    const availability = computeSlotAvailability(officeId, iso, existingAppointments);
    if (availability.status === "AVAILABLE" || availability.status === "RESERVED") {
      return iso;
    }
  }
  return undefined;
}
