import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDemoData } from "@/demo/storage/demoStore";
import { demoGetMarriagePublicTrackingView } from "@/demo/services/crvsMarriagePublicTracking";
import { demoGetMarriageApplicantResponseView } from "@/demo/services/crvsMarriagePartnerResponse";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";

describe("Marriage public tracking redaction", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("never returns document numbers, DOB, contact details, or witness detail for either spouse", async () => {
    const full = await demoGetMarriageApplication("MR-DEMO-2026-0004");
    expect(full).toBeTruthy();

    const view = await demoGetMarriagePublicTrackingView("MR-DEMO-2026-0004");
    expect(view).toBeTruthy();

    const serialized = JSON.stringify(view);
    // Neither spouse's full name, document number, phone, or witness names
    // ever appear in the public tracking payload — only masked initials.
    expect(serialized).not.toContain(full!.applicant1.documentNumber || "@@none@@");
    expect(serialized).not.toContain(full!.applicant1.phone || "@@none@@");
    expect(serialized).not.toContain(full!.applicant1.dateOfBirth || "@@none@@");
    expect(serialized).not.toContain(full!.applicant2.documentNumber || "@@none@@");
    expect(serialized).not.toContain(full!.applicant2.phone || "@@none@@");
    full!.witnesses.forEach((w) => {
      expect(serialized).not.toContain(w.firstName);
      expect(serialized).not.toContain(w.documentNumber || "@@none@@");
    });

    // The view only exposes the fields the redacted projection declares.
    expect(Object.keys(view!).sort()).toEqual(
      ["appointment", "certificateEligible", "hasOpenCorrection", "hasOpenObjection", "maskedSpouseSummary", "nextAction", "officeName", "reference", "status", "submittedAt", "timeline"].sort()
    );
  });

  it("masks both spouses symmetrically regardless of which applicant slot they occupy", async () => {
    const view = await demoGetMarriagePublicTrackingView("MR-DEMO-2026-0004");
    expect(view!.maskedSpouseSummary).toMatch(/^[A-Z]\. [A-Z]\. & [A-Z]\. [A-Z]\.$/);
  });

  it("surfaces only boolean correction/objection flags, never the correction detail", async () => {
    const view = await demoGetMarriagePublicTrackingView("MR-DEMO-2026-0009"); // seeded correction-requested case
    expect(view!.hasOpenCorrection).toBe(true);
    expect(JSON.stringify(view)).not.toMatch(/residence address does not match/i);
  });

  it("returns undefined for a reference that doesn't exist, rather than throwing", async () => {
    const view = await demoGetMarriagePublicTrackingView("MR-DEMO-DOES-NOT-EXIST");
    expect(view).toBeUndefined();
  });
});

describe("Marriage applicant response view", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("gives the responding applicant their own full data but only a minimal partner summary", async () => {
    const view = await demoGetMarriageApplicantResponseView("resp-tok-mr2-demo");
    expect(view).toBeTruthy();
    expect(view!.respondingSpouseRole).toBe("APPLICANT2");
    expect(view!.ownData.firstName).toBeTruthy();

    // Partner projection is deliberately minimal — no document/contact fields.
    expect(Object.keys(view!.partner).sort()).toEqual(["firstName", "lastName", "officeName", "proposedMarriageDate", "spouseRole"].sort());
  });

  it("returns undefined for an unknown or already-used token", async () => {
    const view = await demoGetMarriageApplicantResponseView("not-a-real-token");
    expect(view).toBeUndefined();
  });
});
