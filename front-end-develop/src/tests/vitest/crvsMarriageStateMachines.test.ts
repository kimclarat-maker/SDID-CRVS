import { describe, expect, it } from "vitest";
import {
  canTransitionMarriageApplication,
  assertTransitionMarriageApplication,
  canTransitionMarriageAppointment,
  canTransitionMarriageCeremony,
  canTransitionMarriageSpouseSync,
  canTransitionMarriageSync,
  assertTransitionMarriageSync,
  canTransitionMarriageObjection,
  aggregateMarriageSyncStatus,
  IllegalTransitionError,
} from "@/domain/crvs/statusMachines";

describe("marriage application status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionMarriageApplication("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionMarriageApplication("SUBMITTED", "ELIGIBILITY_REVIEW")).toBe(true);
    expect(canTransitionMarriageApplication("ELIGIBILITY_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionMarriageApplication("APPROVED", "APPOINTMENT_SCHEDULED")).toBe(true);
    expect(canTransitionMarriageApplication("APPOINTMENT_SCHEDULED", "READY_FOR_CEREMONY")).toBe(true);
    expect(canTransitionMarriageApplication("READY_FOR_CEREMONY", "CEREMONY_COMPLETED")).toBe(true);
    expect(canTransitionMarriageApplication("CEREMONY_COMPLETED", "REGISTERED")).toBe(true);
  });

  it("allows the partner-verification path before submission", () => {
    expect(canTransitionMarriageApplication("DRAFT", "PARTNER_VERIFICATION_REQUIRED")).toBe(true);
    expect(canTransitionMarriageApplication("PARTNER_VERIFICATION_REQUIRED", "SUBMITTED")).toBe(true);
    expect(canTransitionMarriageApplication("PARTNER_VERIFICATION_REQUIRED", "REJECTED")).toBe(true);
  });

  it("allows the correction cycle", () => {
    expect(canTransitionMarriageApplication("ELIGIBILITY_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionMarriageApplication("CORRECTION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionMarriageApplication("RESUBMITTED", "ELIGIBILITY_REVIEW")).toBe(true);
  });

  it("allows the conditional payment path", () => {
    expect(canTransitionMarriageApplication("ELIGIBILITY_REVIEW", "PAYMENT_PENDING")).toBe(true);
    expect(canTransitionMarriageApplication("PAYMENT_PENDING", "PAID")).toBe(true);
    expect(canTransitionMarriageApplication("PAID", "APPROVED")).toBe(true);
    expect(canTransitionMarriageApplication("PAID", "REJECTED")).toBe(true);
  });

  it("allows no-show/postponed from both APPOINTMENT_SCHEDULED and READY_FOR_CEREMONY, always reschedulable", () => {
    expect(canTransitionMarriageApplication("APPOINTMENT_SCHEDULED", "NO_SHOW")).toBe(true);
    expect(canTransitionMarriageApplication("APPOINTMENT_SCHEDULED", "POSTPONED")).toBe(true);
    expect(canTransitionMarriageApplication("READY_FOR_CEREMONY", "NO_SHOW")).toBe(true);
    expect(canTransitionMarriageApplication("READY_FOR_CEREMONY", "POSTPONED")).toBe(true);
    expect(canTransitionMarriageApplication("NO_SHOW", "APPOINTMENT_SCHEDULED")).toBe(true);
    expect(canTransitionMarriageApplication("POSTPONED", "APPOINTMENT_SCHEDULED")).toBe(true);
  });

  it("allows READY_FOR_CEREMONY to reject directly (consent-declined path)", () => {
    expect(canTransitionMarriageApplication("READY_FOR_CEREMONY", "REJECTED")).toBe(true);
  });

  it("rejects illegal jumps such as DRAFT straight to REGISTERED", () => {
    expect(canTransitionMarriageApplication("DRAFT", "REGISTERED")).toBe(false);
    expect(() => assertTransitionMarriageApplication("DRAFT", "REGISTERED")).toThrow(IllegalTransitionError);
  });

  it("has no transitions out of REGISTERED, REJECTED, or CANCELLED", () => {
    expect(canTransitionMarriageApplication("REGISTERED", "APPROVED")).toBe(false);
    expect(canTransitionMarriageApplication("REJECTED", "ELIGIBILITY_REVIEW")).toBe(false);
    expect(canTransitionMarriageApplication("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("marriage appointment status machine", () => {
  it("allows reschedule/cancel request cycles", () => {
    expect(canTransitionMarriageAppointment("SCHEDULED", "RESCHEDULE_REQUESTED")).toBe(true);
    expect(canTransitionMarriageAppointment("RESCHEDULE_REQUESTED", "SCHEDULED")).toBe(true);
    expect(canTransitionMarriageAppointment("SCHEDULED", "CANCEL_REQUESTED")).toBe(true);
    expect(canTransitionMarriageAppointment("CANCEL_REQUESTED", "CANCELLED")).toBe(true);
  });

  it("terminal states have no outgoing transitions", () => {
    expect(canTransitionMarriageAppointment("CANCELLED", "SCHEDULED")).toBe(false);
    expect(canTransitionMarriageAppointment("COMPLETED", "SCHEDULED")).toBe(false);
    expect(canTransitionMarriageAppointment("NO_SHOW", "SCHEDULED")).toBe(false);
  });
});

describe("marriage ceremony outcome machine", () => {
  it("allows every outcome from NOT_STARTED, including CONSENT_DECLINED", () => {
    (["COMPLETED", "POSTPONED", "NO_SHOW", "CONSENT_DECLINED", "CANCELLED"] as const).forEach((outcome) => {
      expect(canTransitionMarriageCeremony("NOT_STARTED", outcome)).toBe(true);
    });
  });

  it("every outcome is terminal — no re-attempts on the same ceremony record", () => {
    expect(canTransitionMarriageCeremony("COMPLETED", "NOT_STARTED")).toBe(false);
    expect(canTransitionMarriageCeremony("POSTPONED", "COMPLETED")).toBe(false);
  });
});

describe("marriage per-spouse SDID sync machine", () => {
  it("allows the happy path to IDENTITY_UPDATED", () => {
    expect(canTransitionMarriageSpouseSync("NOT_READY", "PENDING")).toBe(true);
    expect(canTransitionMarriageSpouseSync("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionMarriageSpouseSync("IN_PROGRESS", "IDENTITY_UPDATED")).toBe(true);
  });

  it("allows retry from FAILED and MANUAL_REVIEW", () => {
    expect(canTransitionMarriageSpouseSync("FAILED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionMarriageSpouseSync("MANUAL_REVIEW", "IN_PROGRESS")).toBe(true);
  });

  it("IDENTITY_UPDATED is terminal", () => {
    expect(canTransitionMarriageSpouseSync("IDENTITY_UPDATED", "IN_PROGRESS")).toBe(false);
  });
});

describe("marriage case-level SDID sync machine", () => {
  it("allows every aggregate outcome from IN_PROGRESS", () => {
    (["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"] as const).forEach((outcome) => {
      expect(canTransitionMarriageSync("IN_PROGRESS", outcome)).toBe(true);
    });
  });

  it("BOTH_IDENTITIES_UPDATED is terminal", () => {
    expect(canTransitionMarriageSync("BOTH_IDENTITIES_UPDATED", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransitionMarriageSync("BOTH_IDENTITIES_UPDATED", "PENDING")).toThrow(IllegalTransitionError);
  });
});

describe("aggregateMarriageSyncStatus", () => {
  it("returns BOTH_IDENTITIES_UPDATED only when both spouses succeeded", () => {
    expect(aggregateMarriageSyncStatus("IDENTITY_UPDATED", "IDENTITY_UPDATED")).toBe("BOTH_IDENTITIES_UPDATED");
  });

  it("returns PARTIAL_FAILURE when exactly one spouse succeeded and the other failed", () => {
    expect(aggregateMarriageSyncStatus("IDENTITY_UPDATED", "FAILED")).toBe("PARTIAL_FAILURE");
    expect(aggregateMarriageSyncStatus("FAILED", "IDENTITY_UPDATED")).toBe("PARTIAL_FAILURE");
  });

  it("returns FAILED only when both spouses failed", () => {
    expect(aggregateMarriageSyncStatus("FAILED", "FAILED")).toBe("FAILED");
  });

  it("returns MANUAL_REVIEW when either spouse needs manual review", () => {
    expect(aggregateMarriageSyncStatus("MANUAL_REVIEW", "PENDING")).toBe("MANUAL_REVIEW");
    expect(aggregateMarriageSyncStatus("IDENTITY_UPDATED", "MANUAL_REVIEW")).toBe("MANUAL_REVIEW");
  });

  it("returns the lower-progress shared state while still in flight", () => {
    expect(aggregateMarriageSyncStatus("NOT_READY", "NOT_READY")).toBe("NOT_READY");
    expect(aggregateMarriageSyncStatus("PENDING", "NOT_READY")).toBe("PENDING");
    expect(aggregateMarriageSyncStatus("IN_PROGRESS", "PENDING")).toBe("IN_PROGRESS");
  });
});

describe("marriage objection status machine", () => {
  it("allows opening then resolving in any of three ways", () => {
    expect(canTransitionMarriageObjection("NONE", "PENDING")).toBe(true);
    expect(canTransitionMarriageObjection("PENDING", "UPHELD")).toBe(true);
    expect(canTransitionMarriageObjection("PENDING", "DISMISSED")).toBe(true);
    expect(canTransitionMarriageObjection("PENDING", "WITHDRAWN")).toBe(true);
  });

  it("resolved/withdrawn states are terminal", () => {
    expect(canTransitionMarriageObjection("UPHELD", "PENDING")).toBe(false);
    expect(canTransitionMarriageObjection("DISMISSED", "PENDING")).toBe(false);
    expect(canTransitionMarriageObjection("WITHDRAWN", "PENDING")).toBe(false);
  });
});
