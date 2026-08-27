import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData, resetDemoData, updateDemoData } from "@/demo/storage/demoStore";
import { demoCreateMarriageApplicationDraft, demoUpdateMarriageApplicationDraft, demoSubmitMarriageApplication, demoStartMarriageEligibilityReview, demoApproveMarriageApplication, demoRegisterMarriage } from "@/demo/services/crvsMarriageApplications";
import { demoScheduleMarriageAppointment } from "@/demo/services/crvsMarriageAppointments";
import { demoStartMarriageCheckIn, demoCheckInMarriageApplicant, demoCheckInMarriageWitness, demoConfirmMarriageCeremonyDocuments, demoRecordMarriageCeremonyRechecks, demoRecordMarriageConsent, demoRecordMarriageCeremonyOutcome } from "@/demo/services/crvsMarriageCeremony";
import { demoProcessMarriageSdidSync, demoRetryMarriageSdidSync, demoAssignMarriageManualReview } from "@/demo/services/crvsMarriageSdidSync";
import { MarriageApplicant, FoundationalIdentity } from "@/domain/crvs/types";

const OFFICER_ID = "marriage.officer@demo.identity.local";
const OFFICER_NAME = "Test Marriage Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const OFFICIANT_NAME = "Test Marriage Officiant";

function applicant(spouseRole: "APPLICANT1" | "APPLICANT2", nin?: string): MarriageApplicant {
  return {
    spouseRole,
    nationalityCategory: "CITIZEN",
    documentType: "NATIONAL_ID",
    firstName: spouseRole === "APPLICANT1" ? "Test1" : "Test2",
    lastName: "Applicant",
    sex: spouseRole === "APPLICANT1" ? "FEMALE" : "MALE",
    civilStatus: "SINGLE",
    verification: "VERIFIED",
    nin,
    partnerConfirmationStatus: spouseRole === "APPLICANT2" ? "CONFIRMED" : "NOT_REQUIRED",
  };
}

function seedIdentity(id: string, nin: string): FoundationalIdentity {
  return {
    id,
    fictionalNin: nin,
    childFirstName: "Test",
    childLastName: "Person",
    sex: "FEMALE",
    dateOfBirth: "1995-01-01T00:00:00.000Z",
    placeOfBirth: "Demo Hospital",
    birthRecordReference: `CRVS-BIRTH-TEST-${id}`,
    identityStatus: "ACTIVE",
    biometrics: "NOT_REQUIRED_FOR_NEWBORN",
    credential: "NOT_ISSUED",
    source: "CRVS_BIRTH_RECORD",
    createdAt: "2020-01-01T00:00:00.000Z",
    idempotencyKey: `SEED-${id}`,
  };
}

/** Drives a fresh marriage application all the way to REGISTERED via the
 * real service functions (not direct state manipulation), so the SDID sync
 * tests exercise a genuinely registered case. */
function registerAFreshMarriage(nin1?: string, nin2?: string) {
  const draft = demoCreateMarriageApplicationDraft(
    {
      officeId: "OFF-TEST",
      officeName: "Test Office",
      officeType: "DISTRICT_SECTOR_OFFICE",
      jurisdiction: "Demo District",
      applicant1: applicant("APPLICANT1", nin1),
      applicant2: applicant("APPLICANT2", nin2),
      proposedMarriageDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      ceremonyType: "CIVIL",
      isSpecialDayRequest: false,
    },
    OFFICER_ID,
    OFFICER_NAME
  );

  demoUpdateMarriageApplicationDraft(
    draft.id,
    {
      witnesses: [
        { id: "w1", spouseRole: "APPLICANT1", relationship: "Friend", documentType: "NONE", firstName: "W", lastName: "One", dateOfBirth: "1990-01-01T00:00:00.000Z", verification: "VERIFIED" },
        { id: "w2", spouseRole: "APPLICANT2", relationship: "Friend", documentType: "NONE", firstName: "W", lastName: "Two", dateOfBirth: "1990-01-01T00:00:00.000Z", verification: "VERIFIED" },
      ],
    },
    OFFICER_NAME,
    draft.version
  );

  demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
  demoStartMarriageEligibilityReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
  demoApproveMarriageApplication(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true);

  const appointment = demoScheduleMarriageAppointment(
    { applicationId: draft.id, officeId: "OFF-TEST", officeName: "Test Office", date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), timeSlot: "09:00-09:30", officiantId: "marriage.officiant@demo.identity.local", officiantName: OFFICIANT_NAME },
    OFFICER_ID,
    OFFICER_NAME
  );

  let ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
  ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT1", OFFICIANT_NAME);
  ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT2", OFFICIANT_NAME);
  ceremony = demoCheckInMarriageWitness(ceremony.id, "w1", OFFICIANT_NAME);
  ceremony = demoCheckInMarriageWitness(ceremony.id, "w2", OFFICIANT_NAME);
  ceremony = demoConfirmMarriageCeremonyDocuments(ceremony.id, OFFICIANT_NAME);
  ceremony = demoRecordMarriageCeremonyRechecks(ceremony.id, { eligibilityRecheckPassed: true, existingMarriageRecheckPassed: true }, OFFICIANT_NAME);
  ceremony = demoRecordMarriageConsent(ceremony.id, { applicant1Consented: true, applicant2Consented: true }, OFFICIANT_NAME);
  ceremony = demoRecordMarriageCeremonyOutcome(ceremony.id, "COMPLETED", {}, OFFICIANT_NAME);

  return demoRegisterMarriage(draft.id, ceremony.id, appointment.id, REGISTRAR_ID, REGISTRAR_NAME);
}

