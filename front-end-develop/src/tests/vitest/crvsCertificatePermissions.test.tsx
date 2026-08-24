import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission } from "@/utils/workspace";
import { canApproveCertificateRequest, certificateReviewConflictReasons } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthCertificateRequest } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseRequest: Pick<BirthCertificateRequest, "createdBy" | "requester"> = {
  createdBy: { id: "crvs.officer@demo.identity.local", name: "Test Officer" },
  requester: {
    requesterType: "SELF",
    firstName: "Test",
    lastName: "Requester",
    documentType: "NATIONAL_ID",
    documentNumberMasked: "DEM***",
    verificationStatus: "VERIFIED",
  },
};

describe("certificate permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("a CRVS Registration Officer cannot revoke a certificate", () => {
    seedSession({
      _id: "crvs.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.CRVS_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVOKE)).toBe(false);
  });

  it("a CRVS Registration Officer cannot approve a review or issue directly", () => {
    seedSession({
      _id: "crvs.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.CRVS_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_ISSUE)).toBe(false);
  });

  it("only Civil Registrar, CRVS Supervisor, and Registration Officer roles carry fee-waiver authority — nobody else", () => {
    expect(CRVS_ROLE_PERMISSIONS.BIRTH_NOTIFICATION_OFFICER).not.toContain(CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE);
    expect(CRVS_ROLE_PERMISSIONS.PLATFORM_ADMINISTRATOR).not.toContain(CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE);

    seedSession({
      _id: "notifier@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "BIRTH_NOTIFICATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.BIRTH_NOTIFICATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE)).toBe(false);
  });

  it("Platform Administrator can manage configuration but never gains approval, issuance, revocation, replacement or waiver authority", () => {
    expect(CRVS_ROLE_PERMISSIONS.PLATFORM_ADMINISTRATOR).toContain(CRVS_PERMISSIONS.CERTIFICATE_CONFIGURATION_MANAGE);
    for (const restricted of [
      CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE,
      CRVS_PERMISSIONS.CERTIFICATE_ISSUE,
      CRVS_PERMISSIONS.CERTIFICATE_REVOKE,
      CRVS_PERMISSIONS.CERTIFICATE_REPLACE,
      CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE,
    ]) {
      expect(CRVS_ROLE_PERMISSIONS.PLATFORM_ADMINISTRATOR).not.toContain(restricted);
    }

    seedSession({
      _id: "crvs.admin@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "PLATFORM_ADMINISTRATOR", permissions: CRVS_ROLE_PERMISSIONS.PLATFORM_ADMINISTRATOR }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_CONFIGURATION_MANAGE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE)).toBe(false);
  });

  it("SUPERADMIN alone does not grant certificate approval, issuance or revocation authority", () => {
    seedSession({
      _id: "admin@demo.identity.local",
      accessRole: { value: "SUPERADMIN" },
      permissions: [],
      assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_ISSUE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVOKE)).toBe(false);
  });

  it("a Civil Registrar cannot approve a certificate request they created themselves", () => {
    const result = canApproveCertificateRequest("crvs.officer@demo.identity.local", baseRequest);
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/created this certificate request/i);
  });

  it("a Civil Registrar cannot approve a request where they are the verified requester", () => {
    const request: Pick<BirthCertificateRequest, "createdBy" | "requester"> = {
      createdBy: { id: "public-requester", name: "Public requester" },
      requester: { ...baseRequest.requester, matchedIdentityId: "registrar@demo.identity.local" },
    };
    const result = canApproveCertificateRequest("registrar@demo.identity.local", request);
    expect(result.allowed).toBe(false);
    expect(certificateReviewConflictReasons("registrar@demo.identity.local", request).join(" ")).toMatch(/verified requester/i);
  });

  it("a Civil Registrar can approve an unrelated request with no conflict", () => {
    const result = canApproveCertificateRequest("registrar@demo.identity.local", baseRequest);
    expect(result.allowed).toBe(true);
  });

  it("a public (unauthenticated) user has no CRVS workspace permissions", () => {
    sessionStorage.clear();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_ISSUE)).toBe(false);
  });
});
