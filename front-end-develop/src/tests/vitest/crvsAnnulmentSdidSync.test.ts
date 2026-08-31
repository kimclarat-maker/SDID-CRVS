import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData, resetDemoData, updateDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateAnnulmentRegistrationDraft,
  demoUpdateAnnulmentRegistrationDraft,
  demoSubmitAnnulmentRegistration,
  demoStartAnnulmentReview,
  demoApproveAnnulmentRegistration,
  demoRegisterAnnulment,
} from "@/demo/services/crvsAnnulmentRegistrations";
import { demoConfirmAnnulmentLegalEffectClassification } from "@/demo/services/crvsAnnulmentLegalEffect";
import { demoProcessAnnulmentSdidSync, demoRetryAnnulmentSdidSync, demoAssignAnnulmentManualReview } from "@/demo/services/crvsAnnulmentSdidSync";
import { annulmentSyncIdempotencyKey } from "@/domain/crvs/idempotency";
import { AffectedParty, AnnulmentApplicant, AnnulmentDecision, AnnulmentExistingMarriageMatch, AnnulmentLegalEffectClassification, FoundationalIdentity } from "@/domain/crvs/types";

const OFFICER_ID = "annulment.officer@demo.identity.local";
const OFFICER_NAME = "Test Annulment Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

function applicant(): AnnulmentApplicant {
  return { documentType: "NATIONAL_ID", documentNumber: "DEMO-ID-9201", firstName: "Amara", lastName: "Bello", relationshipToMarriage: "PARTY_1", relationshipToCase: "AFFECTED_PARTY_1", identityVerification: "VERIFIED" };
}

function party(partyKey: "PARTY_1" | "PARTY_2", nin?: string): AffectedParty {
  return {
    partyKey,
    firstName: partyKey === "PARTY_1" ? "Amara" : "Kwame",
    lastName: partyKey === "PARTY_1" ? "Bello" : "Toure",
    sex: partyKey === "PARTY_1" ? "FEMALE" : "MALE",
    nin,
    identityMatchConfidence: "CONFIRMED",
    identityVerification: "VERIFIED",
    linkedToSelectedMarriage: true,
  };
}

function decision(): AnnulmentDecision {
  return {
    country: "Rwanda",
    courtOrAuthorityName: "Demo Court",
    jurisdiction: "Demo District",
    courtCaseNumber: "CASE-ANN-SYNC-1",
    decisionNumber: "ANN-JGT-SYNC-1",
    decisionDate: "2026-01-01",
    finalityDate: "2026-02-01",
    effectiveDate: "2026-02-01",
    decisionType: "COURT_ORDER",
    describesMarriageAs: "VOIDABLE",
    legalEffectWording: "The marriage between the parties is hereby annulled and declared void.",
    isForeign: false,
  };
}

const matchedMarriage: AnnulmentExistingMarriageMatch = {
  status: "MATCHED",
  candidates: [],
  notFoundEvidence: [],
  selected: { marriageApplicationId: "MR-ANN-SYNC-1", registrationNumber: "CRVS-MARRIAGE-ANN-SYNC-0001", marriageDate: "2010-01-01", party1Name: "Amara Bello", party2Name: "Kwame Toure", currentCivilStatus: "ACTIVE", matchConfidence: "HIGH" },
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
    b.relationships = [{ id: relId, type: "SPOUSE", identityAId: idA, identityBId: idB, marriageRegistrationReference: "CRVS-MARRIAGE-ANN-SYNC-0001", createdAt: "2010-01-01T00:00:00.000Z", status: "ACTIVE" }];
    db.crvsFoundationalIdentities.push(a, b);
    return db;
  });
}

/** Drives a fresh annulment registration all the way to REGISTERED via the
 * real service functions, including confirming the given legal-effect
 * classification, so SDID sync tests exercise a genuinely registered case
 * with a genuinely confirmed classification. */
function registerAFreshAnnulment(classification: AnnulmentLegalEffectClassification, nin1?: string, nin2?: string) {
  const draft = demoCreateAnnulmentRegistrationDraft(
    { source: "APPLICANT", jurisdiction: "Demo District", applicant: applicant(), processingOfficeId: "OFF-TEST", processingOfficeName: "Test Office" },
    OFFICER_ID,
    OFFICER_NAME
  );
  demoUpdateAnnulmentRegistrationDraft(
    draft.id,
    {
      existingMarriage: matchedMarriage,
      affectedParty1: party("PARTY_1", nin1),
      affectedParty2: party("PARTY_2", nin2),
      decision: decision(),
      accuracyDeclarationConfirmed: true,
      authorityToSubmitConfirmed: true,
      authoritativeDecisionExistsConfirmed: true,
      decisionCompleteConfirmed: true,
      privacyAcknowledged: true,
      electronicSubmissionConfirmed: true,
    },
    OFFICER_NAME,
    draft.version
  );
  demoSubmitAnnulmentRegistration(draft.id, OFFICER_NAME);
  demoStartAnnulmentReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
  demoConfirmAnnulmentLegalEffectClassification(draft.id, classification, REGISTRAR_NAME, "Test rationale for classification.");
  demoApproveAnnulmentRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, "Looks correct.", true, true);
  return demoRegisterAnnulment(draft.id, "2026-02-15", REGISTRAR_ID, REGISTRAR_NAME);
}

