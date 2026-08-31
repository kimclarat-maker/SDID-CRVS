import { describe, expect, it } from "vitest";
import {
  canTransitionAnnulmentNotification,
  assertTransitionAnnulmentNotification,
  canTransitionAnnulmentRegistration,
  assertTransitionAnnulmentRegistration,
  canTransitionAnnulmentDecisionVerification,
  assertTransitionAnnulmentDecisionVerification,
  canTransitionAnnulmentPartySync,
  assertTransitionAnnulmentPartySync,
  canTransitionAnnulmentSync,
  assertTransitionAnnulmentSync,
  aggregateAnnulmentSyncStatus,
  IllegalTransitionError,
} from "@/domain/crvs/statusMachines";

describe("annulment notification status machine", () => {
  it("allows the happy path from a simulated court notification through to conversion", () => {
    expect(canTransitionAnnulmentNotification("RECEIVED", "VALIDATION_PENDING")).toBe(true);
    expect(canTransitionAnnulmentNotification("VALIDATION_PENDING", "VALIDATED")).toBe(true);
    expect(canTransitionAnnulmentNotification("VALIDATED", "CONVERTED_TO_REGISTRATION")).toBe(true);
  });

  it("allows return and duplicate paths", () => {
    expect(canTransitionAnnulmentNotification("VALIDATION_PENDING", "RETURNED")).toBe(true);
    expect(canTransitionAnnulmentNotification("RETURNED", "VALIDATION_PENDING")).toBe(true);
    expect(canTransitionAnnulmentNotification("RECEIVED", "DUPLICATE")).toBe(true);
  });

  it("terminal states have no outgoing transitions", () => {
    expect(canTransitionAnnulmentNotification("CONVERTED_TO_REGISTRATION", "RECEIVED")).toBe(false);
    expect(canTransitionAnnulmentNotification("DUPLICATE", "VALIDATION_PENDING")).toBe(false);
    expect(() => assertTransitionAnnulmentNotification("DUPLICATE", "VALIDATED")).toThrow(IllegalTransitionError);
  });
});

