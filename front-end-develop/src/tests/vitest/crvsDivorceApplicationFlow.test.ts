import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData, updateDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateDivorceRegistrationDraft,
  demoUpdateDivorceRegistrationDraft,
  demoSubmitDivorceRegistration,
  demoStartDivorceReview,
  demoRequestDivorceCorrection,
  demoApproveDivorceRegistration,
  demoRejectDivorceRegistration,
  demoRegisterDivorce,
  demoRouteDivorceToException,
  demoResolveDivorceException,
} from "@/demo/services/crvsDivorceRegistrations";
import { ConcurrencyError, NotFoundError } from "@/demo/services/crvsErrors";
import { DivorceApplicant, DivorceJudgment, ExistingMarriageMatch, FormerSpouse } from "@/domain/crvs/types";

const OFFICER_ID = "divorce.officer@demo.identity.local";
const OFFICER_NAME = "Test Divorce Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

function applicant(overrides: Partial<DivorceApplicant> = {}): DivorceApplicant {
  return { documentType: "NATIONAL_ID", documentNumber: "DEMO-ID-9001", firstName: "Amara", lastName: "Bello", relationshipToCase: "FORMER_SPOUSE_1", identityVerification: "VERIFIED", ...overrides };
}

function spouse(spouseKey: "SPOUSE1" | "SPOUSE2", overrides: Partial<FormerSpouse> = {}): FormerSpouse {
  return {
    spouseKey,
    firstName: spouseKey === "SPOUSE1" ? "Amara" : "Kwame",
    lastName: spouseKey === "SPOUSE1" ? "Bello" : "Toure",
    sex: spouseKey === "SPOUSE1" ? "FEMALE" : "MALE",
    identityMatchConfidence: "CONFIRMED",
    identityVerification: "VERIFIED",
    linkedToSelectedMarriage: true,
    ...overrides,
  };
}

function judgment(overrides: Partial<DivorceJudgment> = {}): DivorceJudgment {
  return { country: "Rwanda", courtOrAuthorityName: "Demo Court", courtCaseNumber: "CASE-TEST-1", judgmentNumber: "JGT-TEST-1", judgmentDate: "2026-01-01", finalityDate: "2026-02-01", decisionType: "MUTUAL_CONSENT", isForeign: false, ...overrides };
}

const matchedMarriage: ExistingMarriageMatch = {
  status: "MATCHED",
  candidates: [],
  notFoundEvidence: [],
  selected: { marriageApplicationId: "MR-TEST-1", registrationNumber: "CRVS-MARRIAGE-TEST-0001", marriageDate: "2010-01-01", spouse1Name: "Amara Bello", spouse2Name: "Kwame Toure", matchConfidence: "HIGH" },
};

function createDraft() {
  return demoCreateDivorceRegistrationDraft(
    { source: "APPLICANT", jurisdiction: "Demo District", applicant: applicant(), processingOfficeId: "OFF-TEST", processingOfficeName: "Test Office" },
    OFFICER_ID,
    OFFICER_NAME
  );
}

function readyToSubmitPatch() {
  return {
    existingMarriage: matchedMarriage,
    formerSpouse1: spouse("SPOUSE1"),
    formerSpouse2: spouse("SPOUSE2"),
    judgment: judgment(),
    accuracyDeclarationConfirmed: true,
    authorityToSubmitConfirmed: true,
    judgmentFinalConfirmed: true,
    privacyAcknowledged: true,
    electronicSubmissionConfirmed: true,
  };
}

