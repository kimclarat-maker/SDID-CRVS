import { describe, expect, it } from "vitest";
import { findMarriageDuplicateCandidates, overallMarriageMatchLevel, findExistingMarriageConflicts } from "@/domain/crvs/marriageDuplicateDetection";
import { MarriageApplication, MarriageApplicant } from "@/domain/crvs/types";

function applicant(spouseRole: "APPLICANT1" | "APPLICANT2", firstName: string, lastName: string, overrides: Partial<MarriageApplicant> = {}): MarriageApplicant {
  return {
    spouseRole,
    nationalityCategory: "CITIZEN",
    documentType: "NATIONAL_ID",
    sex: spouseRole === "APPLICANT1" ? "FEMALE" : "MALE",
    firstName,
    lastName,
    civilStatus: "SINGLE",
    verification: "VERIFIED",
    partnerConfirmationStatus: "NOT_REQUIRED",
    ...overrides,
  };
}

function application(overrides: Partial<MarriageApplication> & Pick<MarriageApplication, "id">): MarriageApplication {
  return {
    reference: `MR-DEMO-2026-TEST-${overrides.id}`,
    status: "SUBMITTED",
    officeId: "OFF-1",
    officeName: "Demo Office",
    officeType: "DISTRICT_SECTOR_OFFICE",
    jurisdiction: "Demo District",
    applicant1: applicant("APPLICANT1", "Amara", "Bello"),
    applicant2: applicant("APPLICANT2", "Kwame", "Toure"),
    proposedMarriageDate: "2026-06-01T00:00:00.000Z",
    ceremonyType: "CIVIL",
    isSpecialDayRequest: false,
    evidence: [],
    witnesses: [],
    payment: { status: "NOT_REQUIRED", amount: 0, currency: "RWF", isSpecialDayFee: false, attempts: [] },
    reviewSections: {
      APPLICANT1: "NOT_REVIEWED",
      APPLICANT2: "NOT_REVIEWED",
      PROPOSED_MARRIAGE: "NOT_REVIEWED",
      ELIGIBILITY: "NOT_REVIEWED",
      EVIDENCE: "NOT_REVIEWED",
      WITNESSES: "NOT_REVIEWED",
      PAYMENT: "NOT_REVIEWED",
      OFFICER_DECLARATION: "NOT_REVIEWED",
    },
    reviewDecisions: [],
    correctionRequests: [],
    officerId: "officer@demo.identity.local",
    officerName: "Marriage Officer",
    declarationConfirmed: false,
    consentToVerification: false,
    privacyAcknowledged: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sdid: {
      status: "NOT_READY",
      applicant1: { status: "NOT_READY", attempts: [] },
      applicant2: { status: "NOT_READY", attempts: [] },
    },
    statusHistory: [],
    version: 1,
    ...overrides,
  };
}

describe("findMarriageDuplicateCandidates", () => {
  it("flags an EXACT match when both applicants' names and the proposed date match", () => {
    const existing = [application({ id: "1", proposedMarriageDate: "2026-06-01T00:00:00.000Z" })];
    const input = { applicant1: applicant("APPLICANT1", "Amara", "Bello"), applicant2: applicant("APPLICANT2", "Kwame", "Toure"), proposedMarriageDate: "2026-06-01T00:00:00.000Z", officeId: "OFF-1" };
    const candidates = findMarriageDuplicateCandidates(input, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("EXACT");
  });

  it("matches regardless of which slot the names were entered in (swapped applicants)", () => {
    const existing = [application({ id: "1" })];
    const input = { applicant1: applicant("APPLICANT1", "Kwame", "Toure"), applicant2: applicant("APPLICANT2", "Amara", "Bello"), proposedMarriageDate: "2026-06-01T00:00:00.000Z", officeId: "OFF-1" };
    const candidates = findMarriageDuplicateCandidates(input, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("EXACT");
  });

  it("returns no candidates for genuinely unrelated applications", () => {
    const existing = [application({ id: "1" })];
    const input = { applicant1: applicant("APPLICANT1", "Zara", "Ibori"), applicant2: applicant("APPLICANT2", "Owen", "Carter"), proposedMarriageDate: "2026-09-01T00:00:00.000Z", officeId: "OFF-2" };
    expect(findMarriageDuplicateCandidates(input, existing)).toHaveLength(0);
  });

  it("excludes REJECTED/CANCELLED applications and the application being edited", () => {
    const existing = [application({ id: "1", status: "REJECTED" }), application({ id: "2" })];
    const input = { applicant1: applicant("APPLICANT1", "Amara", "Bello"), applicant2: applicant("APPLICANT2", "Kwame", "Toure"), proposedMarriageDate: "2026-06-01T00:00:00.000Z", officeId: "OFF-1" };
    const candidates = findMarriageDuplicateCandidates(input, existing, "2");
    expect(candidates).toHaveLength(0);
  });

  it("overallMarriageMatchLevel returns the highest-ranked candidate's level", () => {
    const candidates = [
      { applicationId: "a", reference: "A", matchLevel: "POTENTIAL" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
      { applicationId: "b", reference: "B", matchLevel: "EXACT" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
    ];
    expect(overallMarriageMatchLevel(candidates)).toBe("EXACT");
    expect(overallMarriageMatchLevel([])).toBe("NONE");
  });
});

describe("findExistingMarriageConflicts", () => {
  it("flags a spouse whose NIN already appears as an applicant on another active application", () => {
    const existing = [application({ id: "1", applicant1: applicant("APPLICANT1", "Sofia", "Dubois", { nin: "NIN-100" }), status: "APPROVED" })];
    const conflicts = findExistingMarriageConflicts(applicant("APPLICANT1", "Sofia", "Dubois", { nin: "NIN-100" }), "APPLICANT1", existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].matchedSpouseRole).toBe("APPLICANT1");
  });

  it("does not flag a conflict against REJECTED or CANCELLED applications", () => {
    const existing = [application({ id: "1", applicant1: applicant("APPLICANT1", "Sofia", "Dubois", { nin: "NIN-100" }), status: "REJECTED" })];
    const conflicts = findExistingMarriageConflicts(applicant("APPLICANT1", "Sofia", "Dubois", { nin: "NIN-100" }), "APPLICANT1", existing);
    expect(conflicts).toHaveLength(0);
  });

  it("matches by sdidIdentityId when NIN is absent", () => {
    const existing = [application({ id: "1", applicant2: applicant("APPLICANT2", "Kwame", "Toure", { sdidIdentityId: "FID-1" }), status: "SUBMITTED" })];
    const conflicts = findExistingMarriageConflicts(applicant("APPLICANT1", "Amara", "Bello", { sdidIdentityId: "FID-1" }), "APPLICANT1", existing);
    expect(conflicts).toHaveLength(1);
  });

  it("returns nothing for a spouse with no identity overlap", () => {
    const existing = [application({ id: "1" })];
    const conflicts = findExistingMarriageConflicts(applicant("APPLICANT1", "Zara", "Ibori", { nin: "NIN-999" }), "APPLICANT1", existing);
    expect(conflicts).toHaveLength(0);
  });
});
