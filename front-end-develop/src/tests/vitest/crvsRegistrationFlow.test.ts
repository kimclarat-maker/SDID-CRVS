import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import { demoCreateRegistrationDraft, demoSubmitRegistration, demoStartReview, demoSetReviewSectionStatus, demoApproveRegistration } from "@/demo/services/crvsRegistrations";
import { demoRunDuplicateCheck } from "@/demo/services/crvsDuplicateCheck";
import { demoAttachEvidence } from "@/demo/services/crvsEvidence";
import { demoSearchSdidIdentity } from "@/demo/services/crvsIdentitySearch";
import { demoProcessSdidSync } from "@/demo/services/crvsSdidSync";
import { CreateRegistrationInput } from "@/demo/services/crvsRegistrations";
import { ReviewSectionKey } from "@/domain/crvs/types";

const OFFICER_ID = "crvs.officer@demo.identity.local";
const OFFICER_NAME = "Test Registration Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

const buildInput = (overrides: Partial<CreateRegistrationInput> = {}): CreateRegistrationInput => ({
  sourceType: "COMMUNITY",
  occurrenceType: "FACILITY",
  facilityId: "FAC-DEMO-01",
  facilityName: "Demo District Health Centre",
  placeOfBirth: "Demo District Health Centre",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfBirth: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  dateReported: new Date().toISOString(),
  registrationCategory: "Standard",
  child: {
    firstName: "Flow",
    lastName: "Testcase",
    sex: "MALE",
    dateOfBirth: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    placeOfBirth: "Demo District Health Centre",
    multipleBirth: { isMultiple: false },
  },
  mother: {
    firstName: "Flow",
    lastName: "Mothercase",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999910",
    nationality: "Demo Republic",
    verification: "VERIFIED",
  },
  father: { availability: "NOT_DECLARED" },
  declarant: {
    relationship: "Mother",
    documentType: "NATIONAL_ID",
    documentNumber: "DEMO-ID-999910",
    firstName: "Flow",
    lastName: "Mothercase",
    verification: "VERIFIED",
  },
  ...overrides,
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

describe("Standard registration flow: create -> verify -> evidence -> duplicate check -> submit -> review -> approve -> register -> synchronize", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("produces a REGISTERED case with an official birth-record number and, once synced, a foundational identity + fictional NIN", async () => {
    const draft = demoCreateRegistrationDraft(buildInput(), OFFICER_ID, OFFICER_NAME);
    expect(draft.status).toBe("DRAFT");
    expect(draft.reference).toMatch(/^BR-DEMO-\d{4}-\d{4}$/);

    const identity = await demoSearchSdidIdentity("NATIONAL_ID", "DEMO-ID-000101", OFFICER_NAME, draft.reference);
    expect(["NO_MATCH", "MATCH_FOUND", "MULTIPLE_MATCHES", "SERVICE_UNAVAILABLE"]).toContain(identity.state);

    demoAttachEvidence(draft.id, {
      documentType: "Attestation of birth",
      fileName: "attestation.pdf",
      fileType: "application/pdf",
      fileSizeKb: 120,
    }, OFFICER_NAME);

    const duplicateResult = await demoRunDuplicateCheck(
      draft.id,
      { child: draft.child, mother: draft.mother, facilityId: draft.facilityId, placeOfBirth: draft.placeOfBirth },
      OFFICER_NAME
    );
    expect(duplicateResult.overallLevel).toBe("NONE");

    const submitted = demoSubmitRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");

    demoStartReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    VERIFIED_SECTIONS.forEach((section) => demoSetReviewSectionStatus(draft.id, section, "VERIFIED", REGISTRAR_NAME));

    const approved = demoApproveRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(approved.status).toBe("REGISTERED");
    expect(approved.officialBirthRecordNumber).toMatch(/^CRVS-BIRTH-DEMO-\d{4}$/);
    expect(approved.sdid.status).toBe("PENDING");

    vi.spyOn(Math, "random").mockReturnValue(0.1); // below the 0.8 success threshold
    const outcome = await demoProcessSdidSync(draft.id, REGISTRAR_NAME);
    expect(outcome).toBe("IDENTITY_CREATED");

    const after = getDemoData();
    const finalCase = after.crvsRegistrations.find((c) => c.id === draft.id)!;
    expect(finalCase.sdid.status).toBe("IDENTITY_CREATED");
    expect(finalCase.sdid.fictionalNin).toMatch(/^DEMO-NIN-2026-\d{6}$/);
    expect(finalCase.status).toBe("REGISTERED"); // registration status is never changed by sync

    const identityRecord = after.crvsFoundationalIdentities.find((f) => f.id === finalCase.sdid.foundationalIdentityId);
    expect(identityRecord).toBeTruthy();
    expect(identityRecord?.identityStatus).toBe("MINOR_ACTIVE");
    expect(identityRecord?.biometrics).toBe("NOT_REQUIRED_FOR_NEWBORN");
    expect(identityRecord?.credential).toBe("NOT_ISSUED");
  });

  it("a registrar cannot approve a case they created themselves", () => {
    const draft = demoCreateRegistrationDraft(buildInput(), REGISTRAR_ID, REGISTRAR_NAME);
    demoSubmitRegistration(draft.id, REGISTRAR_NAME);
    demoStartReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(() => demoApproveRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME)).toThrow(/Cannot approve/);
  });
});
