import { describe, expect, it } from "vitest";
import {
  canTransitionDivorceNotification,
  assertTransitionDivorceNotification,
  canTransitionDivorceRegistration,
  assertTransitionDivorceRegistration,
  canTransitionDivorceJudgmentVerification,
  canTransitionDivorceSpouseSync,
  canTransitionDivorceSync,
  assertTransitionDivorceSync,
  aggregateDivorceSyncStatus,
  IllegalTransitionError,
} from "@/domain/crvs/statusMachines";

describe("divorce notification status machine", () => {
  it("allows the happy path from a simulated court notification through to conversion", () => {
    expect(canTransitionDivorceNotification("RECEIVED", "VALIDATION_PENDING")).toBe(true);
    expect(canTransitionDivorceNotification("VALIDATION_PENDING", "VALIDATED")).toBe(true);
    expect(canTransitionDivorceNotification("VALIDATED", "CONVERTED_TO_REGISTRATION")).toBe(true);
  });

  it("allows return and duplicate paths", () => {
    expect(canTransitionDivorceNotification("VALIDATION_PENDING", "RETURNED")).toBe(true);
    expect(canTransitionDivorceNotification("RETURNED", "VALIDATION_PENDING")).toBe(true);
    expect(canTransitionDivorceNotification("RECEIVED", "DUPLICATE")).toBe(true);
  });

  it("terminal states have no outgoing transitions", () => {
    expect(canTransitionDivorceNotification("CONVERTED_TO_REGISTRATION", "RECEIVED")).toBe(false);
    expect(canTransitionDivorceNotification("DUPLICATE", "VALIDATION_PENDING")).toBe(false);
    expect(() => assertTransitionDivorceNotification("DUPLICATE", "VALIDATED")).toThrow(IllegalTransitionError);
  });
});

