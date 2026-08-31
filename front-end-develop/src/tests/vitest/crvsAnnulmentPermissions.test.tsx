import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import { hasWorkspacePermission, hasWorkspace, getAssignmentForWorkspace } from "@/utils/workspace";
import { canApproveAnnulmentCase, canAccessAnnulmentCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { CRVS_PERMISSIONS, CRVS_ROLE_PERMISSIONS } from "@/constants/crvsRoles";
import { AnnulmentRegistration } from "@/domain/crvs/types";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

const baseRegistration: Pick<
  AnnulmentRegistration,
  "officerId" | "applicant" | "affectedParty1" | "affectedParty2" | "jurisdiction" | "correctionRequests" | "exception" | "legalEffect"
> = {
  officerId: "annulment.officer@demo.identity.local",
  applicant: { documentType: "NATIONAL_ID", relationshipToMarriage: "PARTY_1", relationshipToCase: "AFFECTED_PARTY_1", identityVerification: "VERIFIED" },
  affectedParty1: { partyKey: "PARTY_1", sex: "FEMALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
  affectedParty2: { partyKey: "PARTY_2", sex: "MALE", identityMatchConfidence: "CONFIRMED", identityVerification: "VERIFIED", linkedToSelectedMarriage: true },
  jurisdiction: "Demo District",
  correctionRequests: [],
  legalEffect: {
    marriageStatusResult: "REQUIRES_MANUAL_REVIEW",
    proposedSdid: {
      party1: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
      party2: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
    },
    relationshipHistoryTreatment: "MARK_ANNULLED_PRESERVE_HISTORY",
    certificateConsequence: "MANUAL_REVIEW",
    downstreamChangesExplicitlyExcluded: [],
    classificationHistory: [],
    confirmedClassification: "ANNULLED_FROM_DECISION_DATE",
  },
};

describe("Annulment permission matrix", () => {
  afterEach(() => sessionStorage.clear());

  it("an Annulment Registration Officer can create/submit but cannot review, approve, reject, register, or classify legal effect", () => {
    seedSession({
      _id: "annulment.officer@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "ANNULMENT_REGISTRATION_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.ANNULMENT_REGISTRATION_OFFICER }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_SUBMIT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REJECT)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REGISTER)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY)).toBe(false);
  });

  it("a Civil Registrar has review/approve/reject/register/classify authority", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REJECT)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REGISTER)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_ORDER_VERIFY)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY)).toBe(true);
  });

  it("a CRVS Supervisor has reassignment/exception-resolution/sync-retry authority but not routine drafting", () => {
    seedSession({ _id: "crvs.supervisor@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_SUPERVISOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_SUPERVISOR }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_EXCEPTION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_CASE_REASSIGN)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_DUPLICATE_RESOLVE)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_SDID_SYNC_RETRY)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_FOREIGN_DECISION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
  });

  it("a Foreign Decision Reviewer can view and review foreign decisions only, with no approval/registration/legal-effect authority", () => {
    seedSession({ _id: "foreign.reviewer@demo.identity.local", assignments: [{ workspace: "CRVS", role: "FOREIGN_DECISION_REVIEWER", permissions: CRVS_ROLE_PERMISSIONS.FOREIGN_DECISION_REVIEWER }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_FOREIGN_DECISION_REVIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REGISTER)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_LEGAL_EFFECT_CLASSIFY)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_CASE_REASSIGN)).toBe(false);
  });

  it("a CRVS Records Officer can only view registered annulments and request the record/certificate", () => {
    seedSession({ _id: "crvs.records@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_RECORDS_OFFICER", permissions: CRVS_ROLE_PERMISSIONS.CRVS_RECORDS_OFFICER }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTERED_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_RECORD_REQUEST)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_CERTIFICATE_REQUEST)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REVIEW)).toBe(false);
  });

  it("a CRVS Auditor is read-only for annulment, including restricted-document visibility, with no create/edit/approve authority", () => {
    seedSession({ _id: "crvs.auditor@demo.identity.local", assignments: [{ workspace: "CRVS", role: "CRVS_AUDITOR", permissions: CRVS_ROLE_PERMISSIONS.CRVS_AUDITOR }] });
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTERED_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_AUDIT_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_RESTRICTED_DOCUMENTS_VIEW)).toBe(true);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_CREATE)).toBe(false);
  });

  it("a generic administrator role carries no ANNULMENT_* approve/register permission (spec §4)", () => {
    const platformAdminPermissions: readonly string[] = CRVS_ROLE_PERMISSIONS.PLATFORM_ADMINISTRATOR;
    expect(platformAdminPermissions.some((p) => p.startsWith("crvs.annulment"))).toBe(false);
    expect(platformAdminPermissions).not.toContain(CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE);
    expect(platformAdminPermissions).not.toContain(CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_REGISTER);
  });

  it("a Civil Registrar cannot approve a registration they prepared themselves (maker-checker)", () => {
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, officerId: "registrar@demo.identity.local" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/prepared this annulment registration/i);
  });

  it("a Civil Registrar cannot approve where they are the applicant or either affected party", () => {
    const asApplicant = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, applicant: { ...baseRegistration.applicant, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asApplicant.allowed).toBe(false);
    expect(asApplicant.reasons.join(" ")).toMatch(/applicant/i);

    const asParty1 = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, affectedParty1: { ...baseRegistration.affectedParty1, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asParty1.allowed).toBe(false);
    expect(asParty1.reasons.join(" ")).toMatch(/first affected party/i);

    const asParty2 = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, affectedParty2: { ...baseRegistration.affectedParty2, sdidIdentityId: "registrar@demo.identity.local" } });
    expect(asParty2.allowed).toBe(false);
    expect(asParty2.reasons.join(" ")).toMatch(/second affected party/i);
  });

  it("a Civil Registrar cannot approve outside their assigned jurisdiction", () => {
    seedSession({
      _id: "registrar@demo.identity.local",
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: CRVS_ROLE_PERMISSIONS.CIVIL_REGISTRAR, jurisdiction: { level: "DISTRICT", id: "dist-demo-01", name: "Demo District" } }],
    });
    expect(canAccessAnnulmentCaseJurisdiction("Other District")).toBe(false);
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, jurisdiction: "Other District" });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/jurisdiction/i);
  });

  it("a Civil Registrar cannot approve while a correction or evidence request is open", () => {
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", {
      ...baseRegistration,
      correctionRequests: [{ id: "c1", requestType: "CORRECTION", requestedBy: "x", requestedAt: new Date().toISOString(), items: [], notifyApplicants: false, responseToken: "tok" }],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/pending correction/i);
  });

  it("a Civil Registrar cannot approve while an exception is open", () => {
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", { ...baseRegistration, exception: { type: "DECISION_NOT_FINAL", reason: "test", status: "OPEN" } });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/open exception/i);
  });

  it("a Civil Registrar cannot approve while the legal-effect classification is unresolved (annulment-specific — no divorce equivalent)", () => {
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", {
      ...baseRegistration,
      legalEffect: { ...baseRegistration.legalEffect, confirmedClassification: undefined },
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/legal-effect classification/i);
  });

  it("a Civil Registrar can approve an unrelated, in-jurisdiction registration with no open issues and a confirmed legal-effect classification", () => {
    const result = canApproveAnnulmentCase("registrar@demo.identity.local", baseRegistration);
    expect(result.allowed).toBe(true);
  });

  it("SUPERADMIN alone does not grant CRVS annulment-approval authority", () => {
    seedSession({ _id: "admin@demo.identity.local", accessRole: { value: "SUPERADMIN" }, permissions: [], assignments: [{ workspace: "SDID", role: "superAdmin", permissions: [] }] });
    expect(getAssignmentForWorkspace("CRVS")).toBeUndefined();
    expect(hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_REGISTRATION_APPROVE)).toBe(false);
  });

  it("SDID-only staff cannot access CRVS annulment routes", () => {
    seedSession({ _id: "officer@demo.identity.local", assignments: [{ workspace: "SDID", role: "enrolmentOfficer", permissions: [] }] });
    expect(hasWorkspace("CRVS")).toBe(false);
  });
});
