import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData, resetDemoData, updateDemoData } from "@/demo/storage/demoStore";
import { demoCreateDivorceRegistrationDraft, demoUpdateDivorceRegistrationDraft, demoSubmitDivorceRegistration, demoStartDivorceReview, demoApproveDivorceRegistration, demoRegisterDivorce } from "@/demo/services/crvsDivorceRegistrations";
import { demoProcessDivorceSdidSync, demoRetryDivorceSdidSync, demoAssignDivorceManualReview } from "@/demo/services/crvsDivorceSdidSync";
import { DivorceApplicant, DivorceJudgment, ExistingMarriageMatch, FormerSpouse, FoundationalIdentity } from "@/domain/crvs/types";

const OFFICER_ID = "divorce.officer@demo.identity.local";
const OFFICER_NAME = "Test Divorce Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

function applicant(): DivorceApplicant {
  return { documentType: "NATIONAL_ID", documentNumber: "DEMO-ID-9001", firstName: "Amara", lastName: "Bello", relationshipToCase: "FORMER_SPOUSE_1", identityVerification: "VERIFIED" };
}

function spouse(spouseKey: "SPOUSE1" | "SPOUSE2", nin?: string): FormerSpouse {
  return {
    spouseKey,
    firstName: spouseKey === "SPOUSE1" ? "Amara" : "Kwame",
    lastName: spouseKey === "SPOUSE1" ? "Bello" : "Toure",
    sex: spouseKey === "SPOUSE1" ? "FEMALE" : "MALE",
    nin,
    identityMatchConfidence: "CONFIRMED",
    identityVerification: "VERIFIED",
    linkedToSelectedMarriage: true,
  };
}

function judgment(): DivorceJudgment {
  return { country: "Rwanda", courtOrAuthorityName: "Demo Court", courtCaseNumber: "CASE-SYNC-1", judgmentNumber: "JGT-SYNC-1", judgmentDate: "2026-01-01", finalityDate: "2026-02-01", decisionType: "MUTUAL_CONSENT", isForeign: false };
}

const matchedMarriage: ExistingMarriageMatch = {
  status: "MATCHED",
  candidates: [],
  notFoundEvidence: [],
  selected: { marriageApplicationId: "MR-SYNC-1", registrationNumber: "CRVS-MARRIAGE-SYNC-0001", marriageDate: "2010-01-01", spouse1Name: "Amara Bello", spouse2Name: "Kwame Toure", matchConfidence: "HIGH" },
};

function seedIdentity(id: string, nin: string): FoundationalIdentity {
  return {
    id,
    fictionalNin: nin,
    childFirstName: "Test",
    childLastName: "Person",
    sex: "FEMALE",
    dateOfBirth: "1990-01-01T00:00:00.000Z",
    placeOfBirth: "Demo Hospital",
    birthRecordReference: `CRVS-BIRTH-TEST-${id}`,
    identityStatus: "ACTIVE",
    biometrics: "NOT_REQUIRED_FOR_NEWBORN",
    credential: "NOT_ISSUED",
    source: "CRVS_BIRTH_RECORD",
    createdAt: "2020-01-01T00:00:00.000Z",
    idempotencyKey: `SEED-${id}`,
    maritalStatus: "MARRIED",
  };
}

function seedIdentityPairWithActiveRelationship(idA: string, ninA: string, idB: string, ninB: string, relId: string) {
  updateDemoData((db) => {
    const a = seedIdentity(idA, ninA);
    const b = seedIdentity(idB, ninB);
    b.relationships = [{ id: relId, type: "SPOUSE", identityAId: idA, identityBId: idB, marriageRegistrationReference: "CRVS-MARRIAGE-SYNC-0001", createdAt: "2010-01-01T00:00:00.000Z", status: "ACTIVE" }];
    db.crvsFoundationalIdentities.push(a, b);
    return db;
  });
}

/** Drives a fresh divorce registration all the way to REGISTERED via the
 * real service functions, so SDID sync tests exercise a genuinely
 * registered case. */
function registerAFreshDivorce(nin1?: string, nin2?: string) {
  const draft = demoCreateDivorceRegistrationDraft(
    { source: "APPLICANT", jurisdiction: "Demo District", applicant: applicant(), processingOfficeId: "OFF-TEST", processingOfficeName: "Test Office" },
    OFFICER_ID,
    OFFICER_NAME
  );
  demoUpdateDivorceRegistrationDraft(
    draft.id,
    {
      existingMarriage: matchedMarriage,
      formerSpouse1: spouse("SPOUSE1", nin1),
      formerSpouse2: spouse("SPOUSE2", nin2),
      judgment: judgment(),
      accuracyDeclarationConfirmed: true,
      authorityToSubmitConfirmed: true,
      judgmentFinalConfirmed: true,
      privacyAcknowledged: true,
      electronicSubmissionConfirmed: true,
    },
    OFFICER_NAME,
    draft.version
  );
  demoSubmitDivorceRegistration(draft.id, OFFICER_NAME);
  demoStartDivorceReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
  demoApproveDivorceRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true, true);
  return demoRegisterDivorce(draft.id, "2026-02-15", REGISTRAR_ID, REGISTRAR_NAME);
}

