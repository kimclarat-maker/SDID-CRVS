import { describe, expect, it } from "vitest";
import {
  findAnnulmentDuplicateCandidates,
  overallAnnulmentMatchLevel,
  findExistingAnnulmentConflicts,
  findExistingDivorceConflictForMarriage,
  findJudicialSeparationOrCorrectionFlags,
} from "@/domain/crvs/annulmentDuplicateDetection";
import { AnnulmentRegistration, DivorceRegistration, MarriageApplication, emptyAnnulmentReviewSections } from "@/domain/crvs/types";

function registration(overrides: Partial<AnnulmentRegistration> & Pick<AnnulmentRegistration, "id">): AnnulmentRegistration {
  return {
    reference: `AN-DEMO-TEST-${overrides.id}`,
    status: "SUBMITTED",
    source: "APPLICANT",
    applicant: { documentType: "NATIONAL_ID", relationshipToMarriage: "PARTY_1", relationshipToCase: "AFFECTED_PARTY_1", identityVerification: "VERIFIED" },
    existingMarriage: {
      status: "MATCHED",
      candidates: [],
      notFoundEvidence: [],
      selected: { marriageApplicationId: "MR-1", registrationNumber: "CRVS-MARRIAGE-DEMO-0001", marriageDate: "2010-01-01", party1Name: "Amara Bello", party2Name: "Kwame Toure", currentCivilStatus: "ACTIVE", matchConfidence: "HIGH" },
    },
    affectedParty1: { partyKey: "PARTY_1", firstName: "Amara", lastName: "Bello", sex: "FEMALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
    affectedParty2: { partyKey: "PARTY_2", firstName: "Kwame", lastName: "Toure", sex: "MALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
    decision: {
      country: "Rwanda",
      courtOrAuthorityName: "Demo Court",
      jurisdiction: "Demo District",
      courtCaseNumber: "CASE-1",
      decisionNumber: "JGT-1",
      decisionDate: "2026-01-01",
      finalityDate: "2026-02-01",
      decisionType: "COURT_ORDER",
      describesMarriageAs: "VOIDABLE",
      legalEffectWording: "The marriage between the parties is hereby annulled and declared void.",
      isForeign: false,
    },
    decisionVerification: { status: "NOT_STARTED", results: [] },
    legalEffect: {
      marriageStatusResult: "REQUIRES_MANUAL_REVIEW",
      proposedSdid: {
        party1: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
        party2: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
      },
      relationshipHistoryTreatment: "MARK_ANNULLED_PRESERVE_HISTORY",
      certificateConsequence: "MANUAL_REVIEW",
      downstreamChangesExplicitlyExcluded: [],
      classificationHistory: [],
    },
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
    reviewSections: emptyAnnulmentReviewSections(),
    reviewDecisions: [],
    correctionRequests: [],
    officerId: "annulment.officer@demo.identity.local",
    officerName: "Annulment Officer",
    accuracyDeclarationConfirmed: false,
    authorityToSubmitConfirmed: false,
    authoritativeDecisionExistsConfirmed: false,
    decisionCompleteConfirmed: false,
    privacyAcknowledged: false,
    electronicSubmissionConfirmed: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sdid: { status: "NOT_READY", party1: { status: "NOT_READY", attempts: [] }, party2: { status: "NOT_READY", attempts: [] } },
    statusHistory: [],
    version: 1,
    ...overrides,
  };
}

// Minimal DivorceRegistration fixture — mirrors crvsDivorceDuplicateDetection
// .test.ts's own `registration()` builder exactly, since
// findExistingDivorceConflictForMarriage reads a real DivorceRegistration[].
function divorceRegistration(overrides: Partial<DivorceRegistration> & Pick<DivorceRegistration, "id">): DivorceRegistration {
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

describe("findAnnulmentDuplicateCandidates", () => {
  it("flags an EXACT match when both the court case number and decision number match, regardless of the underlying marriage", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-OTHER", courtCaseNumber: "CASE-1", decisionNumber: "JGT-1" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("EXACT");
  });

  it("flags PROBABLE when the marriage and the court case number both match but the decision number doesn't", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-1", decisionNumber: "JGT-OTHER" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("PROBABLE");
  });

  it("flags PROBABLE when the marriage and the decision number both match but the court case number doesn't", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-OTHER", decisionNumber: "JGT-1" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("PROBABLE");
  });

  it("flags POTENTIAL when only the underlying marriage matches", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-OTHER", decisionNumber: "JGT-OTHER" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("POTENTIAL");
    expect(candidates[0].matchedFields).toEqual(["Underlying marriage record"]);
  });

  it("flags POTENTIAL when only the court case number matches", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-OTHER", courtCaseNumber: "CASE-1", decisionNumber: "JGT-OTHER" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("POTENTIAL");
  });

  it("flags POTENTIAL when only the decision number matches", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-OTHER", courtCaseNumber: "CASE-OTHER", decisionNumber: "JGT-1" }, existing);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].matchLevel).toBe("POTENTIAL");
  });

  it("returns no candidates for genuinely unrelated registrations", () => {
    const existing = [registration({ id: "1" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-2", courtCaseNumber: "CASE-2", decisionNumber: "JGT-2" }, existing);
    expect(candidates).toHaveLength(0);
  });

  it("excludes non-active registrations (REJECTED/CANCELLED) and the registration being edited", () => {
    const existing = [registration({ id: "1", status: "REJECTED" }), registration({ id: "2" })];
    const candidates = findAnnulmentDuplicateCandidates({ marriageApplicationId: "MR-1", courtCaseNumber: "CASE-1", decisionNumber: "JGT-1" }, existing, "2");
    expect(candidates).toHaveLength(0);
  });

  it("overallAnnulmentMatchLevel returns the highest-ranked candidate's level", () => {
    const candidates = [
      { registrationId: "a", reference: "A", matchLevel: "POTENTIAL" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
      { registrationId: "b", reference: "B", matchLevel: "EXACT" as const, matchedFields: [], maskedSummary: "", existingRecordStatus: "SUBMITTED" as const },
    ];
    expect(overallAnnulmentMatchLevel(candidates)).toBe("EXACT");
    expect(overallAnnulmentMatchLevel([])).toBe("NONE");
  });
});

describe("findExistingAnnulmentConflicts", () => {
  it("flags when the same underlying marriage already has another active annulment registration", () => {
    const existing = [registration({ id: "1", status: "UNDER_REVIEW" })];
    const conflicts = findExistingAnnulmentConflicts("MR-1", existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].matchLevel).toBe("EXACT");
  });

  it("does not flag against a REJECTED or CANCELLED registration", () => {
    const existing = [registration({ id: "1", status: "REJECTED" })];
    expect(findExistingAnnulmentConflicts("MR-1", existing)).toHaveLength(0);
  });

  it("returns nothing when no marriage id is supplied (not yet matched)", () => {
    const existing = [registration({ id: "1" })];
    expect(findExistingAnnulmentConflicts(undefined, existing)).toHaveLength(0);
  });

  it("excludes the registration being edited", () => {
    const existing = [registration({ id: "1" })];
    expect(findExistingAnnulmentConflicts("MR-1", existing, "1")).toHaveLength(0);
  });
});

describe("findExistingDivorceConflictForMarriage (annulment-only reciprocal check, no divorce analog)", () => {
  it("flags a conflict when the same marriage already has a REGISTERED divorce on file", () => {
    const divorces = [divorceRegistration({ id: "1", status: "REGISTERED", registeredAt: "2026-01-10T00:00:00.000Z" })];
    const conflicts = findExistingDivorceConflictForMarriage("MR-1", divorces);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].registrationId).toBe("1");
    expect(conflicts[0].reference).toBe("DR-DEMO-TEST-1");
  });

  it("does not flag when the matching divorce registration has not reached REGISTERED", () => {
    const divorces = [divorceRegistration({ id: "1", status: "UNDER_REVIEW" })];
    expect(findExistingDivorceConflictForMarriage("MR-1", divorces)).toHaveLength(0);
  });

  it("does not flag an unrelated marriage's registered divorce", () => {
    const divorces = [divorceRegistration({ id: "1", status: "REGISTERED" })];
    expect(findExistingDivorceConflictForMarriage("MR-OTHER", divorces)).toHaveLength(0);
  });

  it("returns nothing when no marriage id is supplied", () => {
    const divorces = [divorceRegistration({ id: "1", status: "REGISTERED" })];
    expect(findExistingDivorceConflictForMarriage(undefined, divorces)).toHaveLength(0);
  });
});

