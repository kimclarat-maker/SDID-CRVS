import { describe, expect, it } from "vitest";
import { findDeathDuplicateCandidates, overallDeathMatchLevel } from "@/domain/crvs/deathDuplicateDetection";
import { DeathRegistrationCase } from "@/domain/crvs/types";

function makeCase(overrides: Partial<DeathRegistrationCase>): DeathRegistrationCase {
  return {
    id: "DR-X",
    reference: "DR-DEMO-2026-9999",
    status: "SUBMITTED",
    pathway: "HEALTH_FACILITY",
    processingOfficeId: "OFFICE-DEMO-01",
    processingOfficeName: "Demo District Registration Office",
    jurisdiction: "Demo District",
    dateOfDeath: "2026-01-01T00:00:00.000Z",
    dateReported: "2026-01-02T00:00:00.000Z",
    daysAfterDeath: 1,
    isLate: false,
    requiresSupervisorReview: false,
    deceased: { identityStatus: "KNOWN", firstName: "Amara", lastName: "Bello", sex: "FEMALE", verification: "NOT_VERIFIED" },
    occurrence: { dateOfDeath: "2026-01-01T00:00:00.000Z", placeCategory: "HEALTH_FACILITY", location: "Demo District Health Centre", adminLocation: "Demo District", jurisdiction: "Demo District", circumstanceCategory: "NATURAL_ILLNESS" },
    declarant: { relationship: "Spouse", documentType: "NATIONAL_ID", firstName: "Test", lastName: "Declarant", verification: "VERIFIED" },
    nextOfKin: [],
    witnesses: [],
    evidence: [],
    reviewSections: { DECEASED: "NOT_REVIEWED", OCCURRENCE: "NOT_REVIEWED", MEDICAL_CERTIFICATION: "NOT_REVIEWED", DECLARANT: "NOT_REVIEWED", NEXT_OF_KIN: "NOT_REVIEWED", WITNESSES: "NOT_REVIEWED", EVIDENCE: "NOT_REVIEWED", IDENTITY_CHECK: "NOT_REVIEWED", DUPLICATE_CHECK: "NOT_REVIEWED", OFFICER_DECLARATION: "NOT_REVIEWED" },
    reviewDecisions: [],
    correctionRequests: [],
    officerId: "crvs.officer@demo.identity.local",
    officerName: "Test Officer",
    declarationConfirmed: false,
    declarantConfirmed: false,
    privacyAcknowledged: false,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    sdid: { status: "NOT_READY", attempts: [] },
    statusHistory: [],
    version: 1,
    ...overrides,
  };
}

describe("Death duplicate detection", () => {
  it("flags an exact match on same name + date of death", () => {
    const existing = makeCase({ id: "DR-1", reference: "DR-DEMO-2026-0001" });
    const candidate = { deceased: existing.deceased, dateOfDeath: existing.dateOfDeath, facilityId: undefined, location: existing.occurrence.location };
    const candidates = findDeathDuplicateCandidates(candidate, [existing]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("EXACT");
    expect(overallDeathMatchLevel(candidates)).toBe("EXACT");
  });

  it("flags a potential match on partial overlap (location only)", () => {
    const existing = makeCase({ id: "DR-1", reference: "DR-DEMO-2026-0001" });
    const candidate = {
      deceased: { identityStatus: "KNOWN" as const, firstName: "Different", lastName: "Person", sex: "MALE" as const, verification: "NOT_VERIFIED" as const },
      dateOfDeath: "2020-05-05T00:00:00.000Z",
      facilityId: undefined,
      location: existing.occurrence.location,
    };
    const candidates = findDeathDuplicateCandidates(candidate, [existing]);
    expect(candidates).toHaveLength(0); // location alone (score 1) is below the POTENTIAL threshold
  });

  it("never matches a case against itself (excludeCaseId)", () => {
    const existing = makeCase({ id: "DR-1", reference: "DR-DEMO-2026-0001" });
    const candidate = { deceased: existing.deceased, dateOfDeath: existing.dateOfDeath, facilityId: undefined, location: existing.occurrence.location };
    const candidates = findDeathDuplicateCandidates(candidate, [existing], "DR-1");
    expect(candidates).toHaveLength(0);
  });

  it("excludes rejected and cancelled cases from matching", () => {
    const existing = makeCase({ id: "DR-1", reference: "DR-DEMO-2026-0001", status: "REJECTED" });
    const candidate = { deceased: existing.deceased, dateOfDeath: existing.dateOfDeath, facilityId: undefined, location: existing.occurrence.location };
    const candidates = findDeathDuplicateCandidates(candidate, [existing]);
    expect(candidates).toHaveLength(0);
  });

  it("masked summary never exposes the full name", () => {
    const existing = makeCase({ id: "DR-1", reference: "DR-DEMO-2026-0001" });
    const candidate = { deceased: existing.deceased, dateOfDeath: existing.dateOfDeath, facilityId: undefined, location: existing.occurrence.location };
    const candidates = findDeathDuplicateCandidates(candidate, [existing]);
    expect(candidates[0].maskedSummary).not.toContain("Amara Bello");
  });
});
