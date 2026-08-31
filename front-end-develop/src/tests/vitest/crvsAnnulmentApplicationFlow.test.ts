import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData, updateDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateAnnulmentRegistrationDraft,
  demoUpdateAnnulmentRegistrationDraft,
  demoSubmitAnnulmentRegistration,
  demoStartAnnulmentReview,
  demoRequestAnnulmentCorrection,
  demoRouteAnnulmentToDecisionVerification,
  demoRouteAnnulmentToLegalEffectReview,
  demoRouteAnnulmentToForeignReview,
  demoRouteAnnulmentToException,
  demoResolveAnnulmentException,
  demoApproveAnnulmentRegistration,
  demoRejectAnnulmentRegistration,
  demoRegisterAnnulment,
} from "@/demo/services/crvsAnnulmentRegistrations";
import { demoConfirmAnnulmentLegalEffectClassification } from "@/demo/services/crvsAnnulmentLegalEffect";
import { ConcurrencyError, NotFoundError } from "@/demo/services/crvsErrors";
import { AffectedParty, AnnulmentApplicant, AnnulmentDecision, AnnulmentExistingMarriageMatch } from "@/domain/crvs/types";

const OFFICER_ID = "annulment.officer@demo.identity.local";
const OFFICER_NAME = "Test Annulment Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const SUPERVISOR_NAME = "Test CRVS Supervisor";

function applicant(overrides: Partial<AnnulmentApplicant> = {}): AnnulmentApplicant {
  return {
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-9101",
    firstName: "Amara",
    lastName: "Bello",
    relationshipToMarriage: "PARTY_1",
    relationshipToCase: "AFFECTED_PARTY_1",
    identityVerification: "VERIFIED",
    ...overrides,
  };
}

function party(partyKey: "PARTY_1" | "PARTY_2", overrides: Partial<AffectedParty> = {}): AffectedParty {
  return {
    partyKey,
    firstName: partyKey === "PARTY_1" ? "Amara" : "Kwame",
    lastName: partyKey === "PARTY_1" ? "Bello" : "Toure",
    sex: partyKey === "PARTY_1" ? "FEMALE" : "MALE",
    identityMatchConfidence: "CONFIRMED",
    identityVerification: "VERIFIED",
    linkedToSelectedMarriage: true,
    ...overrides,
  };
}

function decision(overrides: Partial<AnnulmentDecision> = {}): AnnulmentDecision {
  return {
    country: "Rwanda",
    courtOrAuthorityName: "Demo Court",
    jurisdiction: "Demo District",
    courtCaseNumber: "CASE-ANN-TEST-1",
    decisionNumber: "ANN-JGT-TEST-1",
    decisionDate: "2026-01-01",
    finalityDate: "2026-02-01",
    effectiveDate: "2026-02-01",
    decisionType: "COURT_ORDER",
    describesMarriageAs: "VOIDABLE",
    legalEffectWording: "The marriage between the parties is hereby annulled and declared void.",
    isForeign: false,
    ...overrides,
  };
}

const matchedMarriage: AnnulmentExistingMarriageMatch = {
  status: "MATCHED",
  candidates: [],
  notFoundEvidence: [],
  selected: {
    marriageApplicationId: "MR-ANN-TEST-1",
    registrationNumber: "CRVS-MARRIAGE-ANN-TEST-0001",
    marriageDate: "2010-01-01",
    party1Name: "Amara Bello",
    party2Name: "Kwame Toure",
    currentCivilStatus: "ACTIVE",
    matchConfidence: "HIGH",
  },
};

function createDraft() {
  return demoCreateAnnulmentRegistrationDraft(
    { source: "APPLICANT", jurisdiction: "Demo District", applicant: applicant(), processingOfficeId: "OFF-TEST", processingOfficeName: "Test Office" },
    OFFICER_ID,
    OFFICER_NAME
  );
}

function readyToSubmitPatch(decisionOverrides: Partial<AnnulmentDecision> = {}) {
  return {
    existingMarriage: matchedMarriage,
    affectedParty1: party("PARTY_1"),
    affectedParty2: party("PARTY_2"),
    decision: decision(decisionOverrides),
    accuracyDeclarationConfirmed: true,
    authorityToSubmitConfirmed: true,
    authoritativeDecisionExistsConfirmed: true,
    decisionCompleteConfirmed: true,
    privacyAcknowledged: true,
    electronicSubmissionConfirmed: true,
  };
}