describe("Annulment SDID synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("updates both affected parties' identities to SINGLE, reclassifies the existing relationship, and never touches any other identity field when both succeed", async () => {
    seedIdentityPairWithActiveRelationship("FID-ANN-SYNC-A", "TEST-NIN-ANN-A", "FID-ANN-SYNC-B", "TEST-NIN-ANN-B", "AREL-SYNC-1");
    const beforeA = { ...getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-A")! };
    const beforeB = { ...getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-B")! };

    const registered = registerAFreshAnnulment("ANNULLED_FROM_DECISION_DATE", "TEST-NIN-ANN-A", "TEST-NIN-ANN-B");
    expect(registered.status).toBe("REGISTERED");
    expect(registered.sdid.status).toBe("PENDING");

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below the success threshold -> forces success both times
    const outcome = await demoProcessAnnulmentSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome.sdid.status).toBe("BOTH_IDENTITIES_UPDATED");
    expect(outcome.sdid.party1.status).toBe("IDENTITY_UPDATED");
    expect(outcome.sdid.party2.status).toBe("IDENTITY_UPDATED");
    expect(outcome.sdid.relationshipUpdated).toBe(true);
    expect(outcome.status).toBe("REGISTERED");

    const identityA = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-A")!;
    const identityB = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-B")!;
    expect(identityA.maritalStatus).toBe("SINGLE");
    expect(identityB.maritalStatus).toBe("SINGLE");
    // Never merged or deleted: both identities keep their own ids.
    expect(identityA.id).toBe("FID-ANN-SYNC-A");
    expect(identityB.id).toBe("FID-ANN-SYNC-B");

    // Spec §24 — only the marital-status fields may change; everything else
    // on the identity must be byte-identical before and after.
    expect(identityA.childFirstName).toBe(beforeA.childFirstName);
    expect(identityA.childLastName).toBe(beforeA.childLastName);
    expect(identityA.fictionalNin).toBe(beforeA.fictionalNin);
    expect(identityA.dateOfBirth).toBe(beforeA.dateOfBirth);
    expect(identityA.placeOfBirth).toBe(beforeA.placeOfBirth);
    expect(identityB.childFirstName).toBe(beforeB.childFirstName);
    expect(identityB.childLastName).toBe(beforeB.childLastName);
    expect(identityB.fictionalNin).toBe(beforeB.fictionalNin);
    expect(identityB.dateOfBirth).toBe(beforeB.dateOfBirth);
    expect(identityB.placeOfBirth).toBe(beforeB.placeOfBirth);

    // The relationship record involving the other party is never deleted
    // from the array — only its status flips.
    expect(identityB.relationships).toHaveLength(1);
    expect(identityB.relationships?.[0].id).toBe("AREL-SYNC-1");
    expect(identityB.relationships?.[0].status).toBe("DISSOLVED");
  });

  it("never auto-updates an affected party's identity to SINGLE when the confirmed legal-effect classification itself requires manual review (EFFECT_REQUIRES_MANUAL_REVIEW)", async () => {
    seedIdentityPairWithActiveRelationship("FID-ANN-SYNC-C", "TEST-NIN-ANN-C", "FID-ANN-SYNC-D", "TEST-NIN-ANN-D", "AREL-SYNC-2");
    const registered = registerAFreshAnnulment("EFFECT_REQUIRES_MANUAL_REVIEW", "TEST-NIN-ANN-C", "TEST-NIN-ANN-D");
    expect(registered.legalEffect.confirmedClassification).toBe("EFFECT_REQUIRES_MANUAL_REVIEW");

    vi.spyOn(Math, "random").mockReturnValue(0.1); // would force success if the sync ever consulted chance
    const outcome = await demoProcessAnnulmentSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome.sdid.status).toBe("MANUAL_REVIEW");
    expect(outcome.sdid.party1.status).toBe("MANUAL_REVIEW");
    expect(outcome.sdid.party2.status).toBe("MANUAL_REVIEW");
    expect(outcome.status).toBe("REGISTERED"); // the annulment remains legally registered

    const identityC = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-C")!;
    const identityD = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-ANN-D")!;
    expect(identityC.maritalStatus).toBe("MARRIED"); // never assumed to be SINGLE
    expect(identityD.maritalStatus).toBe("MARRIED");
  });

  it("AN-17 (seed): both affected parties succeeded -> case-level BOTH_IDENTITIES_UPDATED", () => {
    const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-17")!;
    expect(reg.status).toBe("REGISTERED");
    expect(reg.sdid.status).toBe("BOTH_IDENTITIES_UPDATED");
    expect(reg.sdid.party1.status).toBe("IDENTITY_UPDATED");
    expect(reg.sdid.party2.status).toBe("IDENTITY_UPDATED");
  });

  it("AN-18 (seed): one affected party succeeded and the other failed -> PARTIAL_FAILURE, registration stays REGISTERED (never reversed by a sync failure)", () => {
    const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-18")!;
    expect(reg.status).toBe("REGISTERED");
    expect(reg.sdid.status).toBe("PARTIAL_FAILURE");
    expect(reg.sdid.party1.status).toBe("IDENTITY_UPDATED");
    expect(reg.sdid.party2.status).toBe("FAILED");
  });

  it("AN-19 (seed): both affected parties failed -> FAILED, registration stays REGISTERED", () => {
    const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-19")!;
    expect(reg.status).toBe("REGISTERED");
    expect(reg.sdid.status).toBe("FAILED");
    expect(reg.sdid.party1.status).toBe("FAILED");
    expect(reg.sdid.party2.status).toBe("FAILED");
  });

  it("AN-20 (seed): identity linkage uncertain for both affected parties -> MANUAL_REVIEW, registration stays REGISTERED", () => {
    const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-20")!;
    expect(reg.status).toBe("REGISTERED");
    expect(reg.sdid.status).toBe("MANUAL_REVIEW");
    expect(reg.sdid.party1.status).toBe("MANUAL_REVIEW");
    expect(reg.sdid.party2.status).toBe("MANUAL_REVIEW");
  });

  it("retries only the targeted affected party (AN-18's failed party2), leaving the other party's already-succeeded sub-record and attempts array completely untouched", async () => {
    const before = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-18")!;
    expect(before.sdid.party1.status).toBe("IDENTITY_UPDATED");
    expect(before.sdid.party2.status).toBe("FAILED");
    const party1Snapshot = JSON.parse(JSON.stringify(before.sdid.party1));

    vi.spyOn(Math, "random").mockReturnValue(0.1); // forces party2's retry to succeed
    const outcome = await demoRetryAnnulmentSdidSync("AN-18", "PARTY_2", REGISTRAR_NAME);

    expect(outcome.sdid.party2.status).toBe("IDENTITY_UPDATED");
    expect(outcome.sdid.status).toBe("BOTH_IDENTITIES_UPDATED");
    expect(outcome.status).toBe("REGISTERED");
    expect(outcome.sdid.party1).toEqual(party1Snapshot); // untouched by the targeted retry

    const identity2 = getDemoData().crvsFoundationalIdentities.find((f) => f.id === "FID-ANNULMENT-0004")!;
    expect(identity2.maritalStatus).toBe("SINGLE");
  });

  it("demoAssignAnnulmentManualReview routes both non-terminal affected parties to MANUAL_REVIEW (AN-19's two FAILED parties) without reversing the registration's REGISTERED status", async () => {
    const before = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === "AN-19")!;
    expect(before.sdid.party1.status).toBe("FAILED");
    expect(before.sdid.party2.status).toBe("FAILED");

    const updated = await demoAssignAnnulmentManualReview("AN-19", "Suspicious duplicate flag under investigation.", "crvs.supervisor@demo.identity.local", "HIGH", REGISTRAR_NAME);

    expect(updated.sdid.party1.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.party2.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.status).toBe("MANUAL_REVIEW");
    expect(updated.status).toBe("REGISTERED"); // never reversed by a manual-review assignment
  });

  it("annulmentSyncIdempotencyKey produces different, stable keys for PARTY_1 vs PARTY_2 on the same case", () => {
    const key1 = annulmentSyncIdempotencyKey("AN-99", "PARTY_1");
    const key2 = annulmentSyncIdempotencyKey("AN-99", "PARTY_2");
    expect(key1).not.toBe(key2);
    expect(key1).toBe(annulmentSyncIdempotencyKey("AN-99", "PARTY_1")); // stable across repeated calls
    expect(key2).toBe(annulmentSyncIdempotencyKey("AN-99", "PARTY_2"));
  });
});
