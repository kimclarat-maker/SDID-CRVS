import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission, hasWorkspace, getAssignmentForWorkspace } from "@/utils/workspace";
import { canApproveDeathCase, canAccessDeathCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { DeathRegistrationCase } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseCase: Pick<DeathRegistrationCase, "officerId" | "declarant" | "nextOfKin" | "witnesses" | "jurisdiction" | "correctionRequests"> = {
  officerId: "crvs.officer@demo.identity.local",
  declarant: {
    relationship: "Spouse",
    documentType: "NATIONAL_ID",
    firstName: "Test",
    lastName: "Declarant",
    verification: "VERIFIED",
  },
  nextOfKin: [],
  witnesses: [],
  jurisdiction: "Demo District",
  correctionRequests: [],
};

describe("Death permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("a Death Notification Officer cannot create or edit death registrations", () => {
    seedSession({
      _id: "death.notifier@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "DEATH_NOTIFICATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.DEATH_NOTIFICATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE)).toBe(true);
  });

  it("a Medical Certifier can view/edit cause of death but has no registration or approval authority", () => {
    seedSession({
      _id: "medical.certifier@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "MEDICAL_CERTIFIER", permissions: CRVS_ROLE_PERMISSIONS.MEDICAL_CERTIFIER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_EDIT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE)).toBe(false);
  });

  it("a CRVS Auditor is read-only: no cause-of-death visibility, no create/edit/approve", () => {
    seedSession({
      _id: "crvs.auditor@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_AUDITOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_AUDITOR }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_VIEW)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE)).toBe(false);
  });

  it("a CRVS Registration Officer cannot approve death registrations", () => {
    seedSession({
      _id: "crvs.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.CRVS_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE)).toBe(true);
  });

  it("a Civil Registrar cannot approve a death case they created themselves (maker-checker)", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    const result = canApproveDeathCase("registrar@demo.identity.local", { ...baseCase, officerId: "registrar@demo.identity.local" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/created this case/i);
  });

  it("a Civil Registrar cannot approve a death case where they are next of kin or a witness", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    const asKin = canApproveDeathCase("registrar@demo.identity.local", {
      ...baseCase,
      nextOfKin: [{ relationship: "Spouse", firstName: "R", lastName: "Registrar", verification: "VERIFIED", sdidIdentityId: "registrar@demo.identity.local" }],
    });
    expect(asKin.allowed).toBe(false);
    expect(asKin.reasons.join(" ")).toMatch(/next of kin/i);

    const asWitness = canApproveDeathCase("registrar@demo.identity.local", {
      ...baseCase,
      witnesses: [{ id: "w1", relationship: "Neighbour", documentType: "NONE", firstName: "R", lastName: "Registrar", verification: "VERIFIED", sdidIdentityId: "registrar@demo.identity.local" }],
    });
    expect(asWitness.allowed).toBe(false);
    expect(asWitness.reasons.join(" ")).toMatch(/witness/i);
  });

  it("a Civil Registrar cannot approve a death case outside their assigned jurisdiction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(canAccessDeathCaseJurisdiction("Other District")).toBe(false);
    const result = canApproveDeathCase("registrar@demo.identity.local", { ...baseCase, jurisdiction: "Other District" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/jurisdiction/i);
  });

  it("a Civil Registrar cannot approve while a correction request is still open", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    const result = canApproveDeathCase("registrar@demo.identity.local", {
      ...baseCase,
      correctionRequests: [{ id: "c1", requestedBy: "x", requestedAt: new Date().toISOString(), items: [], notifyOfficer: false, responseToken: "tok" }],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/pending correction/i);
  });

  it("a Civil Registrar can approve an unrelated, in-jurisdiction death case with no open correction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    const result = canApproveDeathCase("registrar@demo.identity.local", baseCase);
    expect(result.allowed).toBe(true);
  });

  it("SUPERADMIN alone does not grant CRVS death-approval authority", () => {
    seedSession({
      _id: "admin@demo.identity.local",
      accessRole: { value: "SUPERADMIN" },
      permissions: [],
      assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }],
    });
    expect(getAssignmentForWorkspace("CRVS")).toBeUndefined();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE)).toBe(false);
  });

  it("SDID-only staff cannot access CRVS death routes", () => {
    seedSession({
      _id: "officer@demo.identity.local",
      assignments: [{ workspace: "SDID", role: "enrolmentOfficer", permissions: [] }],
    });
    expect(hasWorkspace("CRVS")).toBe(false);
  });
});
