import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData, resetDemoData } from "@/demo/storage/demoStore";
import { demoStartReview, demoSetReviewSectionStatus, demoApproveRegistration } from "@/demo/services/crvsRegistrations";
import { demoProcessSdidSync, demoRetrySdidSync, demoAssignManualReview } from "@/demo/services/crvsSdidSync";
import { ReviewSectionKey } from "@/domain/crvs/types";

const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const SUPERVISOR_NAME = "Test CRVS Supervisor";

const VERIFIED_SECTIONS: ReviewSectionKey[] = [
  "CHILD",
  "PARENTS",
  "DECLARANT",
  "WITNESSES",
  "EVIDENCE",
  "DUPLICATE_CHECK",
  "LATE_OR_EXCEPTION",
  "OFFICER_DECLARATION",
];

const registerAFreshCase = () => {
  const db = getDemoData();
  const submittedCase = db.crvsRegistrations.find((c) => c.reference === "BR-DEMO-2026-0002")!;
  demoStartReview(submittedCase.id, REGISTRAR_ID, REGISTRAR_NAME);
  VERIFIED_SECTIONS.forEach((section) => demoSetReviewSectionStatus(submittedCase.id, section, "VERIFIED", REGISTRAR_NAME));
  return demoApproveRegistration(submittedCase.id, REGISTRAR_ID, REGISTRAR_NAME);
};

describe("SDID synchronization: register -> queue -> fail -> stays REGISTERED -> retry -> succeed -> idempotent", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps the CRVS registration REGISTERED through a failed sync, then succeeds without a duplicate identity on retry", async () => {
    const registered = registerAFreshCase();
    expect(registered.status).toBe("REGISTERED");
    expect(registered.sdid.status).toBe("PENDING");

    vi.spyOn(Math, "random").mockReturnValue(0.99); // above the 0.8 success threshold -> forces failure
    const failedOutcome = await demoProcessSdidSync(registered.id, REGISTRAR_NAME);
    expect(failedOutcome).toBe("FAILED");

    let afterFailure = getDemoData().crvsRegistrations.find((c) => c.id === registered.id)!;
    expect(afterFailure.status).toBe("REGISTERED"); // sync failure never reverses registration
    expect(afterFailure.sdid.status).toBe("FAILED");
    expect(afterFailure.sdid.lastFailureCode).toBeTruthy();

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below threshold -> forces success
    const retryOutcome = await demoRetrySdidSync(registered.id, REGISTRAR_NAME);
    expect(retryOutcome).toBe("IDENTITY_CREATED");

    const afterRetry = getDemoData().crvsRegistrations.find((c) => c.id === registered.id)!;
    expect(afterRetry.sdid.status).toBe("IDENTITY_CREATED");
    expect(afterRetry.sdid.fictionalNin).toBeTruthy();

    const identityCountBefore = getDemoData().crvsFoundationalIdentities.filter(
      (f) => f.idempotencyKey === afterRetry.sdid.idempotencyKey
    ).length;
    expect(identityCountBefore).toBe(1);

    // A repeated retry call must be a no-op, not a second identity.
    const secondRetryOutcome = await demoRetrySdidSync(registered.id, REGISTRAR_NAME);
    expect(secondRetryOutcome).toBe("IDENTITY_CREATED");
    const identityCountAfter = getDemoData().crvsFoundationalIdentities.filter(
      (f) => f.idempotencyKey === afterRetry.sdid.idempotencyKey
    ).length;
    expect(identityCountAfter).toBe(1);
  });

  it("can be placed into manual review after a failure", async () => {
    const registered = registerAFreshCase();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    await demoProcessSdidSync(registered.id, REGISTRAR_NAME);

    const updated = demoAssignManualReview(
      registered.id,
      { reason: "Repeated identity conflicts.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "HIGH" },
      SUPERVISOR_NAME
    );
    expect(updated.sdid.status).toBe("MANUAL_REVIEW");
    expect(updated.status).toBe("REGISTERED");
  });
});
