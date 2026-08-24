import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData } from "@/demo/storage/demoStore";
import { demoStartReview, demoRejectRegistration } from "@/demo/services/crvsRegistrations";
import { demoTrackBirthRegistration, DEMO_BIRTH_TRACKING_REFERENCE, DEMO_BIRTH_TRACKING_CODE } from "@/demo/services/public";

const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

describe("Structured rejection and public tracking", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("rejects with a structured reason, never deletes the case, and reflects in public tracking", () => {
    const db = getDemoData();
    const trackedCase = db.crvsRegistrations.find((c) => c.reference === DEMO_BIRTH_TRACKING_REFERENCE)!;
    expect(trackedCase.status).toBe("SUBMITTED");

    demoStartReview(trackedCase.id, REGISTRAR_ID, REGISTRAR_NAME);
    const rejected = demoRejectRegistration(
      trackedCase.id,
      {
        reason: "Insufficient evidence",
        explanation: "No supporting documentation could establish the birth occurred as declared.",
        evidenceRefs: [],
        applicantNotified: true,
      },
      REGISTRAR_ID,
      REGISTRAR_NAME
    );

    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason?.reason).toBe("Insufficient evidence");
    expect(getDemoData().crvsRegistrations.some((c) => c.id === trackedCase.id)).toBe(true);

    const tracked = demoTrackBirthRegistration(DEMO_BIRTH_TRACKING_REFERENCE, DEMO_BIRTH_TRACKING_CODE);
    expect(tracked).not.toBeNull();
    expect(tracked?.status).toBe("REJECTED");
    expect(tracked?.outstandingAction).toMatch(/not approved/i);
  });

  it("rejects a wrong tracking code", () => {
    expect(demoTrackBirthRegistration(DEMO_BIRTH_TRACKING_REFERENCE, "000000")).toBeNull();
  });
});
