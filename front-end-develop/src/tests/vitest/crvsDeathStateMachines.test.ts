import { describe, expect, it } from "vitest";
import {
  canTransitionDeathNotification,
  canTransitionDeathRegistration,
  canTransitionDeathSync,
  assertTransitionDeathNotification,
  assertTransitionDeathRegistration,
  assertTransitionDeathSync,
  IllegalTransitionError,
} from "@/domain/crvs/statusMachines";

describe("death notification status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionDeathNotification("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionDeathNotification("SUBMITTED", "ACCEPTED")).toBe(true);
    expect(canTransitionDeathNotification("SUBMITTED", "RETURNED")).toBe(true);
    expect(canTransitionDeathNotification("RETURNED", "SUBMITTED")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransitionDeathNotification("DRAFT", "ACCEPTED")).toBe(false);
    expect(() => assertTransitionDeathNotification("DRAFT", "ACCEPTED")).toThrow(IllegalTransitionError);
  });

  it("has no transitions out of terminal states", () => {
    expect(canTransitionDeathNotification("ACCEPTED", "SUBMITTED")).toBe(false);
    expect(canTransitionDeathNotification("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("death registration status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionDeathRegistration("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionDeathRegistration("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionDeathRegistration("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionDeathRegistration("APPROVED", "REGISTERED")).toBe(true);
  });

  it("allows the correction cycle", () => {
    expect(canTransitionDeathRegistration("UNDER_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionDeathRegistration("CORRECTION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionDeathRegistration("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("routes SUBMITTED into each of the three exception branches", () => {
    expect(canTransitionDeathRegistration("SUBMITTED", "LATE_REGISTRATION_REVIEW")).toBe(true);
    expect(canTransitionDeathRegistration("SUBMITTED", "MEDICO_LEGAL_REVIEW")).toBe(true);
    expect(canTransitionDeathRegistration("SUBMITTED", "UNIDENTIFIED_PERSON_REVIEW")).toBe(true);
  });

  it("resolves each exception branch back to UNDER_REVIEW, CORRECTION_REQUIRED, or REJECTED", () => {
    (["LATE_REGISTRATION_REVIEW", "MEDICO_LEGAL_REVIEW", "UNIDENTIFIED_PERSON_REVIEW"] as const).forEach((branch) => {
      expect(canTransitionDeathRegistration(branch, "UNDER_REVIEW")).toBe(true);
      expect(canTransitionDeathRegistration(branch, "CORRECTION_REQUIRED")).toBe(true);
      expect(canTransitionDeathRegistration(branch, "REJECTED")).toBe(true);
    });
  });

  it("rejects illegal jumps such as DRAFT straight to REGISTERED", () => {
    expect(canTransitionDeathRegistration("DRAFT", "REGISTERED")).toBe(false);
    expect(() => assertTransitionDeathRegistration("DRAFT", "REGISTERED")).toThrow(IllegalTransitionError);
  });

  it("has no transitions out of REGISTERED, REJECTED or CANCELLED", () => {
    expect(canTransitionDeathRegistration("REGISTERED", "APPROVED")).toBe(false);
    expect(canTransitionDeathRegistration("REJECTED", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionDeathRegistration("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("death SDID sync status machine", () => {
  it("allows the documented happy path, ending in IDENTITY_MARKED_DECEASED", () => {
    expect(canTransitionDeathSync("NOT_READY", "PENDING")).toBe(true);
    expect(canTransitionDeathSync("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionDeathSync("IN_PROGRESS", "IDENTITY_MARKED_DECEASED")).toBe(true);
    expect(canTransitionDeathSync("IN_PROGRESS", "FAILED")).toBe(true);
    expect(canTransitionDeathSync("IN_PROGRESS", "MANUAL_REVIEW")).toBe(true);
  });

  it("allows retry from FAILED and MANUAL_REVIEW back to IN_PROGRESS", () => {
    expect(canTransitionDeathSync("FAILED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionDeathSync("MANUAL_REVIEW", "IN_PROGRESS")).toBe(true);
  });

  it("never reverses back to NOT_READY, and IDENTITY_MARKED_DECEASED is terminal", () => {
    expect(canTransitionDeathSync("PENDING", "NOT_READY")).toBe(false);
    expect(canTransitionDeathSync("FAILED", "NOT_READY")).toBe(false);
    expect(canTransitionDeathSync("IDENTITY_MARKED_DECEASED", "PENDING")).toBe(false);
    expect(() => assertTransitionDeathSync("IDENTITY_MARKED_DECEASED", "PENDING")).toThrow(IllegalTransitionError);
  });
});