function seedMarriage() {
  updateDemoData((db) => {
    db.crvsMarriageApplications.push({
      id: "MR-TEST-1",
      reference: "CRVS-MARRIAGE-TEST-0001",
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

describe("Divorce registration flow", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
    seedMarriage();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("drives a draft through submit -> review -> approve -> register, and annotates (never deletes) the original marriage record", () => {
    const draft = createDraft();
    expect(draft.status).toBe("DRAFT");

    const patched = demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    expect(patched.version).toBe(draft.version + 1);

    const submitted = demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeTruthy();

    const underReview = demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(underReview.status).toBe("UNDER_REVIEW");
    expect(underReview.reviewerId).toBe(REGISTRAR_ID);

    const approved = demoApproveDivorceRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true, true, "Looks correct.");
    expect(approved.status).toBe("APPROVED");
    expect(approved.sdid.status).toBe("NOT_READY"); // SDID not touched yet — only after the separate register action

    const registered = demoRegisterDivorce(draft.id, "2026-02-15", REGISTRAR_ID, REGISTRAR_NAME);
    expect(registered.status).toBe("REGISTERED");
    expect(registered.registrationEvent?.registrationNumber).toMatch(/^CRVS-DIVORCE-DEMO-/);
    expect(registered.sdid.status).toBe("PENDING"); // enqueued for sync
    expect(registered.marriageStatusUpdate?.applied).toBe(true);

    const marriage = getDemoData().crvsMarriageApplications.find((m) => m.id === "MR-TEST-1")!;
    expect(marriage.status).toBe("REGISTERED"); // original registration status is immutable, never overwritten
    expect(marriage.dissolution?.divorceRegistrationReference).toBe(registered.reference);
    expect(marriage.applicant1.firstName).toBe("Amara"); // original data preserved verbatim
  });

  it("blocks approval when the maker-checker confirmation checkboxes are not both set", () => {
    const draft = createDraft();
    demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    expect(() => demoApproveDivorceRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, false, true)).toThrow(/must confirm/i);
    expect(() => demoApproveDivorceRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true, false)).toThrow(/must confirm/i);
  });

  it("blocks approval by the same officer who prepared the case (maker-checker)", () => {
    const draft = createDraft();
    demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    demoStartDivorceReview(draft.id, OFFICER_ID, OFFICER_NAME);

    expect(() => demoApproveDivorceRegistration(draft.id, OFFICER_ID, OFFICER_NAME, true, true)).toThrow(/prepared this divorce registration/i);
  });

  it("runs the correction -> resubmit cycle and preserves the original correction history", () => {
    const draft = createDraft();
    demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const corrected = demoRequestDivorceCorrection(
      draft.id,
      {
        requestedBy: REGISTRAR_NAME,
        items: [{ id: "x", section: "COURT_DECISION", fields: ["judgment.courtRegistryReference"], reason: "Missing registry reference.", documentsRequired: false, addressed: false }],
        notifyApplicants: true,
      },
      REGISTRAR_NAME
    );
    expect(corrected.status).toBe("CORRECTION_REQUIRED");
    expect(corrected.correctionRequests).toHaveLength(1);

    const resubmitted = demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.correctionRequests[0].resolvedAt).toBeTruthy();
    expect(resubmitted.correctionRequests[0].items[0].reason).toBe("Missing registry reference."); // original text never overwritten
    expect(resubmitted.correctionRequests[0].items[0].addressed).toBe(true);
  });

  it("rejects a registration with a recorded reason", () => {
    const draft = createDraft();
    demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const rejected = demoRejectDivorceRegistration(draft.id, { reason: "Applicant authority unclear", explanation: "No authorization document provided.", evidenceRefs: [], applicantsNotified: true }, REGISTRAR_ID, REGISTRAR_NAME);
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason?.reason).toBe("Applicant authority unclear");
  });

  it("routes to and resolves exception review without skipping the review stage", () => {
    const draft = createDraft();
    demoUpdateDivorceRegistrationDraft(draft.id, readyToSubmitPatch(), OFFICER_NAME, draft.version);
    demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
    demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const exceptioned = demoRouteDivorceToException(draft.id, { type: "JUDGMENT_NOT_FINAL", reason: "Finality date missing on submission." }, REGISTRAR_NAME);
    expect(exceptioned.status).toBe("EXCEPTION_REVIEW");
    expect(exceptioned.exception?.status).toBe("OPEN");

    const resolved = demoResolveDivorceException(draft.id, { type: "CLEARED", reason: "Court confirmed finality by phone follow-up.", nextStatus: "UNDER_REVIEW" }, "Test CRVS Supervisor");
    expect(resolved.status).toBe("UNDER_REVIEW");
    expect(resolved.exception?.status).toBe("RESOLVED");
  });

  it("enforces optimistic concurrency on draft edits", () => {
    const draft = createDraft();
    expect(() => demoUpdateDivorceRegistrationDraft(draft.id, { accuracyDeclarationConfirmed: true }, OFFICER_NAME, draft.version + 5)).toThrow(ConcurrencyError);
  });

  it("throws NotFoundError for an unknown registration id", () => {
    expect(() => demoStartDivorceReview("NOT-A-REAL-ID", REGISTRAR_ID, REGISTRAR_NAME)).toThrow(NotFoundError);
  });
});
