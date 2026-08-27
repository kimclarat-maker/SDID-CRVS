import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission, hasWorkspace, getAssignmentForWorkspace } from "@/utils/workspace";
import { canApproveMarriageCase, canAccessMarriageCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { MarriageApplication } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseApplication: Pick<MarriageApplication, "officerId" | "applicant1" | "applicant2" | "witnesses" | "jurisdiction" | "correctionRequests" | "objection"> = {
  officerId: "marriage.officer@demo.identity.local",
  applicant1: {
    spouseRole: "APPLICANT1",
    nationalityCategory: "CITIZEN",
    documentType: "NATIONAL_ID",
    sex: "FEMALE",
    civilStatus: "SINGLE",
    verification: "VERIFIED",
    partnerConfirmationStatus: "NOT_REQUIRED",
  },
  applicant2: {
    spouseRole: "APPLICANT2",
    nationalityCategory: "CITIZEN",
    documentType: "NATIONAL_ID",
    sex: "MALE",
    civilStatus: "SINGLE",
    verification: "VERIFIED",
    partnerConfirmationStatus: "CONFIRMED",
  },
  witnesses: [],
  jurisdiction: "Demo District",
  correctionRequests: [],
};

describe("Marriage permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("a Marriage Registration Officer cannot approve or register applications", () => {
    seedSession({
      _id: "marriage.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "MARRIAGE_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.MARRIAGE_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_CONDUCT)).toBe(false);
  });

  it("a Marriage Officiant can conduct ceremonies but has no approval or registration authority", () => {
    seedSession({
      _id: "marriage.officiant@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "MARRIAGE_OFFICIANT", permissions: CRVS_ROLE_PERMISSIONS.MARRIAGE_OFFICIANT }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_CONDUCT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_RECORD_OUTCOME)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CHECKIN_MANAGE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_APPROVE)).toBe(false);
  });

  it("a Civil Registrar has approval/registration authority but not ceremony-conduct authority", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_CREATE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTRATION_APPROVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_CONDUCT)).toBe(false);
  });

  it("a CRVS Auditor is read-only for marriage: no create/edit/approve authority", () => {
    seedSession({
      _id: "crvs.auditor@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_AUDITOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_AUDITOR }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE)).toBe(false);
  });

  it("a Civil Registrar cannot approve an application they prepared themselves (maker-checker)", () => {
    const result = canApproveMarriageCase("registrar@demo.identity.local", { ...baseApplication, officerId: "registrar@demo.identity.local" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/prepared this application/i);
  });

  it("a Civil Registrar cannot approve where they are either applicant or a witness", () => {
    seedSession({ _id: "registrar@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR }] });

    const asApplicant1 = canApproveMarriageCase("registrar@demo.identity.local", {
      ...baseApplication,
      applicant1: { ...baseApplication.applicant1, sdidIdentityId: "registrar@demo.identity.local" },
    });
    expect(asApplicant1.allowed).toBe(false);
    expect(asApplicant1.reasons.join(" ")).toMatch(/applicant 1/i);

    const asApplicant2 = canApproveMarriageCase("registrar@demo.identity.local", {
      ...baseApplication,
      applicant2: { ...baseApplication.applicant2, sdidIdentityId: "registrar@demo.identity.local" },
    });
    expect(asApplicant2.allowed).toBe(false);
    expect(asApplicant2.reasons.join(" ")).toMatch(/applicant 2/i);

    const asWitness = canApproveMarriageCase("registrar@demo.identity.local", {
      ...baseApplication,
      witnesses: [{ id: "w1", spouseRole: "APPLICANT1", relationship: "Friend", documentType: "NONE", firstName: "R", lastName: "Registrar", dateOfBirth: "1990-01-01", verification: "VERIFIED", sdidIdentityId: "registrar@demo.identity.local" }],
    });
    expect(asWitness.allowed).toBe(false);
    expect(asWitness.reasons.join(" ")).toMatch(/witness/i);
  });

  it("a Civil Registrar cannot approve outside their assigned jurisdiction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(canAccessMarriageCaseJurisdiction("Other District")).toBe(false);
    const result = canApproveMarriageCase("registrar@demo.identity.local", { ...baseApplication, jurisdiction: "Other District" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/jurisdiction/i);
  });

  it("a Civil Registrar cannot approve while a correction request is open", () => {
    const result = canApproveMarriageCase("registrar@demo.identity.local", {
      ...baseApplication,
      correctionRequests: [{ id: "c1", requestedBy: "x", requestedAt: new Date().toISOString(), items: [], notifyApplicants: false, responseToken: "tok" }],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/pending correction/i);
  });

  it("a Civil Registrar cannot approve while an objection is pending", () => {
    const result = canApproveMarriageCase("registrar@demo.identity.local", {
      ...baseApplication,
      objection: { id: "o1", raisedBy: "Someone", raisedAt: new Date().toISOString(), reason: "test", status: "PENDING" },
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/pending objection/i);
  });

  it("separation of duties: a registrar who also conducted the ceremony as officiant cannot register it themselves", () => {
    const result = canApproveMarriageCase("registrar@demo.identity.local", baseApplication, "registrar@demo.identity.local");
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/conducted the ceremony/i);
  });

  it("a Civil Registrar can approve an unrelated, in-jurisdiction application with no open issues and a different officiant", () => {
    const result = canApproveMarriageCase("registrar@demo.identity.local", baseApplication, "marriage.officiant@demo.identity.local");
    expect(result.allowed).toBe(true);
  });

  it("SUPERADMIN alone does not grant CRVS marriage-approval authority", () => {
    seedSession({
      _id: "admin@demo.identity.local",
      accessRole: { value: "SUPERADMIN" },
      permissions: [],
      assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }],
    });
    expect(getAssignmentForWorkspace("CRVS")).toBeUndefined();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_APPROVE)).toBe(false);
  });

  it("SDID-only staff cannot access CRVS marriage routes", () => {
    seedSession({
      _id: "officer@demo.identity.local",
      assignments: [{ workspace: "SDID", role: "enrolmentOfficer", permissions: [] }],
    });
    expect(hasWorkspace("CRVS")).toBe(false);
  });
});
