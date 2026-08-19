import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import {
  demoFetchApplicantByDocumentNumber,
  demoFetchApplicantPhoneNumbers,
} from "@/demo/services/applicants";

describe("Demo applicant search", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("finds a seeded applicant by identity number", async () => {
    const applicant = getDemoData().applicants[0];
    const result = await demoFetchApplicantByDocumentNumber(
      applicant.identityNumber
    );
    expect(result.firstName).toBe(applicant.firstName);
    expect(result.lastName).toBe(applicant.lastName);
  });

  it("finds a seeded applicant by application reference", async () => {
    const application = getDemoData().applications[0];
    const result = await demoFetchApplicantByDocumentNumber(
      application.reference
    );
    expect(result).toBeTruthy();
  });

  it("rejects an identifier that matches no seeded record", async () => {
    await expect(
      demoFetchApplicantByDocumentNumber("DEMO-ID-999999")
    ).rejects.toThrow();
  });

  it("returns the applicant's phone number for a known identifier", async () => {
    const applicant = getDemoData().applicants[0];
    const phones = await demoFetchApplicantPhoneNumbers(
      applicant.identityNumber
    );
    expect(phones).toContain(applicant.phoneNumber);
  });
});
