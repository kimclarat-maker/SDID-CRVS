import { describe, expect, it } from "vitest";
import {
  canTransitionNotification,
  canTransitionRegistration,
  canTransitionSync,
  assertTransitionNotification,
  assertTransitionRegistration,
  assertTransitionSync,
  IllegalTransitionError,
} from "@/domain/crvs/statusMachines";

describe("notification status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionNotification("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionNotification("SUBMITTED", "ACCEPTED")).toBe(true);
    expect(canTransitionNotification("SUBMITTED", "RETURNED")).toBe(true);
    expect(canTransitionNotification("RETURNED", "SUBMITTED")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransitionNotification("DRAFT", "ACCEPTED")).toBe(false);
    expect(canTransitionNotification("ACCEPTED", "DRAFT")).toBe(false);
    expect(() => assertTransitionNotification("DRAFT", "ACCEPTED")).toThrow(IllegalTransitionError);
  });

  it("has no transitions out of terminal states", () => {
    expect(canTransitionNotification("ACCEPTED", "SUBMITTED")).toBe(false);
    expect(canTransitionNotification("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("registration status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionRegistration("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionRegistration("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionRegistration("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionRegistration("APPROVED", "REGISTERED")).toBe(true);
  });

  it("allows the correction cycle", () => {
    expect(canTransitionRegistration("UNDER_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionRegistration("CORRECTION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionRegistration("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows late-registration and exception routing from SUBMITTED", () => {
    expect(canTransitionRegistration("SUBMITTED", "LATE_REGISTRATION_REVIEW")).toBe(true);
    expect(canTransitionRegistration("SUBMITTED", "EXCEPTION_REVIEW")).toBe(true);
  });

  it("rejects illegal jumps such as DRAFT straight to REGISTERED", () => {
    expect(canTransitionRegistration("DRAFT", "REGISTERED")).toBe(false);
    expect(() => assertTransitionRegistration("DRAFT", "REGISTERED")).toThrow(IllegalTransitionError);
  });

  it("has no transitions out of REGISTERED, REJECTED or CANCELLED", () => {
    expect(canTransitionRegistration("REGISTERED", "APPROVED")).toBe(false);
    expect(canTransitionRegistration("REJECTED", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionRegistration("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("SDID sync status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionSync("NOT_READY", "PENDING")).toBe(true);
    expect(canTransitionSync("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionSync("IN_PROGRESS", "IDENTITY_CREATED")).toBe(true);
    expect(canTransitionSync("IN_PROGRESS", "FAILED")).toBe(true);
  });

  it("allows retry from FAILED and MANUAL_REVIEW back to IN_PROGRESS", () => {
    expect(canTransitionSync("FAILED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionSync("MANUAL_REVIEW", "IN_PROGRESS")).toBe(true);
  });

  it("never reverses back to NOT_READY, and IDENTITY_CREATED is terminal", () => {
    expect(canTransitionSync("PENDING", "NOT_READY")).toBe(false);
    expect(canTransitionSync("FAILED", "NOT_READY")).toBe(false);
    expect(canTransitionSync("IDENTITY_CREATED", "PENDING")).toBe(false);
    expect(() => assertTransitionSync("IDENTITY_CREATED", "PENDING")).toThrow(IllegalTransitionError);
  });
});