describe("divorce registration status machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionDivorceRegistration("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionDivorceRegistration("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionDivorceRegistration("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionDivorceRegistration("APPROVED", "REGISTERED")).toBe(true);
  });

  it("allows the correction cycle", () => {
    expect(canTransitionDivorceRegistration("UNDER_REVIEW", "CORRECTION_REQUIRED")).toBe(true);
    expect(canTransitionDivorceRegistration("CORRECTION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionDivorceRegistration("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows the three review-branch detours (judgment verification, foreign review, exception review) from both SUBMITTED and UNDER_REVIEW, each routing back", () => {
    (["JUDGMENT_VERIFICATION", "FOREIGN_JUDGMENT_REVIEW", "EXCEPTION_REVIEW"] as const).forEach((branch) => {
      expect(canTransitionDivorceRegistration("SUBMITTED", branch)).toBe(true);
      expect(canTransitionDivorceRegistration("UNDER_REVIEW", branch)).toBe(true);
      expect(canTransitionDivorceRegistration(branch, "UNDER_REVIEW")).toBe(true);
      expect(canTransitionDivorceRegistration(branch, "CORRECTION_REQUIRED")).toBe(true);
      expect(canTransitionDivorceRegistration(branch, "REJECTED")).toBe(true);
    });
  });

  it("rejects illegal jumps such as DRAFT straight to REGISTERED", () => {
    expect(canTransitionDivorceRegistration("DRAFT", "REGISTERED")).toBe(false);
    expect(() => assertTransitionDivorceRegistration("DRAFT", "REGISTERED")).toThrow(IllegalTransitionError);
  });

  it("rejects CORRECTION_REQUIRED straight to APPROVED (must always pass back through review)", () => {
    expect(canTransitionDivorceRegistration("CORRECTION_REQUIRED", "APPROVED")).toBe(false);
  });

  it("has no transitions out of REGISTERED — a registered divorce can never be changed back to draft", () => {
    expect(canTransitionDivorceRegistration("REGISTERED", "DRAFT")).toBe(false);
    expect(canTransitionDivorceRegistration("REGISTERED", "APPROVED")).toBe(false);
    expect(canTransitionDivorceRegistration("REGISTERED", "CANCELLED")).toBe(false);
  });

  it("REJECTED and CANCELLED are terminal", () => {
    expect(canTransitionDivorceRegistration("REJECTED", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionDivorceRegistration("CANCELLED", "DRAFT")).toBe(false);
  });
});

describe("divorce judgment-verification status machine", () => {
  it("allows every outcome from PENDING", () => {
    (["VERIFIED", "UNVERIFIED", "CONFLICT_FOUND", "MANUAL_REVIEW"] as const).forEach((outcome) => {
      expect(canTransitionDivorceJudgmentVerification("PENDING", outcome)).toBe(true);
    });
  });

  it("VERIFIED is terminal; UNVERIFIED/CONFLICT_FOUND/MANUAL_REVIEW can retry back to PENDING", () => {
    expect(canTransitionDivorceJudgmentVerification("VERIFIED", "PENDING")).toBe(false);
    expect(canTransitionDivorceJudgmentVerification("UNVERIFIED", "PENDING")).toBe(true);
    expect(canTransitionDivorceJudgmentVerification("CONFLICT_FOUND", "PENDING")).toBe(true);
    expect(canTransitionDivorceJudgmentVerification("MANUAL_REVIEW", "PENDING")).toBe(true);
  });
});

describe("divorce per-former-spouse SDID sync machine", () => {
  it("allows the happy path to IDENTITY_UPDATED", () => {
    expect(canTransitionDivorceSpouseSync("NOT_READY", "PENDING")).toBe(true);
    expect(canTransitionDivorceSpouseSync("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionDivorceSpouseSync("IN_PROGRESS", "IDENTITY_UPDATED")).toBe(true);
  });

  it("allows retry from FAILED and MANUAL_REVIEW", () => {
    expect(canTransitionDivorceSpouseSync("FAILED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionDivorceSpouseSync("MANUAL_REVIEW", "IN_PROGRESS")).toBe(true);
  });

  it("IDENTITY_UPDATED is terminal", () => {
    expect(canTransitionDivorceSpouseSync("IDENTITY_UPDATED", "IN_PROGRESS")).toBe(false);
  });
});

describe("divorce case-level SDID sync machine", () => {
  it("allows every aggregate outcome from IN_PROGRESS", () => {
    (["BOTH_IDENTITIES_UPDATED", "PARTIAL_FAILURE", "FAILED", "MANUAL_REVIEW"] as const).forEach((outcome) => {
      expect(canTransitionDivorceSync("IN_PROGRESS", outcome)).toBe(true);
    });
  });

  it("BOTH_IDENTITIES_UPDATED is terminal", () => {
    expect(canTransitionDivorceSync("BOTH_IDENTITIES_UPDATED", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransitionDivorceSync("BOTH_IDENTITIES_UPDATED", "PENDING")).toThrow(IllegalTransitionError);
  });
});

describe("aggregateDivorceSyncStatus", () => {
  it("returns BOTH_IDENTITIES_UPDATED only when both former spouses succeeded", () => {
    expect(aggregateDivorceSyncStatus("IDENTITY_UPDATED", "IDENTITY_UPDATED")).toBe("BOTH_IDENTITIES_UPDATED");
  });

  it("returns PARTIAL_FAILURE when exactly one former spouse succeeded and the other failed", () => {
    expect(aggregateDivorceSyncStatus("IDENTITY_UPDATED", "FAILED")).toBe("PARTIAL_FAILURE");
    expect(aggregateDivorceSyncStatus("FAILED", "IDENTITY_UPDATED")).toBe("PARTIAL_FAILURE");
  });

  it("returns FAILED only when both former spouses failed", () => {
    expect(aggregateDivorceSyncStatus("FAILED", "FAILED")).toBe("FAILED");
  });

  it("returns MANUAL_REVIEW when either former spouse needs manual review", () => {
    expect(aggregateDivorceSyncStatus("MANUAL_REVIEW", "PENDING")).toBe("MANUAL_REVIEW");
    expect(aggregateDivorceSyncStatus("IDENTITY_UPDATED", "MANUAL_REVIEW")).toBe("MANUAL_REVIEW");
  });

  it("returns the lower-progress shared state while still in flight", () => {
    expect(aggregateDivorceSyncStatus("NOT_READY", "NOT_READY")).toBe("NOT_READY");
    expect(aggregateDivorceSyncStatus("PENDING", "NOT_READY")).toBe("PENDING");
    expect(aggregateDivorceSyncStatus("IN_PROGRESS", "PENDING")).toBe("IN_PROGRESS");
  });
});