describe("Divorce SDID synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("updates both former spouses' identities to DIVORCED and dissolves the existing relationship when both succeed", async () => {
    seedIdentityPairWithActiveRelationship("FID-SYNC-A", "TEST-NIN-SYNC-A", "FID-SYNC-B", "TEST-NIN-SYNC-B", "REL-SYNC-1");
    const registered = registerAFreshDivorce("TEST-NIN-SYNC-A", "TEST-NIN-SYNC-B");
    expect(registered.status).toBe("REGISTERED");
    expect(registered.sdid.status).toBe("PENDING");

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below the success threshold -> forces success both times
    const outcome = await demoProcessDivorceSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("BOTH_IDENTITIES_UPDATED");

    const updated = getDemoData().crvsDivorceRegistrations.find((r) => r.id === registered.id)!;
    expect(updated.sdid.status).toBe("BOTH_IDENTITIES_UPDATED");
    expect(updated.sdid.spouse1.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.spouse2.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.relationshipDissolved).toBe(true);

    const identityA = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-SYNC-A")!;
    const identityB = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-SYNC-B")!;
    expect(identityA.maritalStatus).toBe("DIVORCED");
    expect(identityB.maritalStatus).toBe("DIVORCED");
    // Never merged or deleted: both identities keep their own ids and names.
    expect(identityA.id).toBe("FID-SYNC-A");
    expect(identityB.id).toBe("FID-SYNC-B");
    expect(identityB.relationships?.[0].id).toBe("REL-SYNC-1"); // same relationship record, not a new one
    expect(identityB.relationships?.[0].status).toBe("DISSOLVED"); // flipped, never deleted
  });

  it("produces PARTIAL_FAILURE when exactly one former spouse's update fails, keeps the divorce registered, dissolves the relationship anyway, and never re-runs the succeeded spouse on retry", async () => {
    seedIdentityPairWithActiveRelationship("FID-SYNC-C", "TEST-NIN-SYNC-C", "FID-SYNC-D", "TEST-NIN-SYNC-D", "REL-SYNC-2");
    const registered = registerAFreshDivorce("TEST-NIN-SYNC-C", "TEST-NIN-SYNC-D");

    const randomSpy = vi.spyOn(Math, "random");
    randomSpy.mockReturnValueOnce(0.1).mockReturnValue(0.99);
    const outcome = await demoProcessDivorceSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("PARTIAL_FAILURE");

    let updated = getDemoData().crvsDivorceRegistrations.find((r) => r.id === registered.id)!;
    expect(updated.status).toBe("REGISTERED"); // partial failure never un-registers the divorce
    expect(updated.sdid.status).toBe("PARTIAL_FAILURE");
    expect(updated.sdid.spouse1.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.spouse2.status).toBe("FAILED");
    expect(updated.sdid.relationshipDissolved).toBe(true); // dissolution is independent of the per-spouse field update

    const spouse1AttemptsBefore = updated.sdid.spouse1.attempts.length;

    randomSpy.mockReset();
    randomSpy.mockReturnValue(0.1);
    const retryOutcome = await demoRetryDivorceSdidSync(registered.id, "spouse2", REGISTRAR_NAME);
    expect(retryOutcome).toBe("BOTH_IDENTITIES_UPDATED");

    updated = getDemoData().crvsDivorceRegistrations.find((r) => r.id === registered.id)!;
    expect(updated.sdid.spouse2.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.spouse1.attempts.length).toBe(spouse1AttemptsBefore); // untouched by the targeted retry
  });

  it("routes to MANUAL_REVIEW for both former spouses without fabricating an identity or dissolving any relationship when no reliable match exists", async () => {
    const registered = registerAFreshDivorce(undefined, undefined); // no NIN, no matching identity anywhere
    const identityCountBefore = getDemoData().crvsFoundationalIdentities.length;

    const outcome = await demoProcessDivorceSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("MANUAL_REVIEW");

    const updated = getDemoData().crvsDivorceRegistrations.find((r) => r.id === registered.id)!;
    expect(updated.status).toBe("REGISTERED"); // the divorce remains legally registered
    expect(updated.sdid.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.spouse1.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.spouse2.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.relationshipDissolved).toBeFalsy();
    expect(getDemoData().crvsFoundationalIdentities.length).toBe(identityCountBefore);
  });

  it("can be explicitly placed into manual review by a supervisor, scoped to one former spouse", async () => {
    seedIdentityPairWithActiveRelationship("FID-SYNC-E", "TEST-NIN-SYNC-E", "FID-SYNC-F", "TEST-NIN-SYNC-F", "REL-SYNC-3");
    const registered = registerAFreshDivorce("TEST-NIN-SYNC-E", "TEST-NIN-SYNC-F");

    const updated = demoAssignDivorceManualReview(registered.id, { reason: "Suspicious duplicate flag.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "HIGH" }, "Test CRVS Supervisor", "spouse1");
    expect(updated.sdid.spouse1.status).toBe("MANUAL_REVIEW");
    expect(updated.status).toBe("REGISTERED");
  });
});
