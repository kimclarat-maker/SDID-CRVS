import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData } from "@/demo/storage/demoStore";
import { findDuplicateCandidates, overallMatchLevel } from "@/domain/crvs/duplicateDetection";
import { demoCreateRegistrationDraft, demoSubmitRegistration, CreateRegistrationInput } from "@/demo/services/crvsRegistrations";
import { demoRunDuplicateCheck, demoResolveDuplicate } from "@/demo/services/crvsDuplicateCheck";

const OFFICER_ID = "crvs.officer@demo.identity.local";
const OFFICER_NAME = "Test Registration Officer";
const SUPERVISOR_NAME = "Test CRVS Supervisor";

describe("Duplicate detection", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("flags an exact match against the seeded BR-DEMO-2026-0001 case and blocks submission", async () => {
    const db = getDemoData();
    const original = db.crvsRegistrations.find((c) => c.reference === "BR-DEMO-2026-0001")!;

    const input: CreateRegistrationInput = {
      sourceType: "COMMUNITY",
      occurrenceType: "FACILITY",
      facilityId: original.facilityId,
      facilityName: original.facilityName,
      placeOfBirth: original.placeOfBirth,
      processingOfficeId: "OFFICE-DEMO-01",
      processingOfficeName: "Demo District Registration Office",
      jurisdiction: "Demo District",
      dateOfBirth: original.dateOfBirth,
      dateReported: new Date().toISOString(),
      registrationCategory: "Standard",
      child: { ...original.child },
      mother: { ...original.mother },
      father: { availability: "NOT_DECLARED" },
      declarant: {
        relationship: "Mother",
        documentType: "NATIONAL_ID",
        documentNumber: original.mother.documentNumber,
        firstName: original.mother.firstName,
        lastName: original.mother.lastName,
        verification: "VERIFIED",
      },
    };

    const duplicate = demoCreateRegistrationDraft(input, OFFICER_ID, OFFICER_NAME);
    const result = await demoRunDuplicateCheck(
      duplicate.id,
      { child: duplicate.child, mother: duplicate.mother, facilityId: duplicate.facilityId, placeOfBirth: duplicate.placeOfBirth },
      OFFICER_NAME
    );

    expect(result.overallLevel).toBe("EXACT");
    expect(() => demoSubmitRegistration(duplicate.id, OFFICER_NAME)).toThrow(/exact duplicate/i);
  });

  it("routes a potential match to exception review instead of blocking it", async () => {
    const db = getDemoData();
    const original = db.crvsRegistrations.find((c) => c.reference === "BR-DEMO-2026-0001")!;

    const input: CreateRegistrationInput = {
      sourceType: "COMMUNITY",
      occurrenceType: "FACILITY",
      facilityId: original.facilityId,
      facilityName: original.facilityName,
      placeOfBirth: original.placeOfBirth,
      processingOfficeId: "OFFICE-DEMO-01",
      processingOfficeName: "Demo District Registration Office",
      jurisdiction: "Demo District",
      dateOfBirth: original.dateOfBirth,
      dateReported: new Date().toISOString(),
      registrationCategory: "Standard",
      child: { ...original.child, firstName: "Completely", lastName: "Different" },
      mother: { ...original.mother },
      father: { availability: "NOT_DECLARED" },
      declarant: {
        relationship: "Mother",
        documentType: "NATIONAL_ID",
        documentNumber: original.mother.documentNumber,
        firstName: original.mother.firstName,
        lastName: original.mother.lastName,
        verification: "VERIFIED",
      },
    };

    const potential = demoCreateRegistrationDraft(input, OFFICER_ID, OFFICER_NAME);
    const result = await demoRunDuplicateCheck(
      potential.id,
      { child: potential.child, mother: potential.mother, facilityId: potential.facilityId, placeOfBirth: potential.placeOfBirth },
      OFFICER_NAME
    );

    expect(["POTENTIAL", "PROBABLE"]).toContain(result.overallLevel);
    const submitted = demoSubmitRegistration(potential.id, OFFICER_NAME);
    expect(submitted.status).toBe("EXCEPTION_REVIEW");

    const resolved = demoResolveDuplicate(
      potential.id,
      { type: "NOT_DUPLICATE", reason: "Different child confirmed after manual review." },
      SUPERVISOR_NAME
    );
    expect(resolved.duplicateCheck?.resolution?.type).toBe("NOT_DUPLICATE");

    const auditActions = getDemoData()
      .auditEvents.filter((e) => e.targetRef === potential.reference)
      .map((e) => e.action);
    expect(auditActions).toContain("resolved duplicate");
  });

  it("never flags multiple-birth siblings as duplicates of each other", () => {
    const db = getDemoData();
    const twinA = db.crvsRegistrations.find((c) => c.reference === "BR-DEMO-2026-0017")!;
    const twinB = db.crvsRegistrations.find((c) => c.reference === "BR-DEMO-2026-0018")!;

    const candidates = findDuplicateCandidates(
      { child: twinA.child, mother: twinA.mother, facilityId: twinA.facilityId, placeOfBirth: twinA.placeOfBirth },
      [twinB],
      twinA.id
    );

    expect(overallMatchLevel(candidates)).toBe("NONE");
  });
});