describe("annulment registration status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionAnnulmentRegistration("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("APPROVED", "REGISTERED")).toBe(true);
  });

  it("allows the correction cycle", () => {
    expect(canTransitionAnnulmentRegistration("UNDER_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("CORRECTION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows routing into DECISION_VERIFICATION, LEGAL_EFFECT_REVIEW, FOREIGN_DECISION_REVIEW and EXCEPTION_REVIEW from both SUBMITTED and UNDER_REVIEW", () => {
    (["DECISION_VERIFICATION", "LEGAL_EFFECT_REVIEW", "FOREIGN_DECISION_REVIEW", "EXCEPTION_REVIEW"] as const).forEach((branch) => {
      expect(canTransitionAnnulmentRegistration("SUBMITTED", branch)).toBe(true);
      expect(canTransitionAnnulmentRegistration("UNDER_REVIEW", branch)).toBe(true);
    });
  });

  it("DECISION_VERIFICATION can route onward to LEGAL_EFFECT_REVIEW, FOREIGN_DECISION_REVIEW, EXCEPTION_REVIEW, UNDER_REVIEW, CORRECTION_REQUIRED or REJECTED", () => {
    (["UNDER_REVIEW", "CORRECTION_REQUIRED", "LEGAL_EFFECT_REVIEW", "FOREIGN_DECISION_REVIEW", "EXCEPTION_REVIEW", "REJECTED"] as const).forEach((to) => {
      expect(canTransitionAnnulmentRegistration("DECISION_VERIFICATION", to)).toBe(true);
    });
  });

  it("LEGAL_EFFECT_REVIEW (the one branch with no Divorce analog) can be reached from SUBMITTED, UNDER_REVIEW, DECISION_VERIFICATION and FOREIGN_DECISION_REVIEW, and can reach REJECTED/CORRECTION_REQUIRED/UNDER_REVIEW", () => {
    expect(canTransitionAnnulmentRegistration("SUBMITTED", "LEGAL_EFFECT_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("UNDER_REVIEW", "LEGAL_EFFECT_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("DECISION_VERIFICATION", "LEGAL_EFFECT_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("FOREIGN_DECISION_REVIEW", "LEGAL_EFFECT_REVIEW")).toBe(true);

    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "REJECTED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "FOREIGN_DECISION_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "EXCEPTION_REVIEW")).toBe(true);
  });

  it("LEGAL_EFFECT_REVIEW cannot route directly to DECISION_VERIFICATION (must go back through UNDER_REVIEW first)", () => {
    expect(canTransitionAnnulmentRegistration("LEGAL_EFFECT_REVIEW", "DECISION_VERIFICATION")).toBe(false);
  });

  it("FOREIGN_DECISION_REVIEW can route onward to LEGAL_EFFECT_REVIEW, EXCEPTION_REVIEW, UNDER_REVIEW, CORRECTION_REQUIRED or REJECTED, but not directly to DECISION_VERIFICATION", () => {
    (["UNDER_REVIEW", "CORRECTION_REQUIRED", "LEGAL_EFFECT_REVIEW", "EXCEPTION_REVIEW", "REJECTED"] as const).forEach((to) => {
      expect(canTransitionAnnulmentRegistration("FOREIGN_DECISION_REVIEW", to)).toBe(true);
    });
    expect(canTransitionAnnulmentRegistration("FOREIGN_DECISION_REVIEW", "DECISION_VERIFICATION")).toBe(false);
  });

  it("EXCEPTION_REVIEW is the narrowest branch: only UNDER_REVIEW, CORRECTION_REQUIRED or REJECTED, never another review branch", () => {
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "REJECTED")).toBe(true);
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "DECISION_VERIFICATION")).toBe(false);
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "LEGAL_EFFECT_REVIEW")).toBe(false);
    expect(canTransitionAnnulmentRegistration("EXCEPTION_REVIEW", "FOREIGN_DECISION_REVIEW")).toBe(false);
  });

  it("rejects illegal jumps such as DRAFT straight to REGISTERED", () => {
    expect(canTransitionAnnulmentRegistration("DRAFT", "REGISTERED")).toBe(false);
    expect(() => assertTransitionAnnulmentRegistration("DRAFT", "REGISTERED")).toThrow(IllegalTransitionError);
  });

  it("rejects CORRECTION_REQUIRED straight to APPROVED (must always pass back through review)", () => {
    expect(canTransitionAnnulmentRegistration("CORRECTION_REQUIRED", "APPROVED")).toBe(false);
  });

  it("has no transitions out of REGISTERED — a registered annulment can never be changed back to draft", () => {
    expect(canTransitionAnnulmentRegistration("REGISTERED", "DRAFT")).toBe(false);
    expect(canTransitionAnnulmentRegistration("REGISTERED", "APPROVED")).toBe(false);
    expect(canTransitionAnnulmentRegistration("REGISTERED", "CANCELLED")).toBe(false);
  });

  it("REJECTED and CANCELLED are terminal", () => {
    expect(canTransitionAnnulmentRegistration("REJECTED", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionAnnulmentRegistration("CANCELLED", "DRAFT")).toBe(false);
    expect(() => assertTransitionAnnulmentRegistration("REJECTED", "APPROVED")).toThrow(IllegalTransitionError);
  });
});

describe("annulment decision-verification status machine", () => {
  it("allows every outcome from PENDING", () => {
    (["VERIFIED", "UNVERIFIED", "CONFLICT_FOUND", "MANUAL_REVIEW"] as const).forEach((outcome) => {
      expect(canTransitionAnnulmentDecisionVerification("PENDING", outcome)).toBe(true);
    });
  });

  it("VERIFIED is terminal; UNVERIFIED/CONFLICT_FOUND/MANUAL_REVIEW can retry back to PENDING", () => {
    expect(canTransitionAnnulmentDecisionVerification("VERIFIED", "PENDING")).toBe(false);
    expect(canTransitionAnnulmentDecisionVerification("UNVERIFIED", "PENDING")).toBe(true);
    expect(canTransitionAnnulmentDecisionVerification("CONFLICT_FOUND", "PENDING")).toBe(true);
    expect(canTransitionAnnulmentDecisionVerification("MANUAL_REVIEW", "PENDING")).toBe(true);
    expect(() => assertTransitionAnnulmentDecisionVerification("VERIFIED", "PENDING")).toThrow(IllegalTransitionError);
  });

  it("NOT_STARTED can only move to PENDING", () => {
    expect(canTransitionAnnulmentDecisionVerification("NOT_STARTED", "PENDING")).toBe(true);
    expect(canTransitionAnnulmentDecisionVerification("NOT_STARTED", "VERIFIED")).toBe(false);
  });
});

