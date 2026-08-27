import { describe, expect, it } from "vitest";
import { computeSlotAvailability, nextAvailableSlot } from "@/domain/crvs/marriageAppointmentAvailability";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageAppointment } from "@/domain/crvs/types";

const OFFICE = "OFF-TEST";

function appointment(overrides: Partial<MarriageAppointment> & Pick<MarriageAppointment, "id" | "date">): MarriageAppointment {
  return {
    reference: `MA-TEST-${overrides.id}`,
    applicationId: "app-1",
    applicationReference: "MR-TEST",
    status: "SCHEDULED",
    officeId: OFFICE,
    officeName: "Test Office",
    timeSlot: "09:00-09:30",
    isSpecialDay: false,
    scheduledBy: "officer",
    scheduledByName: "Officer",
    scheduledAt: new Date().toISOString(),
    rescheduleHistory: [],
    cancellationHistory: [],
    ...overrides,
  };
}

const farFutureDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

describe("computeSlotAvailability", () => {
  it("marks a date within the minimum booking lead time as BLOCKED", () => {
    const availability = computeSlotAvailability(OFFICE, farFutureDate(0), []);
    expect(availability.status).toBe("BLOCKED");
  });

  it("marks a configured blocked/holiday date as HOLIDAY even far in the future", () => {
    const holidayDate = marriagePolicyConfig.appointmentCapacity.blockedDates[0];
    const availability = computeSlotAvailability(OFFICE, holidayDate, []);
    expect(availability.status).toBe("HOLIDAY");
  });

  it("is AVAILABLE with zero bookings on a normal future date", () => {
    const availability = computeSlotAvailability(OFFICE, farFutureDate(30), []);
    expect(availability.status).toBe("AVAILABLE");
    expect(availability.booked).toBe(0);
  });

  it("becomes RESERVED once at least one slot is booked but under capacity", () => {
    const date = farFutureDate(30);
    const existing = [appointment({ id: "1", date })];
    const availability = computeSlotAvailability(OFFICE, date, existing);
    expect(availability.status).toBe("RESERVED");
    expect(availability.booked).toBe(1);
  });

  it("becomes FULL once bookings reach the standard daily capacity", () => {
    const date = farFutureDate(30);
    const capacity = marriagePolicyConfig.appointmentCapacity.standardSlotsPerOfficePerDay;
    const existing = Array.from({ length: capacity }, (_, i) => appointment({ id: `${i}`, date }));
    const availability = computeSlotAvailability(OFFICE, date, existing);
    expect(availability.status).toBe("FULL");
  });

  it("uses the higher special-day capacity on a designated special day", () => {
    const specialDate = marriagePolicyConfig.specialDay.designatedDates[0];
    const availability = computeSlotAvailability(OFFICE, specialDate, []);
    expect(availability.isSpecialDay).toBe(true);
    expect(availability.capacity).toBe(marriagePolicyConfig.appointmentCapacity.specialDaySlotsPerOfficePerDay);
  });

  it("excludes cancelled/completed appointments from the booked count", () => {
    const date = farFutureDate(30);
    const existing = [appointment({ id: "1", date, status: "CANCELLED" }), appointment({ id: "2", date, status: "COMPLETED" })];
    const availability = computeSlotAvailability(OFFICE, date, existing);
    expect(availability.booked).toBe(0);
    expect(availability.status).toBe("AVAILABLE");
  });

  it("excludes the appointment being rescheduled itself from its own booked count", () => {
    const date = farFutureDate(30);
    const existing = [appointment({ id: "1", date })];
    const availability = computeSlotAvailability(OFFICE, date, existing, "1");
    expect(availability.booked).toBe(0);
  });
});

describe("nextAvailableSlot", () => {
  it("finds the first non-full, non-blocked date at or after the given date", () => {
    const from = farFutureDate(30);
    const found = nextAvailableSlot(OFFICE, from, []);
    expect(found).toBeTruthy();
  });

  it("skips over a fully booked date to the next available one", () => {
    const from = farFutureDate(30);
    const capacity = marriagePolicyConfig.appointmentCapacity.standardSlotsPerOfficePerDay;
    const existing = Array.from({ length: capacity }, (_, i) => appointment({ id: `${i}`, date: from }));
    const found = nextAvailableSlot(OFFICE, from, existing);
    expect(found).toBeTruthy();
    expect(found).not.toBe(from);
  });
});
