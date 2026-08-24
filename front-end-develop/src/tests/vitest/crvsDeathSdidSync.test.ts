import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData, resetDemoData } from "@/demo/storage/demoStore";
import { demoCreateDeathRegistrationDraft, demoSubmitDeathRegistration, demoStartDeathReview, demoApproveDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { demoProcessDeathSdidSync, demoRetryDeathSdidSync, demoAssignDeathManualReview } from "@/demo/services/crvsDeathSdidSync";
import { CreateDeathRegistrationInput } from "@/demo/services/crvsDeathRegistrations";

const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const OFFICER_NAME = "Test Death Registration Officer";

const baseInput = (nin?: string): CreateDeathRegistrationInput => ({
  pathway: "HEALTH_FACILITY",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfDeath: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  dateReported: new Date().toISOString(),
  deceased: { identityStatus: "KNOWN", firstName: "Test", lastName: "Deceased", sex: "MALE", nationality: "Demo Republic", nin, verification: nin ? "VERIFIED" : "NOT_VERIFIED" },
  occurrence: { dateOfDeath: new Date().toISOString(), placeCategory: "HEALTH_FACILITY", location: "Demo District Health Centre", adminLocation: "Demo District", jurisdiction: "Demo District", circumstanceCategory: "NATURAL_ILLNESS" },
  declarant: { relationship: "Spouse", documentType: "NATIONAL_ID", firstName: "Test", lastName: "Declarant", verification: "VERIFIED" },
});

const registerAFreshCase = (nin?: string) => {
  const draft = demoCreateDeathRegistrationDraft(baseInput(nin), "crvs.officer@demo.identity.local", OFFICER_NAME);
  demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
  demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
  return demoApproveDeathRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true);
};

describe("Death SDID synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("marks the linked identity deceased on success, never creating or deleting an identity", async () => {
    // FID-DEATH-0001 (seed) is ACTIVE and linked to DEMO-NIN-2026-000901.
    const registered = registerAFreshCase("DEMO-NIN-2026-000901");
    expect(registered.status).toBe("REGISTERED");
    expect(registered.sdid.status).toBe("PENDING");

    const identityCountBefore = getDemoData().crvsFoundationalIdentities.length;

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below the 0.8 success threshold -> forces success
    const outcome = await demoProcessDeathSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("IDENTITY_MARKED_DECEASED");

    const afterSync = getDemoData().crvsDeathRegistrations.find((c) => c.id === registered.id)!;
    expect(afterSync.status).toBe("REGISTERED");
    expect(afterSync.sdid.status).toBe("IDENTITY_MARKED_DECEASED");
    expect(afterSync.sdid.linkedNin).toBe("DEMO-NIN-2026-000901");

    const identity = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "DEMO-NIN-2026-000901")!;
    expect(identity.identityStatus).toBe("DECEASED");
    expect(identity.deceasedByDeathRegistrationReference).toBe(afterSync.reference);
    // Every other field is preserved, not replaced.
    expect(identity.id).toBe("FID-DEATH-0001");

    // No new identity was created.
    expect(getDemoData().crvsFoundationalIdentities.length).toBe(identityCountBefore);
  });

  it("keeps the death registration REGISTERED through a failed sync, then succeeds on retry without a duplicate mark", async () => {
    const registered = registerAFreshCase("DEMO-NIN-2026-000901");

    vi.spyOn(Math, "random").mockReturnValue(0.99); // forces failure
    const failedOutcome = await demoProcessDeathSdidSync(registered.id, REGISTRAR_NAME);
    expect(failedOutcome).toBe("FAILED");

    const afterFailure = getDemoData().crvsDeathRegistrations.find((c) => c.id === registered.id)!;
    expect(afterFailure.status).toBe("REGISTERED"); // sync failure never reverses registration
    expect(afterFailure.sdid.status).toBe("FAILED");
    expect(afterFailure.sdid.lastFailureCode).toBeTruthy();

    const identityBeforeRetry = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "DEMO-NIN-2026-000901")!;
    expect(identityBeforeRetry.identityStatus).toBe("ACTIVE"); // untouched until sync actually succeeds

    vi.spyOn(Math, "random").mockReturnValue(0.1); // forces success
    const retryOutcome = await demoRetryDeathSdidSync(registered.id, REGISTRAR_NAME);
    expect(retryOutcome).toBe("IDENTITY_MARKED_DECEASED");

    const afterRetry = getDemoData().crvsDeathRegistrations.find((c) => c.id === registered.id)!;
    expect(afterRetry.sdid.status).toBe("IDENTITY_MARKED_DECEASED");
    expect(afterRetry.sdid.attempts).toHaveLength(2);
  });

  it("routes to MANUAL_REVIEW without fabricating an identity when no reliable match exists", async () => {
    const registered = registerAFreshCase(undefined); // no NIN, no matching identity anywhere
    const identityCountBefore = getDemoData().crvsFoundationalIdentities.length;

    const outcome = await demoProcessDeathSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("MANUAL_REVIEW");

    const afterSync = getDemoData().crvsDeathRegistrations.find((c) => c.id === registered.id)!;
    expect(afterSync.status).toBe("REGISTERED"); // the death remains legally registered
    expect(afterSync.sdid.status).toBe("MANUAL_REVIEW");
    expect(afterSync.sdid.manualReview).toBeTruthy();
    expect(getDemoData().crvsFoundationalIdentities.length).toBe(identityCountBefore); // no identity fabricated
  });

  it("can be explicitly placed into manual review by a supervisor after a failure", async () => {
    const registered = registerAFreshCase("DEMO-NIN-2026-000901");
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    await demoProcessDeathSdidSync(registered.id, REGISTRAR_NAME);

    const updated = demoAssignDeathManualReview(registered.id, { reason: "Repeated identity conflicts.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "HIGH" }, "Test CRVS Supervisor");
    expect(updated.sdid.status).toBe("MANUAL_REVIEW");
    expect(updated.status).toBe("REGISTERED");
  });
});
