import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission, hasWorkspace, getAssignmentForWorkspace } from "@/utils/workspace";
import { canApproveDivorceCase, canAccessDivorceCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { DivorceRegistration } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseRegistration: Pick<DivorceRegistration, "officerId" | "applicant" | "formerSpouse1" | "formerSpouse2" | "jurisdiction" | "correctionRequests" | "exception"> = {
  officerId: "divorce.officer@demo.identity.local",
  applicant: { documentType: "NATIONAL_ID", relationshipToCase: "FORMER_SPOUSE_1", identityVerification: "VERIFIED" },
  formerSpouse1: { spouseKey: "SPOUSE1", sex: "FEMALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
  formerSpouse2: { spouseKey: "SPOUSE2", sex: "MALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
  jurisdiction: "Demo District",
  correctionRequests: [],
};

describe("Divorce permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("a Divorce Registration Officer cannot review, approve, reject, or register", () => {
    seedSession({
      _id: "divorce.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "DIVORCE_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.DIVORCE_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_SUBMIT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REJECT)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REGISTER)).toBe(false);
  });

  it("a Civil Registrar has review/approve/reject/register authority", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REJECT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REGISTER)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_JUDGMENT_VERIFY)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW)).toBe(true);
  });

  it("a CRVS Auditor is read-only for divorce: no create/edit/approve authority", () => {
    seedSession({ _id: "crvs.auditor@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_AUDITOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_AUDITOR }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE)).toBe(false);
  });

  it("a CRVS Records Officer can only view registered divorces and request certificates", () => {
    seedSession({ _id: "crvs.records@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_RECORDS_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.CRVS_RECORDS_OFFICER }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CERTIFICATE_REQUEST)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW)).toBe(false);
  });

  it("a Court Notification Officer can only create/view/submit divorce notifications", () => {
    seedSession({ _id: "court.notifier@demo.identity.local", assignments: [{ workspace: "CRVS", role: "COURT_NOTIFICATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.COURT_NOTIFICATION_OFFICER }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_CREATE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_SUBMIT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VALIDATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW)).toBe(false);
  });

  it("a CRVS Supervisor has exception/foreign-review/reassignment/sync-retry authority but not routine approval", () => {
    seedSession({ _id: "crvs.supervisor@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_SUPERVISOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CASE_REASSIGN)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_RETRY)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(false);
  });

  it("a Civil Registrar cannot approve a registration they prepared themselves (maker-checker)", () => {
    const result = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, officerId: "registrar@demo.identity.local" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/prepared this divorce registration/i);
  });

  it("a Civil Registrar cannot approve where they are the applicant or either former spouse", () => {
    const asApplicant = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, applicant: { ...baseRegistration.applicant, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asApplicant.allowed).toBe(false);
    expect(asApplicant.reasons.join(" ")).toMatch(/applicant/i);

    const asSpouse1 = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, formerSpouse1: { ...baseRegistration.formerSpouse1, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asSpouse1.allowed).toBe(false);
    expect(asSpouse1.reasons.join(" ")).toMatch(/former spouse 1/i);

    const asSpouse2 = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, formerSpouse2: { ...baseRegistration.formerSpouse2, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asSpouse2.allowed).toBe(false);
    expect(asSpouse2.reasons.join(" ")).toMatch(/former spouse 2/i);
  });

  it("a Civil Registrar cannot approve outside their assigned jurisdiction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(canAccessDivorceCaseJurisdiction("Other District")).toBe(false);
    const result = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, jurisdiction: "Other District" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/jurisdiction/i);
  });

  it("a Civil Registrar cannot approve while a correction request is open", () => {
    const result = canApproveDivorceCase("registrar@demo.identity.local", {
      ...baseRegistration,
      correctionRequests: [{ id: "c1", requestedBy: "x", requestedAt: new Date().toISOString(), items: [], notifyApplicants: false, responseToken: "tok" }],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/pending correction/i);
  });

  it("a Civil Registrar cannot approve while an exception is open", () => {
    const result = canApproveDivorceCase("registrar@demo.identity.local", { ...baseRegistration, exception: { type: "JUDGMENT_NOT_FINAL", reason: "test", status: "OPEN" } });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/open exception/i);
  });

  it("a Civil Registrar can approve an unrelated, in-jurisdiction registration with no open issues", () => {
    const result = canApproveDivorceCase("registrar@demo.identity.local", baseRegistration);
    expect(result.allowed).toBe(true);
  });

  it("SUPERADMIN alone does not grant CRVS divorce-approval authority", () => {
    seedSession({ _id: "admin@demo.identity.local", accessRole: { value: "SUPERADMIN" }, permissions: [], assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }] });
    expect(getAssignmentForWorkspace("CRVS")).toBeUndefined();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_APPROVE)).toBe(false);
  });

  it("SDID-only staff cannot access CRVS divorce routes", () => {
    seedSession({ _id: "officer@demo.identity.local", assignments: [{ workspace: "SDID", role: "enrolmentOfficer", permissions: [] }] });
    expect(hasWorkspace("CRVS")).toBe(false);
  });
});
