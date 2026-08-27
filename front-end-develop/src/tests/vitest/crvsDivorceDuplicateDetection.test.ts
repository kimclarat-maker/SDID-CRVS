import { describe, expect, it } from "vitest";
import { findDivorceDuplicateCandidates, overallDivorceMatchLevel, findExistingDivorceConflicts } from "@/domain/crvs/divorceDuplicateDetection";
import { DivorceRegistration } from "@/domain/crvs/types";

function registration(overrides: Partial<DivorceRegistration> & Pick<DivorceRegistration, "id">): DivorceRegistration {
  return {
    reference: `DR-DEMO-TEST-${overrides.id}`,
    status: "SUBMITTED",
    source: "APPLICANT",
    applicant: { documentType: "NATIONAL_ID", relationshipToCase: "FORMER_SPOUSE_1", identityVerification: "VERIFIED" },
    existingMarriage: {
      status: "MATCHED",
      candidates: [],
      notFoundEvidence: [],
      selected: { marriageApplicationId: "MR-1", registrationNumber: "CRVS-MARRIAGE-DEMO-0001", marriageDate: "2010-01-01", spouse1Name: "Amara Bello", spouse2Name: "Kwame Toure", matchConfidence: "HIGH" },
    },
    formerSpouse1: { spouseKey: "SPOUSE1", sex: "FEMALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
    formerSpouse2: { spouseKey: "SPOUSE2", sex: "MALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
    judgment: { country: "Rwanda", courtOrAuthorityName: "Demo Court", courtCaseNumber: "CASE-1", judgmentNumber: "JGT-1", judgmentDate: "2026-01-01", decisionType: "MUTUAL_CONSENT", isForeign: false },
    judgmentVerification: { status: "NOT_STARTED", results: [] },
    foreignRecognition: {
      status: "NOT_APPLICABLE",
      country: "",
      foreignCourtOrAuthority: "",
      translationRequired: false,
      translationProvided: false,
      authenticationRequired: false,
      authenticationProvided: false,
      exequaturOrRecognitionRequired: false,
      exequaturOrRecognitionProvided: false,
      missingRequirements: [],
    },
    evidence: [],
    processingOffice: { selectedProcessingOfficeId: "OFF-1", selectedProcessingOfficeName: "Demo Office", embassyOrForeignOfficePath: false, jurisdictionResult: "CONFIRMED" },
    jurisdiction: "Demo District",
    reviewSections: {
      APPLICANT: "NOT_REVIEWED",
      EXISTING_MARRIAGE: "NOT_REVIEWED",
      FORMER_SPOUSE_1: "NOT_REVIEWED",
      FORMER_SPOUSE_2: "NOT_REVIEWED",
      COURT_DECISION: "NOT_REVIEWED",
      EVIDENCE: "NOT_REVIEWED",
      IDENTITY_CHECKS: "NOT_REVIEWED",
      PROCESSING_OFFICE: "NOT_REVIEWED",
      OFFICER_DECLARATION: "NOT_REVIEWED",
    },
    reviewDecisions: [],
    correctionRequests: [],
    officerId: "divorce.officer@demo.identity.local",
    officerName: "Divorce Officer",
    accuracyDeclarationConfirmed: false,
    authorityToSubmitConfirmed: false,
    judgmentFinalConfirmed: false,
    privacyAcknowledged: false,
    electronicSubmissionConfirmed: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sdid: { status: "NOT_READY", spouse1: { status: "NOT_READY", attempts: [] }, spouse2: { status: "NOT_READY", attempts: [] } },
    statusHistory: [],
    version: 1,
    ...overrides,
  };
}

describe("findDivorceDuplicateCandidates", () => {
  it("flags an EXACT match when both the court case number and judgment number match", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findDivorceDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-1", judgmentNumber: "JGT-1" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("EXACT");
  });

  it("flags POTENTIAL when only the underlying marriage matches", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findDivorceDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-OTHER", judgmentNumber: "JGT-OTHER" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("POTENTIAL");
  });

  it("returns no candidates for genuinely unrelated registrations", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findDivorceDuplicateCandidates({ marriageApplicationId: "MR-2", courtCaseNumber: "CASE-2", judgmentNumber: "JGT-2" }, existing);
    expect(candidates).toHaveLength(0);
  });

  it("excludes non-active registrations (REJECTED/CANCELLED) and the registration being edited", () => {
    const existing = [registration({ id: "1", status: "REJECTED" }), registration({ id: "2" })];
    const candidates = findDivorceDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-1", judgmentNumber: "JGT-1" }, existing, "2");
    expect(candidates).toHaveLength(0);
  });

  it("overallDivorceMatchLevel returns the highest-ranked candidate's level", () => {
    const candidates = [
      { registrationId: "a", reference: "A", matchLevel: "POTENTIAL" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
      { registrationId: "b", reference: "B", matchLevel: "EXACT" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
    ];
    expect(overallDivorceMatchLevel(candidates)).toBe("EXACT");
    expect(overallDivorceMatchLevel([])).toBe("NONE");
  });
});

describe("findExistingDivorceConflicts", () => {
  it("flags when the same underlying marriage already has another active divorce registration", () => {
    const existing = [registration({ id: "1", status: "UNDER_REVIEW" })];
    const conflicts = findExistingDivorceConflicts("MR-1", existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].matchLevel).toBe("EXACT");
  });

  it("does not flag against a REJECTED or CANCELLED registration", () => {
    const existing = [registration({ id: "1", status: "REJECTED" })];
    expect(findExistingDivorceConflicts("MR-1", existing)).toHaveLength(0);
  });

  it("returns nothing when no marriage id is supplied (not yet matched)", () => {
    const existing = [registration({ id: "1" })];
    expect(findExistingDivorceConflicts(undefined, existing)).toHaveLength(0);
  });

  it("excludes the registration being edited", () => {
    const existing = [registration({ id: "1" })];
    expect(findExistingDivorceConflicts("MR-1", existing, "1")).toHaveLength(0);
  });
});
