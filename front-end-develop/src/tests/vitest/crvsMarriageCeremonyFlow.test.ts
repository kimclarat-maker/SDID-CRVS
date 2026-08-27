import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDemoData } from "@/demo/storage/demoStore";
import { demoCreateMarriageApplicationDraft, demoUpdateMarriageApplicationDraft, demoSubmitMarriageApplication, demoStartMarriageEligibilityReview, demoApproveMarriageApplication, demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoScheduleMarriageAppointment } from "@/demo/services/crvsMarriageAppointments";
import {
  demoStartMarriageCheckIn,
  demoCheckInMarriageApplicant,
  demoCheckInMarriageWitness,
  demoConfirmMarriageCeremonyDocuments,
  demoRecordMarriageCeremonyRechecks,
  demoRecordMarriageConsent,
  demoRecordMarriageCeremonyOutcome,
} from "@/demo/services/crvsMarriageCeremony";
import { MarriageApplicant } from "@/domain/crvs/types";

const OFFICER_ID = "marriage.officer@demo.identity.local";
const OFFICER_NAME = "Test Marriage Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const OFFICIANT_NAME = "Test Marriage Officiant";

function applicant(spouseRole: "APPLICANT1" | "APPLICANT2"): MarriageApplicant {
  return {
    spouseRole,
    nationalityCategory: "CITIZEN",
    documentType: "NATIONAL_ID",
    firstName: spouseRole === "APPLICANT1" ? "Test1" : "Test2",
    lastName: "Applicant",
    sex: spouseRole === "APPLICANT1" ? "FEMALE" : "MALE",
    civilStatus: "SINGLE",
    verification: "VERIFIED",
    partnerConfirmationStatus: spouseRole === "APPLICANT2" ? "CONFIRMED" : "NOT_REQUIRED",
  };
}

function scheduledApplication() {
  const draft = demoCreateMarriageApplicationDraft(
    {
      officeId: "OFF-TEST",
      officeName: "Test Office",
      officeType: "DISTRICT_SECTOR_OFFICE",
      jurisdiction: "Demo District",
      applicant1: applicant("APPLICANT1"),
      applicant2: applicant("APPLICANT2"),
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
    { applicationId: draft.id, officeId: "OFF-TEST", officeName: "Test Office", date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), timeSlot: "09:00-09:30", officiantId: "officiant@demo.identity.local", officiantName: OFFICIANT_NAME },
    OFFICER_ID,
    OFFICER_NAME
  );
  return { draft, appointment };
}

describe("Marriage ceremony flow", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("blocks completion until every readiness requirement is met, with a descriptive error", () => {
    const { draft, appointment } = scheduledApplication();
    const ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
    expect(() => demoRecordMarriageCeremonyOutcome(ceremony.id, "COMPLETED", {}, OFFICIANT_NAME)).toThrow(/cannot be completed/i);
  });

  it("blocks registration progression and records CONSENT_DECLINED when either applicant declines", async () => {
    const { draft, appointment } = scheduledApplication();
    let ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
    ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT1", OFFICIANT_NAME);
    ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT2", OFFICIANT_NAME);

    ceremony = demoRecordMarriageConsent(ceremony.id, { applicant1Consented: true, applicant2Consented: false, declinedBy: "APPLICANT2", declineReason: "Changed mind" }, OFFICIANT_NAME);
    expect(ceremony.outcome).toBe("CONSENT_DECLINED");
    expect(ceremony.consent.declinedBy).toBe("APPLICANT2");

    const app = await demoGetMarriageApplication(draft.id);
    expect(app!.status).toBe("REJECTED");
    expect(app!.rejectionReason?.ceremonyConsentDeclined).toBe(true);

    // Consent-declined is terminal for this ceremony attempt — no further outcome can be recorded on it.
    expect(() => demoRecordMarriageCeremonyOutcome(ceremony.id, "COMPLETED", {}, OFFICIANT_NAME)).toThrow();
  });

  it("records a no-show and moves the application to NO_SHOW without registering", async () => {
    const { draft, appointment } = scheduledApplication();
    const ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
    const updated = demoRecordMarriageCeremonyOutcome(ceremony.id, "NO_SHOW", { noShowNote: "Neither applicant appeared." }, OFFICIANT_NAME);
    expect(updated.outcome).toBe("NO_SHOW");

    const app = await demoGetMarriageApplication(draft.id);
    expect(app!.status).toBe("NO_SHOW");
  });

  it("records a postponement without registering, and the application can be rescheduled afterward", async () => {
    const { draft, appointment } = scheduledApplication();
    const ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
    const updated = demoRecordMarriageCeremonyOutcome(ceremony.id, "POSTPONED", { postponedReason: "Officiant unavailable." }, OFFICIANT_NAME);
    expect(updated.outcome).toBe("POSTPONED");

    const app = await demoGetMarriageApplication(draft.id);
    expect(app!.status).toBe("POSTPONED");

    const rescheduled = demoScheduleMarriageAppointment(
      { applicationId: draft.id, officeId: "OFF-TEST", officeName: "Test Office", date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), timeSlot: "10:00-10:30" },
      OFFICER_ID,
      OFFICER_NAME
    );
    expect(rescheduled.id).not.toBe(appointment.id); // a fresh appointment record, not a reopened one
  });

  it("completes successfully once every requirement is met", () => {
    const { draft, appointment } = scheduledApplication();
    let ceremony = demoStartMarriageCheckIn(draft.id, appointment.id, OFFICIANT_NAME);
    ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT1", OFFICIANT_NAME);
    ceremony = demoCheckInMarriageApplicant(ceremony.id, "APPLICANT2", OFFICIANT_NAME);
    ceremony = demoCheckInMarriageWitness(ceremony.id, "w1", OFFICIANT_NAME);
    ceremony = demoCheckInMarriageWitness(ceremony.id, "w2", OFFICIANT_NAME);
    ceremony = demoConfirmMarriageCeremonyDocuments(ceremony.id, OFFICIANT_NAME);
    ceremony = demoRecordMarriageCeremonyRechecks(ceremony.id, { eligibilityRecheckPassed: true, existingMarriageRecheckPassed: true }, OFFICIANT_NAME);
    ceremony = demoRecordMarriageConsent(ceremony.id, { applicant1Consented: true, applicant2Consented: true }, OFFICIANT_NAME);
    ceremony = demoRecordMarriageCeremonyOutcome(ceremony.id, "COMPLETED", {}, OFFICIANT_NAME);
    expect(ceremony.outcome).toBe("COMPLETED");
  });
});