describe("Marriage SDID synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("updates both spouses' identities to MARRIED and links them via a relationship when both succeed", async () => {
    updateDemoData((db) => {
      db.crvsFoundationalIdentities.push(seedIdentity("FID-TEST-A", "TEST-NIN-A"), seedIdentity("FID-TEST-B", "TEST-NIN-B"));
      return db;
    });
    const registered = registerAFreshMarriage("TEST-NIN-A", "TEST-NIN-B");
    expect(registered.status).toBe("REGISTERED");
    expect(registered.sdid.status).toBe("PENDING");

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below the 0.8 success threshold -> forces success both times
    const outcome = await demoProcessMarriageSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("BOTH_IDENTITIES_UPDATED");

    const updated = getDemoData().crvsMarriageApplications.find((a) => a.id === registered.id)!;
    expect(updated.sdid.status).toBe("BOTH_IDENTITIES_UPDATED");
    expect(updated.sdid.applicant1.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.applicant2.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.relationshipId).toBeTruthy();

    const identityA = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-A")!;
    const identityB = getDemoData().crvsFoundationalIdentities.find((f) => f.fictionalNin === "TEST-NIN-B")!;
    expect(identityA.maritalStatus).toBe("MARRIED");
    expect(identityB.maritalStatus).toBe("MARRIED");
    // Never merged: both identities keep their own ids and names.
    expect(identityA.id).toBe("FID-TEST-A");
    expect(identityB.id).toBe("FID-TEST-B");
    expect(identityA.relationships?.[0].identityBId).toBe("FID-TEST-B");
    expect(identityB.relationships?.[0].identityAId).toBe("FID-TEST-A");
  });

  it("produces PARTIAL_FAILURE when exactly one spouse's identity update fails, keeps the marriage registered, and never re-runs the succeeded spouse on retry", async () => {
    updateDemoData((db) => {
      db.crvsFoundationalIdentities.push(seedIdentity("FID-TEST-C", "TEST-NIN-C"), seedIdentity("FID-TEST-D", "TEST-NIN-D"));
      return db;
    });
    const registered = registerAFreshMarriage("TEST-NIN-C", "TEST-NIN-D");

    // Math.random is drawn once per spouse in sequence — first draw (applicant1) succeeds, second (applicant2) fails.
    const randomSpy = vi.spyOn(Math, "random");
    randomSpy.mockReturnValueOnce(0.1).mockReturnValue(0.99);
    const outcome = await demoProcessMarriageSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("PARTIAL_FAILURE");

    let updated = getDemoData().crvsMarriageApplications.find((a) => a.id === registered.id)!;
    expect(updated.status).toBe("REGISTERED"); // partial failure never un-registers the marriage
    expect(updated.sdid.status).toBe("PARTIAL_FAILURE");
    expect(updated.sdid.applicant1.status).toBe("IDENTITY_UPDATED");
    expect(updated.sdid.applicant2.status).toBe("FAILED");

    const applicant1AttemptsBefore = updated.sdid.applicant1.attempts.length;

    randomSpy.mockReset();
    randomSpy.mockReturnValue(0.1); // retry succeeds
    const retryOutcome = await demoRetryMarriageSdidSync(registered.id, "applicant2", REGISTRAR_NAME);
    expect(retryOutcome).toBe("BOTH_IDENTITIES_UPDATED");

    updated = getDemoData().crvsMarriageApplications.find((a) => a.id === registered.id)!;
    expect(updated.sdid.applicant2.status).toBe("IDENTITY_UPDATED");
    // The already-succeeded spouse was never touched again by the retry.
    expect(updated.sdid.applicant1.attempts.length).toBe(applicant1AttemptsBefore);
  });

  it("routes to MANUAL_REVIEW for both spouses without fabricating an identity when no reliable match exists", async () => {
    const registered = registerAFreshMarriage(undefined, undefined); // no NIN, no matching identity anywhere
    const identityCountBefore = getDemoData().crvsFoundationalIdentities.length;

    const outcome = await demoProcessMarriageSdidSync(registered.id, REGISTRAR_NAME);
    expect(outcome).toBe("MANUAL_REVIEW");

    const updated = getDemoData().crvsMarriageApplications.find((a) => a.id === registered.id)!;
    expect(updated.status).toBe("REGISTERED"); // the marriage remains legally registered
    expect(updated.sdid.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.applicant1.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.applicant2.status).toBe("MANUAL_REVIEW");
    expect(updated.sdid.relationshipId).toBeUndefined(); // no unsafe automatic link created
    expect(getDemoData().crvsFoundationalIdentities.length).toBe(identityCountBefore);
  });

  it("can be explicitly placed into manual review by a supervisor, scoped to one spouse", async () => {
    updateDemoData((db) => {
      db.crvsFoundationalIdentities.push(seedIdentity("FID-TEST-E", "TEST-NIN-E"), seedIdentity("FID-TEST-F", "TEST-NIN-F"));
      return db;
    });
    const registered = registerAFreshMarriage("TEST-NIN-E", "TEST-NIN-F");

    const updated = demoAssignMarriageManualReview(registered.id, { reason: "Suspicious duplicate flag.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "HIGH" }, "Test CRVS Supervisor", "applicant1");
    expect(updated.sdid.applicant1.status).toBe("MANUAL_REVIEW");
    expect(updated.status).toBe("REGISTERED");
  });
});