describe("annulment per-party SDID sync machine", () => {
  it("allows the happy path to IDENTITY_UPDATED", () => {
    expect(canTransitionAnnulmentPartySync("NOT_READY", "PENDING")).toBe(true);
    expect(canTransitionAnnulmentPartySync("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionAnnulmentPartySync("IN_PROGRESS", "IDENTITY_UPDATED")).toBe(true);
  });

  it("allows retry from FAILED and MANUAL_REVIEW", () => {
    expect(canTransitionAnnulmentPartySync("FAILED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionAnnulmentPartySync("MANUAL_REVIEW", "IN_PROGRESS")).toBe(true);
  });

  it("IDENTITY_UPDATED is terminal", () => {
    expect(canTransitionAnnulmentPartySync("IDENTITY_UPDATED", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransitionAnnulmentPartySync("IDENTITY_UPDATED", "PENDING")).toThrow(IllegalTransitionError);
  });
});

describe("annulment case-level SDID sync machine", () => {
  it("allows every aggregate outcome from IN_PROGRESS", () => {
    (["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"] as const).forEach((outcome) => {
      expect(canTransitionAnnulmentSync("IN_PROGRESS", outcome)).toBe(true);
    });
  });

  it("BOTH_IDENTITIES_UPDATED is terminal", () => {
    expect(canTransitionAnnulmentSync("BOTH_IDENTITIES_UPDATED", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransitionAnnulmentSync("BOTH_IDENTITIES_UPDATED", "PENDING")).toThrow(IllegalTransitionError);
  });
});

describe("aggregateAnnulmentSyncStatus", () => {
  it("returns BOTH_IDENTITIES_UPDATED only when both affected parties succeeded", () => {
    expect(aggregateAnnulmentSyncStatus("IDENTITY_UPDATED", "IDENTITY_UPDATED")).toBe("BOTH_IDENTITIES_UPDATED");
  });

  it("returns PARTIAL_FAILURE when exactly one affected party succeeded and the other failed", () => {
    expect(aggregateAnnulmentSyncStatus("IDENTITY_UPDATED", "FAILED")).toBe("PARTIAL_FAILURE");
    expect(aggregateAnnulmentSyncStatus("FAILED", "IDENTITY_UPDATED")).toBe("PARTIAL_FAILURE");
  });

  it("returns FAILED only when both affected parties failed", () => {
    expect(aggregateAnnulmentSyncStatus("FAILED", "FAILED")).toBe("FAILED");
  });

  it("returns MANUAL_REVIEW when either affected party needs manual review", () => {
    expect(aggregateAnnulmentSyncStatus("MANUAL_REVIEW", "PENDING")).toBe("MANUAL_REVIEW");
    expect(aggregateAnnulmentSyncStatus("IDENTITY_UPDATED", "MANUAL_REVIEW")).toBe("MANUAL_REVIEW");
  });

  it("returns the lower-progress shared state while still in flight", () => {
    expect(aggregateAnnulmentSyncStatus("NOT_READY", "NOT_READY")).toBe("NOT_READY");
    expect(aggregateAnnulmentSyncStatus("PENDING", "NOT_READY")).toBe("PENDING");
    expect(aggregateAnnulmentSyncStatus("IN_PROGRESS", "PENDING")).toBe("IN_PROGRESS");
  });
});