function seedMarriage() {
  updateDemoData((db) => {
    db.crvsMarriageApplications.push({
      id: "MR-ANN-TEST-1",
      reference: "CRVS-MARRIAGE-ANN-TEST-0001",
      status: "REGISTERED",
      officeId: "OFF-TEST",
      officeName: "Test Office",
      officeType: "DISTRICT_SECTOR_OFFICE",
      jurisdiction: "Demo District",
      applicant1: { spouseRole: "APPLICANT1", nationalityCategory: "CITIZEN", documentType: "NATIONAL_ID", firstName: "Amara", lastName: "Bello", sex: "FEMALE", civilStatus: "SINGLE", verification: "VERIFIED", partnerConfirmationStatus: "NOT_REQUIRED" },
      applicant2: { spouseRole: "APPLICANT2", nationalityCategory: "CITIZEN", documentType: "NATIONAL_ID", firstName: "Kwame", lastName: "Toure", sex: "MALE", civilStatus: "SINGLE", verification: "VERIFIED", partnerConfirmationStatus: "CONFIRMED" },
      ceremonyType: "CIVIL",
      isSpecialDayRequest: false,
      evidence: [],
      witnesses: [],
      payment: { status: "NOT_REQUIRED", amount: 0, currency: "RWF", isSpecialDayFee: false, attempts: [] },
      reviewSections: { APPLICANT1: "NOT_REVIEWED", APPLICANT2: "NOT_REVIEWED", PROPOSED_MARRIAGE: "NOT_REVIEWED", ELIGIBILITY: "NOT_REVIEWED", EVIDENCE: "NOT_REVIEWED", WITNESSES: "NOT_REVIEWED", PAYMENT: "NOT_REVIEWED", OFFICER_DECLARATION: "NOT_REVIEWED" },
      reviewDecisions: [],
      correctionRequests: [],
      officerId: "marriage.officer@demo.identity.local",
      officerName: "Test Marriage Officer",
      declarationConfirmed: true,
      consentToVerification: true,
      privacyAcknowledged: true,
      createdAt: "2010-01-01T00:00:00.000Z",
      updatedAt: "2010-01-01T00:00:00.000Z",
      registeredAt: "2010-01-01T00:00:00.000Z",
      sdid: { status: "NOT_READY", applicant1: { status: "NOT_READY", attempts: [] }, applicant2: { status: "NOT_READY", attempts: [] } },
      statusHistory: [{ status: "REGISTERED", at: "2010-01-01T00:00:00.000Z", by: "Test Marriage Officer" }],
      version: 1,
    });
    return db;
  });
}

/** Drives a fresh annulment registration to UNDER_REVIEW via the real
 * service functions. */
function submitAndReview(decisionOverrides: Partial<AnnulmentDecision> = {}) {
  const draft = createDraft();
  demoUpdateAnnulmentRegistrationDraft(draft.id, readyToSubmitPatch(decisionOverrides), OFFICER_NAME, draft.version);
  demoSubmitAnnulmentRegistration(draft.id, OFFICER_NAME);
  return demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
}

