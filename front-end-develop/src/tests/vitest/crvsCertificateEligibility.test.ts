import { describe, expect, it } from "vitest";
import { assessCertificateEligibility } from "@/domain/crvs/certificateEligibility";
import { BirthCertificateRequest, BirthRegistrationCase, DemoBirthCertificate, FoundationalIdentity } from "@/domain/crvs/types";

const testIdentity = { id: "FID-TEST-1" } as unknown as FoundationalIdentity;
const conflictingActiveCertificate = { birthRecordId: "BR-TEST-1", status: "ACTIVE" } as unknown as DemoBirthCertificate;

const baseRequest: BirthCertificateRequest = {
  id: "CERTREQ-TEST-1",
  applicationReference: "CERTREQ-DEMO-TEST-0001",
  channel: "PUBLIC_ONLINE",
  status: "ELIGIBILITY_CHECK",
  requester: {
    requesterType: "PARENT",
    firstName: "Test",
    lastName: "Requester",
    documentType: "NATIONAL_ID",
    documentNumberMasked: "DEM***",
    relationshipToSubject: "Mother",
    verificationStatus: "VERIFIED",
  },
  subject: {
    birthRecordId: "BR-TEST-1",
    birthRecordNumber: "CRVS-BIRTH-TEST-0001",
    foundationalIdentityId: "FID-TEST-1",
    dateOfBirth: "2026-01-01",
    placeOfBirthSummary: "Test Facility",
  },
  purpose: "GENERAL_PROOF",
  eligibility: { status: "NOT_CHECKED", reasons: [] },
  payment: { status: "NOT_REQUIRED", amount: 15, currency: "USD" },
  delivery: { method: "SECURE_DOWNLOAD", status: "NOT_STARTED", attempts: [] },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: { id: "public", name: "Public requester" },
  updatedBy: { id: "public", name: "Public requester" },
  statusHistory: [],
  version: 1,
};

const baseCase: Partial<BirthRegistrationCase> = {
  id: "BR-TEST-1",
  status: "REGISTERED",
  correctionRequests: [],
};

describe("certificate eligibility engine", () => {
  it("is ELIGIBLE when the record is registered, requester verified, relationship set, no restrictions", () => {
    const verdict = assessCertificateEligibility({
      request: baseRequest,
      registrationCase: baseCase as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("ELIGIBLE");
    expect(verdict.reasons).toHaveLength(0);
  });

  it("is INELIGIBLE when no registration case is matched", () => {
    const verdict = assessCertificateEligibility({
      request: baseRequest,
      registrationCase: undefined,
      foundationalIdentity: undefined,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("INELIGIBLE");
  });

  it("is INELIGIBLE when the matched record is not REGISTERED", () => {
    const verdict = assessCertificateEligibility({
      request: baseRequest,
      registrationCase: { ...baseCase, status: "UNDER_REVIEW" } as BirthRegistrationCase,
      foundationalIdentity: undefined,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("INELIGIBLE");
  });

  it("is INELIGIBLE when the requester's verification mismatched", () => {
    const verdict = assessCertificateEligibility({
      request: { ...baseRequest, requester: { ...baseRequest.requester, verificationStatus: "MISMATCH" } },
      registrationCase: baseCase as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("INELIGIBLE");
  });

  it("routes to MANUAL_REVIEW when the requester isn't yet verified", () => {
    const verdict = assessCertificateEligibility({
      request: { ...baseRequest, requester: { ...baseRequest.requester, verificationStatus: "OTP_REQUIRED" } },
      registrationCase: baseCase as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("MANUAL_REVIEW");
  });

  it("routes to MANUAL_REVIEW when there's an unresolved correction on the record", () => {
    const verdict = assessCertificateEligibility({
      request: baseRequest,
      registrationCase: {
        ...baseCase,
        correctionRequests: [{ id: "CR-1", requestedBy: "x", requestedAt: "2026-01-01", notifyOfficer: false, items: [] }],
      } as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [],
    });
    expect(verdict.status).toBe("MANUAL_REVIEW");
    expect(verdict.reasons.join(" ")).toMatch(/correction/i);
  });

  it("routes to MANUAL_REVIEW when an active certificate already exists for a non-replacement request", () => {
    const verdict = assessCertificateEligibility({
      request: baseRequest,
      registrationCase: baseCase as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [conflictingActiveCertificate],
    });
    expect(verdict.status).toBe("MANUAL_REVIEW");
  });

  it("does not flag an existing active certificate when the request is itself a replacement", () => {
    const verdict = assessCertificateEligibility({
      request: { ...baseRequest, replacementIndicator: true },
      registrationCase: baseCase as BirthRegistrationCase,
      foundationalIdentity: testIdentity,
      existingActiveCertificates: [conflictingActiveCertificate],
    });
    expect(verdict.status).toBe("ELIGIBLE");
  });
});