describe("findJudicialSeparationOrCorrectionFlags (demo-only markers, no live cross-module workflow)", () => {
  it("flags judicial separation when the marriage record carries a judicialSeparation marker", () => {
    const marriage = { judicialSeparation: { recordedAt: "2026-01-01T00:00:00.000Z" } } as unknown as MarriageApplication;
    expect(findJudicialSeparationOrCorrectionFlags(marriage)).toEqual({ judicialSeparation: true, correctionPending: false });
  });

  it("flags correction-pending when the marriage record carries correctionPending", () => {
    const marriage = { correctionPending: true } as unknown as MarriageApplication;
    expect(findJudicialSeparationOrCorrectionFlags(marriage)).toEqual({ judicialSeparation: false, correctionPending: true });
  });

  it("returns both false when neither marker is set", () => {
    const marriage = {} as unknown as MarriageApplication;
    expect(findJudicialSeparationOrCorrectionFlags(marriage)).toEqual({ judicialSeparation: false, correctionPending: false });
  });

  it("does not throw and returns both false when called with no marriage at all", () => {
    expect(() => findJudicialSeparationOrCorrectionFlags(undefined)).not.toThrow();
    expect(findJudicialSeparationOrCorrectionFlags(undefined)).toEqual({ judicialSeparation: false, correctionPending: false });
  });
});
