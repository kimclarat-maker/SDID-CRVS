import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission, hasWorkspace, getAssignmentForWorkspace } from "@/utils/workspace";
import { canApproveCase, canAccessCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthRegistrationCase } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseCase: Pick<
  BirthRegistrationCase,
  "officerId" | "mother" | "father" | "declarant" | "witnesses" | "jurisdiction" | "correctionRequests"
> = {
  officerId: "crvs.officer@demo.identity.local",
  mother: {
    firstName: "Test",
    lastName: "Mother",
    documentType: "NATIONAL_ID",
    nationality: "Demo Republic",
    verification: "VERIFIED",
  },
  father: { availability: "NOT_DECLARED" },
  declarant: {
    relationship: "Mother",
    documentType: "NATIONAL_ID",
    firstName: "Test",
    lastName: "Mother",
    verification: "VERIFIED",
  },
  witnesses: [],
  jurisdiction: "Demo District",
  correctionRequests: [],
};

describe("Permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("a Birth Notification Officer cannot approve registrations", () => {
    seedSession({
      _id: "notifier@demo.identity.local",
      assignments: [
        {
          workspace: "CRVS",
          role: "BIRTH_NOTIFICATION_OFFICER",
          permissions: CRVS_ROLE_PERMISSIONS.BIRTH_NOTIFICATION_OFFICER,
        },
      ],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)).toBe(false);
  });

  it("a CRVS Registration Officer cannot approve registrations", () => {
    seedSession({
      _id: "crvs.officer@demo.identity.local",
      assignments: [
        {
          workspace: "CRVS",
          role: "CRVS_REGISTRATION_OFFICER",
          permissions: CRVS_ROLE_PERMISSIONS.CRVS_REGISTRATION_OFFICER,
        },
      ],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)).toBe(false);
  });

  it("a Civil Registrar cannot approve a case they created themselves", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } },
      ],
    });
    const result = canApproveCase("registrar@demo.identity.local", { ...baseCase, officerId: "registrar@demo.identity.local" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/created this case/i);
  });

  it("a Civil Registrar cannot approve a case where they are the declarant", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } },
      ],
    });
    const result = canApproveCase("registrar@demo.identity.local", {
      ...baseCase,
      declarant: { ...baseCase.declarant, sdidIdentityId: "registrar@demo.identity.local" },
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/declarant/i);
  });

  it("a Civil Registrar cannot approve a case outside their assigned jurisdiction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } },
      ],
    });
    expect(canAccessCaseJurisdiction("Other District")).toBe(false);
    const result = canApproveCase("registrar@demo.identity.local", { ...baseCase, jurisdiction: "Other District" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/jurisdiction/i);
  });

  it("a Civil Registrar can approve an unrelated, in-jurisdiction case with no open correction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } },
      ],
    });
    const result = canApproveCase("registrar@demo.identity.local", baseCase);
    expect(result.allowed).toBe(true);
  });

  it("a CRVS Supervisor can resolve configured exceptions and duplicates, but is not automatically a Civil Registrar", () => {
    expect(CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR).toContain(CRVS_PERMISSIONS.EXCEPTION_RESOLVE);
    expect(CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR).toContain(CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE);
    expect(CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR).not.toContain(CRVS_PERMISSIONS.REGISTRATION_APPROVE);

    seedSession({
      _id: "crvs.supervisor@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_SUPERVISOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EXCEPTION_RESOLVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)).toBe(false);
  });

  it("SUPERADMIN alone does not grant CRVS registration-approval authority", () => {
    seedSession({
      _id: "admin@demo.identity.local",
      accessRole: { value: "SUPERADMIN" },
      permissions: [],
      assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }],
    });
    expect(getAssignmentForWorkspace("CRVS")).toBeUndefined();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)).toBe(false);
  });

  it("SDID-only staff cannot access CRVS routes", () => {
    seedSession({
      _id: "officer@demo.identity.local",
      assignments: [{ workspace: "SDID", role: "enrolmentOfficer", permissions: [] }],
    });
    expect(hasWorkspace("CRVS")).toBe(false);
  });
});