describe("Annulment registration flow", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
    seedMarriage();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("drives a draft through submit -> review -> decision verification -> legal-effect classification -> approve -> register, and annotates (never overwrites) the original marriage record", () => {
    const draft = createDraft();
    expect(draft.status).toBe("DRAFT");

    const patched = demoUpdateAnnulmentRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    expect(patched.version).toBe(draft.version + 1);

    const submitted = demoSubmitAnnulmentRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeTruthy();

    const underReview = demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(underReview.status).toBe("UNDER_REVIEW");
    expect(underReview.reviewerId).toBe(REGISTRAR_ID);

    const decisionVerification = demoRouteAnnulmentToDecisionVerification(draft.id, REGISTRAR_NAME);
    expect(decisionVerification.status).toBe("DECISION_VERIFICATION");
    demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const legalEffectReview = demoRouteAnnulmentToLegalEffectReview(draft.id, REGISTRAR_NAME);
    expect(legalEffectReview.status).toBe("LEGAL_EFFECT_REVIEW");
    demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    // Approval is blocked while the legal-effect classification is unresolved
    // (annulment-specific gate — no divorce equivalent).
    expect(() => demoApproveAnnulmentRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, "Attempted before classification.", true, true)).toThrow(/legal-effect classification/i);

    const classified = demoConfirmAnnulmentLegalEffectClassification(draft.id, "ANNULLED_FROM_DECISION_DATE", REGISTRAR_NAME, "Decision clearly states void from the decision date.");
    expect(classified.legalEffect.confirmedClassification).toBe("ANNULLED_FROM_DECISION_DATE");
    expect(classified.legalEffect.lockedAt).toBeFalsy(); // not locked until approval

    const approved = demoApproveAnnulmentRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, "Looks correct.", true, true);
    expect(approved.status).toBe("APPROVED");
    expect(approved.sdid.status).toBe("NOT_READY"); // SDID not touched yet — only after the separate register action
    expect(approved.legalEffect.lockedAt).toBeTruthy(); // locked the moment the case is approved
    expect(approved.legalEffect.classificationHistory[approved.legalEffect.classificationHistory.length - 1].locked).toBe(true);

    const registered = demoRegisterAnnulment(draft.id, "2026-02-15", REGISTRAR_ID, REGISTRAR_NAME);
    expect(registered.status).toBe("REGISTERED");
    expect(registered.registrationEvent?.registrationNumber).toMatch(/^CRVS-ANNULMENT-DEMO-/);
    expect(registered.sdid.status).toBe("PENDING"); // enqueued for sync
    expect(registered.marriageAnnulmentUpdate?.applied).toBe(true);
    expect(registered.existingMarriageCertificateConsequence).toBeTruthy();

    const marriage = getDemoData().crvsMarriageApplications.find((m) => m.id === "MR-ANN-TEST-1")!;
    expect(marriage.status).toBe("REGISTERED"); // original registration status is immutable, never overwritten
    expect(marriage.annulment?.annulmentRegistrationReference).toBe(registered.reference);
    expect(marriage.annulment?.legalEffectClassification).toBe("ANNULLED_FROM_DECISION_DATE");
    expect(marriage.applicant1.firstName).toBe("Amara"); // original data preserved verbatim
  });

  it("blocks approval when the maker-checker confirmation checkboxes are not both set", () => {
    const draft = createDraft();
    demoUpdateAnnulmentRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitAnnulmentRegistration(draft.id, OFFICER_NAME);
    demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    expect(() => demoApproveAnnulmentRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, undefined, false, true)).toThrow(/must confirm/i);
    expect(() => demoApproveAnnulmentRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, undefined, true, false)).toThrow(/must confirm/i);
  });

  it("blocks approval by the same officer who prepared the case (maker-checker)", () => {
    const draft = createDraft();
    demoUpdateAnnulmentRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitAnnulmentRegistration(draft.id, OFFICER_NAME);
    demoStartAnnulmentReview(draft.id, OFFICER_ID, OFFICER_NAME);

    expect(() => demoApproveAnnulmentRegistration(draft.id, OFFICER_ID, OFFICER_NAME, undefined, true, true)).toThrow(/prepared this annulment registration/i);
  });

  it("runs the correction -> resubmit cycle (requestType CORRECTION) and preserves the original correction history", () => {
    const underReview = submitAndReview();

    const corrected = demoRequestAnnulmentCorrection(
      underReview.id,
      {
        requestType: "CORRECTION",
        requestedBy: REGISTRAR_NAME,
        items: [{ id: "x", section: "DECISION", fields: ["decision.courtRegistryReference"], reason: "Missing court registry reference.", documentsRequired: false, addressed: false }],
        notifyApplicants: true,
      },
      REGISTRAR_NAME
    );
    expect(corrected.status).toBe("CORRECTION_REQUIRED");
    expect(corrected.correctionRequests).toHaveLength(1);
    expect(corrected.correctionRequests[0].requestType).toBe("CORRECTION");

    const resubmitted = demoSubmitAnnulmentRegistration(underReview.id, OFFICER_NAME);
    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.correctionRequests[0].resolvedAt).toBeTruthy();
    expect(resubmitted.correctionRequests[0].items[0].reason).toBe("Missing court registry reference."); // original text never overwritten
    expect(resubmitted.correctionRequests[0].items[0].addressed).toBe(true);
  });

  it("runs the additional-evidence cycle (requestType EVIDENCE) as a distinct path from correction", () => {
    const underReview = submitAndReview();

    const evidenceRequested = demoRequestAnnulmentCorrection(
      underReview.id,
      {
        requestType: "EVIDENCE",
        requestedBy: REGISTRAR_NAME,
        items: [{ id: "y", section: "EVIDENCE", fields: ["evidence"], reason: "Proof that the decision became final was not attached.", documentsRequired: true, addressed: false }],
        notifyApplicants: true,
      },
      REGISTRAR_NAME
    );
    expect(evidenceRequested.status).toBe("CORRECTION_REQUIRED");
    expect(evidenceRequested.correctionRequests).toHaveLength(1);
    expect(evidenceRequested.correctionRequests[0].requestType).toBe("EVIDENCE");

    const resubmitted = demoSubmitAnnulmentRegistration(underReview.id, OFFICER_NAME);
    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.correctionRequests[0].resolvedAt).toBeTruthy();
    expect(resubmitted.correctionRequests[0].items[0].reason).toBe("Proof that the decision became final was not attached.");
    expect(resubmitted.correctionRequests[0].items[0].addressed).toBe(true);
  });

  it("routes to and returns from foreign-decision review without skipping the review stage", () => {
    const underReview = submitAndReview({ isForeign: true, country: "Republic of Sindara", courtOrAuthorityName: "Sindara Family Court" });

    const foreignReview = demoRouteAnnulmentToForeignReview(underReview.id, REGISTRAR_NAME);
    expect(foreignReview.status).toBe("FOREIGN_DECISION_REVIEW");

    const backToReview = demoStartAnnulmentReview(underReview.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(backToReview.status).toBe("UNDER_REVIEW");
  });

  it("rejects a registration with a recorded reason", () => {
    const underReview = submitAndReview();

    const rejected = demoRejectAnnulmentRegistration(underReview.id, { reason: "Applicant authority unclear", explanation: "No authorization document provided.", evidenceRefs: [], applicantsNotified: true }, REGISTRAR_ID, REGISTRAR_NAME);
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason?.reason).toBe("Applicant authority unclear");
  });

  it("routes to and resolves exception review without skipping the review stage", () => {
    const underReview = submitAndReview();

    const exceptioned = demoRouteAnnulmentToException(underReview.id, { type: "DECISION_NOT_FINAL", reason: "Finality date missing on submission." }, REGISTRAR_NAME);
    expect(exceptioned.status).toBe("EXCEPTION_REVIEW");
    expect(exceptioned.exception?.status).toBe("OPEN");

    const resolved = demoResolveAnnulmentException(underReview.id, { type: "CLEARED", reason: "Court confirmed finality by phone follow-up.", nextStatus: "UNDER_REVIEW" }, SUPERVISOR_NAME);
    expect(resolved.status).toBe("UNDER_REVIEW");
    expect(resolved.exception?.status).toBe("RESOLVED");
  });

  it("blocks submission of an exact duplicate annulment registration (same marriage, court case number and decision number)", () => {
    const firstDraft = createDraft();
    demoUpdateAnnulmentRegistrationDraft(firstDraft.id, readyToSubmitPatch({ courtCaseNumber: "CASE-DUP-1", decisionNumber: "DEC-DUP-1" }), OFFICER_NAME, firstDraft.version);
    demoSubmitAnnulmentRegistration(firstDraft.id, OFFICER_NAME);

    const secondDraft = createDraft();
    demoUpdateAnnulmentRegistrationDraft(secondDraft.id, readyToSubmitPatch({ courtCaseNumber: "CASE-DUP-1", decisionNumber: "DEC-DUP-1" }), OFFICER_NAME, secondDraft.version);
    expect(() => demoSubmitAnnulmentRegistration(secondDraft.id, OFFICER_NAME)).toThrow(/duplicate/i);
  });

  it("enforces optimistic concurrency on draft edits", () => {
    const draft = createDraft();
    expect(() => demoUpdateAnnulmentRegistrationDraft(draft.id, { accuracyDeclarationConfirmed: true }, OFFICER_NAME, draft.version + 5)).toThrow(ConcurrencyError);
  });

  it("throws NotFoundError for an unknown registration id", () => {
    expect(() => demoStartAnnulmentReview("NOT-A-REAL-ID", REGISTRAR_ID, REGISTRAR_NAME)).toThrow(NotFoundError);
  });
});
