import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateRegistrationDraft,
  demoSubmitRegistration,
  demoStartReview,
  demoSetReviewSectionStatus,
  demoRequestCorrection,
  demoResubmitCorrections,
  demoApproveRegistration,
  CreateRegistrationInput,
} from "@/demo/services/crvsRegistrations";
import { ReviewSectionKey } from "@/domain/crvs/types";

const OFFICER_ID = "crvs.officer@demo.identity.local";
const OFFICER_NAME = "Test Registration Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

const buildInput = (): CreateRegistrationInput => ({
  sourceType: "COMMUNITY",
  occurrenceType: "FACILITY",
  facilityId: "FAC-DEMO-01",
  facilityName: "Demo District Health Centre",
  placeOfBirth: "Demo District Health Centre",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfBirth: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  dateReported: new Date().toISOString(),
  registrationCategory: "Standard",
  child: {
    firstName: "Correction",
    lastName: "Cycle",
    sex: "FEMALE",
    dateOfBirth: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    placeOfBirth: "Demo District Health Centre",
    multipleBirth: { isMultiple: false },
  },
  mother: {
    firstName: "Correction",
    lastName: "Mothercase",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999920",
    nationality: "Demo Republic",
    verification: "VERIFIED",
  },
  father: { availability: "NOT_DECLARED" },
  declarant: {
    relationship: "Mother",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999920",
    firstName: "Correction",
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

describe("Correction cycle: submit -> start review -> request correction -> officer edits -> resubmit -> registrar approves", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns to the registrar as RESUBMITTED and can then be approved", () => {
    const draft = demoCreateRegistrationDraft(buildInput(), OFFICER_ID, OFFICER_NAME);
    demoSubmitRegistration(draft.id, OFFICER_NAME);
    demoStartReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const corrected = demoRequestCorrection(
      draft.id,
      {
        items: [
          {
            id: "will-be-replaced",
            section: "CHILD",
            fields: ["Child's given name"],
            reason: "Spelling mismatch",
            requiredEvidenceReplacement: false,
            addressed: false,
          },
        ],
        requestedBy: REGISTRAR_NAME,
        notifyOfficer: true,
      },
      REGISTRAR_NAME
    );
    expect(corrected.status).toBe("CORRECTION_REQUIRED");
    expect(corrected.correctionRequests).toHaveLength(1);
    expect(corrected.correctionRequests[0].items[0].addressed).toBe(false);

    const resubmitted = demoResubmitCorrections(draft.id, OFFICER_NAME);
    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.correctionRequests[0].items[0].addressed).toBe(true);
    expect(resubmitted.correctionRequests[0].resolvedAt).toBeTruthy();

    demoStartReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    VERIFIED_SECTIONS.forEach((section) => demoSetReviewSectionStatus(draft.id, section, "VERIFIED", REGISTRAR_NAME));
    const approved = demoApproveRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(approved.status).toBe("REGISTERED");

    const auditActions = getDemoData()
      .auditEvents.filter((e) => e.targetRef === draft.reference)
      .map((e) => e.action);
    expect(auditActions).toEqual(
      expect.arrayContaining(["requested correction", "resubmitted", "approved and registered"])
    );
  });
});
