import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateDeathRegistrationDraft,
  demoUpdateDeathRegistrationDraft,
  demoSubmitDeathRegistration,
  demoStartDeathReview,
  demoRequestDeathCorrection,
  demoApproveDeathRegistration,
  demoRejectDeathRegistration,
  demoRouteDeathCase,
  demoResolveDeathExceptionReview,
  CreateDeathRegistrationInput,
} from "@/demo/services/crvsDeathRegistrations";
import { IllegalTransitionError } from "@/domain/crvs/statusMachines";

const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";
const OFFICER_NAME = "Test Death Registration Officer";

const baseInput = (overrides: Partial<CreateDeathRegistrationInput> = {}): CreateDeathRegistrationInput => ({
  pathway: "HEALTH_FACILITY",
  processingOfficeId: "OFFICE-DEMO-01",
  processingOfficeName: "Demo District Registration Office",
  jurisdiction: "Demo District",
  dateOfDeath: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  dateReported: new Date().toISOString(),
  deceased: { identityStatus: "KNOWN", firstName: "Test", lastName: "Deceased", sex: "MALE", nationality: "Demo Republic", verification: "NOT_VERIFIED" },
  occurrence: { dateOfDeath: new Date().toISOString(), placeCategory: "HEALTH_FACILITY", location: "Demo District Health Centre", adminLocation: "Demo District", jurisdiction: "Demo District", circumstanceCategory: "NATURAL_ILLNESS" },
  declarant: { relationship: "Spouse", documentType: "NATIONAL_ID", firstName: "Test", lastName: "Declarant", verification: "VERIFIED" },
  ...overrides,
});

describe("Death registration flow", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("health-facility pathway: draft -> submit -> review -> approve -> registered", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    expect(draft.status).toBe("DRAFT");
    expect(draft.reference).toMatch(/^DR-DEMO-\d{4}-\d{4}$/);

    const submitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");

    const reviewed = demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(reviewed.status).toBe("UNDER_REVIEW");

    const approved = demoApproveDeathRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true);
    expect(approved.status).toBe("REGISTERED");
    expect(approved.officialDeathRecordNumber).toMatch(/^CRVS-DEATH-DEMO-\d{4}$/);
    expect(approved.registrationEvent?.officialDeathRecordNumber).toBe(approved.officialDeathRecordNumber);
    expect(approved.sdid.status).toBe("PENDING");
  });

  it("blocks approval when the reviewer does not confirm they did not prepare the case", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(() => demoApproveDeathRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, false)).toThrow(/confirm/i);
  });

  it("blocks approval by the same account that created the case (maker-checker)", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), REGISTRAR_ID, REGISTRAR_NAME);
    demoSubmitDeathRegistration(draft.id, REGISTRAR_NAME);
    expect(() => demoApproveDeathRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true)).toThrow(/cannot approve/i);
  });

  it("community pathway: submitted case reaches UNDER_REVIEW like any other pathway", () => {
    const draft = demoCreateDeathRegistrationDraft(
      baseInput({ pathway: "COMMUNITY", occurrence: { ...baseInput().occurrence, placeCategory: "HOME" } }),
      "crvs.officer@demo.identity.local",
      OFFICER_NAME
    );
    const submitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");
    const reviewed = demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(reviewed.status).toBe("UNDER_REVIEW");
  });

  it("late pathway: submission routes directly to LATE_REGISTRATION_REVIEW", () => {
    const draft = demoCreateDeathRegistrationDraft(
      baseInput({ pathway: "LATE", dateOfDeath: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), dateReported: new Date().toISOString() }),
      "crvs.officer@demo.identity.local",
      OFFICER_NAME
    );
    expect(draft.isLate).toBe(true);
    const submitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("LATE_REGISTRATION_REVIEW");
  });

  it("medico-legal pathway: submission routes directly to MEDICO_LEGAL_REVIEW", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput({ pathway: "MEDICO_LEGAL" }), "crvs.officer@demo.identity.local", OFFICER_NAME);
    const submitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("MEDICO_LEGAL_REVIEW");
  });

  it("unidentified-person pathway: submission routes directly to UNIDENTIFIED_PERSON_REVIEW", () => {
    const draft = demoCreateDeathRegistrationDraft(
      baseInput({ pathway: "UNIDENTIFIED", deceased: { identityStatus: "IDENTITY_UNKNOWN", sex: "UNKNOWN", verification: "MANUAL_REVIEW_REQUIRED" } }),
      "crvs.officer@demo.identity.local",
      OFFICER_NAME
    );
    const submitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("UNIDENTIFIED_PERSON_REVIEW");
  });

  it("a Civil Registrar can route an UNDER_REVIEW case into any exception branch and resolve it back", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const routed = demoRouteDeathCase(draft.id, "MEDICO_LEGAL_REVIEW", "New information suggests unnatural death.", REGISTRAR_NAME);
    expect(routed.status).toBe("MEDICO_LEGAL_REVIEW");
    expect(routed.exception?.type).toBe("MEDICO_LEGAL");

    const resolved = demoResolveDeathExceptionReview(draft.id, { type: "CLEARED", reason: "Investigation concluded natural causes.", nextStatus: "UNDER_REVIEW" }, REGISTRAR_NAME);
    expect(resolved.status).toBe("UNDER_REVIEW");
    expect(resolved.exception?.status).toBe("RESOLVED");
  });

  it("supports the correction-and-resubmission cycle", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const corrected = demoRequestDeathCorrection(
      draft.id,
      { requestedBy: REGISTRAR_NAME, notifyOfficer: true, items: [{ id: "x", section: "DECEASED", fields: [], reason: "Date of birth mismatch", requiredEvidenceReplacement: false, addressed: false }] },
      REGISTRAR_NAME
    );
    expect(corrected.status).toBe("CORRECTION_REQUIRED");
    expect(corrected.correctionRequests[0].responseToken).toBeTruthy();

    demoUpdateDeathRegistrationDraft(draft.id, { deceased: { ...draft.deceased, dateOfBirth: "1960-01-01" } }, OFFICER_NAME, corrected.version);

    const resubmitted = demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.correctionRequests[0].resolvedAt).toBeTruthy();
    expect(resubmitted.correctionRequests[0].items[0].addressed).toBe(true);

    // The case is now RESUBMITTED — a second resubmit call is illegal.
    expect(() => demoSubmitDeathRegistration(draft.id, OFFICER_NAME)).toThrow(IllegalTransitionError);
  });

  it("a rejected death registration cannot be approved afterwards", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    demoStartDeathReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    const rejected = demoRejectDeathRegistration(draft.id, { reason: "Insufficient evidence", explanation: "No supporting documents.", evidenceRefs: [], declarantNotified: true }, REGISTRAR_ID, REGISTRAR_NAME);
    expect(rejected.status).toBe("REJECTED");
    expect(() => demoApproveDeathRegistration(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true)).toThrow(IllegalTransitionError);
  });

  it("keeps every mutation recorded in the shared audit log", () => {
    const draft = demoCreateDeathRegistrationDraft(baseInput(), "crvs.officer@demo.identity.local", OFFICER_NAME);
    demoSubmitDeathRegistration(draft.id, OFFICER_NAME);
    const actions = getDemoData()
      .auditEvents.filter((e) => e.targetRef === draft.reference)
      .map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["created draft", "submitted"]));
  });
});
