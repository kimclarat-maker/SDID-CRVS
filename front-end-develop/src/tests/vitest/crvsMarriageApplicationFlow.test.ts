import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateMarriageApplicationDraft,
  demoRequestMarriagePartnerVerification,
  demoSubmitMarriageApplication,
  demoStartMarriageEligibilityReview,
  demoRequestMarriageCorrection,
  demoApproveMarriageApplication,
  demoRejectMarriageApplication,
} from "@/demo/services/crvsMarriageApplications";
import { demoConfirmMarriagePartnerParticipation, demoDeclineMarriagePartnerParticipation } from "@/demo/services/crvsMarriagePartnerResponse";
import { demoInitiateMarriagePayment, demoAttemptMarriagePayment } from "@/demo/services/crvsMarriagePayment";
import { MarriageApplicant } from "@/domain/crvs/types";

const OFFICER_ID = "marriage.officer@demo.identity.local";
const OFFICER_NAME = "Test Marriage Officer";
const REGISTRAR_ID = "registrar@demo.identity.local";
const REGISTRAR_NAME = "Test Civil Registrar";

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
    partnerConfirmationStatus: "NOT_REQUIRED",
  };
}

function freshDraft() {
  return demoCreateMarriageApplicationDraft(
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
}

describe("Marriage application lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("blocks submission until applicant 2 has confirmed participation", () => {
    const draft = freshDraft();
    expect(() => demoSubmitMarriageApplication(draft.id, OFFICER_NAME)).toThrow(/confirm participation/i);
  });

  it("allows submission once applicant 2 confirms via their token, and a decline blocks it permanently", () => {
    const draft = demoRequestMarriagePartnerVerification(freshDraft().id, OFFICER_NAME);
    expect(draft.status).toBe("PARTNER_VERIFICATION_REQUIRED");
    expect(draft.partnerResponseToken).toBeTruthy();

    const { reference } = demoConfirmMarriagePartnerParticipation(draft.partnerResponseToken!, "Test2 Applicant");
    expect(reference).toBe(draft.reference);

    const submitted = demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("a decline rejects the application and blocks any further submission", () => {
    const draft = demoRequestMarriagePartnerVerification(freshDraft().id, OFFICER_NAME);
    const { reference } = demoDeclineMarriagePartnerParticipation(draft.partnerResponseToken!, "I do not consent to this marriage.", "Test2 Applicant");
    expect(reference).toBe(draft.reference);
    expect(() => demoSubmitMarriageApplication(draft.id, OFFICER_NAME)).toThrow();
  });

  it("runs a correction request → resubmission cycle back into eligibility review", () => {
    let draft = demoRequestMarriagePartnerVerification(freshDraft().id, OFFICER_NAME);
    demoConfirmMarriagePartnerParticipation(draft.partnerResponseToken!, "Test2 Applicant");
    draft = demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
    draft = demoStartMarriageEligibilityReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    draft = demoRequestMarriageCorrection(
      draft.id,
      { requestedBy: REGISTRAR_NAME, notifyApplicants: true, items: [{ id: "c1", section: "APPLICANT1", fields: ["Residence"], reason: "Mismatch", requiredEvidenceReplacement: false, addressed: false }] },
      REGISTRAR_NAME
    );
    expect(draft.status).toBe("CORRECTION_REQUIRED");
    expect(draft.correctionRequests).toHaveLength(1);

    draft = demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
    expect(draft.status).toBe("RESUBMITTED");
    expect(draft.correctionRequests[0].resolvedAt).toBeTruthy();

    draft = demoStartMarriageEligibilityReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    expect(draft.status).toBe("ELIGIBILITY_REVIEW");
  });

  it("routes to PAYMENT_PENDING when a fee is required and unpaid, then auto-approves once payment succeeds", async () => {
    let draft = demoRequestMarriagePartnerVerification(freshDraft().id, OFFICER_NAME);
    demoConfirmMarriagePartnerParticipation(draft.partnerResponseToken!, "Test2 Applicant");
    draft = demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
    draft = demoStartMarriageEligibilityReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);
    demoInitiateMarriagePayment(draft.id, false, REGISTRAR_NAME);

    const afterApprovalAttempt = demoApproveMarriageApplication(draft.id, REGISTRAR_ID, REGISTRAR_NAME, true);
    expect(afterApprovalAttempt.status).toBe("PAYMENT_PENDING");
    expect(afterApprovalAttempt.payment.amount).toBeGreaterThan(0);

    vi.spyOn(Math, "random").mockReturnValue(0.01); // forces a successful demo payment
    const { outcome, application } = await demoAttemptMarriagePayment(draft.id, "DEMO_MOBILE_MONEY", REGISTRAR_NAME);
    expect(outcome).toBe("SUCCESS");
    expect(application.status).toBe("APPROVED");
    expect(application.payment.status).toBe("PAID");
  });

  it("rejects an application with a recorded, notified reason", () => {
    let draft = demoRequestMarriagePartnerVerification(freshDraft().id, OFFICER_NAME);
    demoConfirmMarriagePartnerParticipation(draft.partnerResponseToken!, "Test2 Applicant");
    draft = demoSubmitMarriageApplication(draft.id, OFFICER_NAME);
    draft = demoStartMarriageEligibilityReview(draft.id, REGISTRAR_ID, REGISTRAR_NAME);

    const rejected = demoRejectMarriageApplication(draft.id, { reason: "Ineligible", explanation: "Existing-marriage conflict unresolved.", evidenceRefs: [], applicantsNotified: true }, REGISTRAR_ID, REGISTRAR_NAME);
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason?.applicantsNotified).toBe(true);
  });
});
