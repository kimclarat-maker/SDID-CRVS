import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  demoCreateRegistrationDraft,
  demoSubmitRegistration,
  demoResolveLateRegistration,
  demoSetReviewSectionStatus,
  demoApproveRegistration,
  CreateRegistrationInput,
} from "@/demo/services/crvsRegistrations";
import { isLateRegistration, requiresSupervisorReview } from "@/domain/crvs/lateRegistration";
import { ReviewSectionKey } from "@/domain/crvs/types";

const OFFICER_ID = "crvs.officer@demo.identity.local";
const OFFICER_NAME = "Test Registration Officer";
const SUPERVISOR_NAME = "Test CRVS Supervisor";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const buildLateInput = (): CreateRegistrationInput => ({
  sourceType: "LATE",
  occurrenceType: "HOME",
  placeOfBirth: "Remote village",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfBirth: daysAgo(45),
  dateReported: daysAgo(1),
  delayReason: "Family lived without registration access until now.",
  registrationCategory: "Late",
  child: {
    firstName: "Late",
    lastName: "Testcase",
    sex: "MALE",
    dateOfBirth: daysAgo(45),
    placeOfBirth: "Remote village",
    multipleBirth: { isMultiple: false },
  },
  mother: {
    firstName: "Late",
    lastName: "Mothercase",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999930",
    nationality: "Demo Republic",
    verification: "VERIFIED",
  },
  father: { availability: "NOT_DECLARED" },
  declarant: {
    relationship: "Mother",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999930",
    firstName: "Late",
    lastName: "Mothercase",
    verification: "VERIFIED",
  },
});

const VERIFIED_SECTIONS: ReviewSectionKey[] = [
  "CHILD",
  "PARENTS",
  "DECLARANT",
  "WITNESSES",
  "EVIDENCE",
  "DUPLICATE_CHECK",
  "LATE_OR_EXCEPTION",
  "OFFICER_DECLARATION",
];

describe("Late registration: direct registration -> automatic classification -> supervisor review -> return to registrar -> approval", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("classifies a 45-day-late community registration as late and requiring supervisor review", () => {
    expect(isLateRegistration(daysAgo(45), daysAgo(1))).toBe(true);
    expect(requiresSupervisorReview(daysAgo(45), daysAgo(1))).toBe(true);

    const draft = demoCreateRegistrationDraft(buildLateInput(), OFFICER_ID, OFFICER_NAME);
    expect(draft.isLate).toBe(true);
    expect(draft.requiresSupervisorReview).toBe(true);

    const submitted = demoSubmitRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("LATE_REGISTRATION_REVIEW");

    const returnedToRegistrar = demoResolveLateRegistration(
      draft.id,
      { type: "RETURN_TO_REGISTRAR", reason: "Delay explanation and evidence are sufficient.", nextStatus: "UNDER_REVIEW" },
      SUPERVISOR_NAME
    );
    expect(returnedToRegistrar.status).toBe("UNDER_REVIEW");

    // Already UNDER_REVIEW via the supervisor's resolution — no further
    // demoStartReview() call is legal or necessary here.
    VERIFIED_SECTIONS.forEach((section) => demoSetReviewSectionStatus(draft.id, section, "VERIFIED", REGISTRAR_NAME));
    const approved = demoApproveRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(approved.status).toBe("REGISTERED");
  });
});
