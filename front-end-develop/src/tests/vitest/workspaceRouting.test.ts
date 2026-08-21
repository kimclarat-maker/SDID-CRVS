import { afterEach, describe, expect, it } from "vitest";
import { cfg } from "@/constants/cfg";
import {
  canAccessJurisdiction,
  getActiveAssignment,
  getStaffAssignments,
  getWorkspaces,
  hasAnyPermission,
  hasPermission,
  hasWorkspace,
  hasWorkspacePermission,
  resolvePostLoginRoute,
  setActiveWorkspace,
  shouldShowWorkspaceSelector,
  workspaceHomePath,
} from "@/utils/workspace";

const STORAGE_KEY = cfg.VITE_APP_NAME as string;

function seedSession(account: any) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "t", account }));
}

describe("Workspace assignment compatibility adapter", () => {
  afterEach(() => sessionStorage.clear());

  it("returns no assignments when there is no session", () => {
    expect(getStaffAssignments()).toEqual([]);
  });

  it("treats a legacy account (no assignments field) as SDID staff", () => {
    seedSession({
      accessRole: { value: "enrolmentOfficer" },
      permissions: ["get_enrollment"],
      centerId: "center-1",
    });

    const assignments = getStaffAssignments();
    expect(assignments).toEqual([
      {
        workspace: "SDID",
        role: "enrolmentOfficer",
        permissions: ["get_enrollment"],
        centerId: "center-1",
        status: "active",
      },
    ]);
    expect(hasWorkspace("SDID")).toBe(true);
    expect(hasWorkspace("CRVS")).toBe(false);
  });

  it("filters out an inactive assignment", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: [], status: "inactive" },
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [], status: "active" },
      ],
    });

    expect(getWorkspaces()).toEqual(["CRVS"]);
    expect(hasWorkspace("SDID")).toBe(false);
  });

  it("sends a staff member whose only assignment is inactive to access-denied", () => {
    seedSession({
      assignments: [{ workspace: "SDID", role: "supervisor", permissions: [], status: "inactive" }],
    });

    expect(getStaffAssignments()).toEqual([]);
    expect(resolvePostLoginRoute()).toBe("/dashboard/access-denied");
  });

  it("uses the explicit assignments array when present", () => {
    seedSession({
      accessRole: { value: "irrelevant" },
      permissions: [],
      assignments: [
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: ["crvs.registration.approve"] },
      ],
    });

    expect(getWorkspaces()).toEqual(["CRVS"]);
    expect(hasWorkspace("SDID")).toBe(false);
  });
});

describe("hasWorkspacePermission", () => {
  afterEach(() => sessionStorage.clear());

  it("grants a legacy SUPERADMIN every SDID permission via the existing bypass", () => {
    seedSession({ accessRole: { value: "SUPERADMIN" }, permissions: [] });
    expect(hasWorkspacePermission("SDID", "post_account")).toBe(true);
  });

  it("does NOT extend the SUPERADMIN bypass to CRVS", () => {
    seedSession({ accessRole: { value: "SUPERADMIN" }, permissions: [] });
    expect(hasWorkspace("CRVS")).toBe(false);
    expect(hasWorkspacePermission("CRVS", "crvs.registration.approve")).toBe(false);
  });

  it("checks explicit permissions for a named CRVS assignment", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CRVS_REGISTRATION_OFFICER",
          permissions: ["crvs.birth_draft.create"],
        },
      ],
    });
    expect(hasWorkspacePermission("CRVS", "crvs.birth_draft.create")).toBe(true);
    expect(hasWorkspacePermission("CRVS", "crvs.registration.approve")).toBe(false);
  });
});

describe("resolvePostLoginRoute / shouldShowWorkspaceSelector", () => {
  afterEach(() => sessionStorage.clear());

  it("sends a visitor with no session at all to access-denied", () => {
    expect(resolvePostLoginRoute()).toBe("/dashboard/access-denied");
  });

  it("sends an SDID-only staff member to /dashboard/sdid", () => {
    seedSession({ accessRole: { value: "enrolmentOfficer" }, permissions: [] });
    expect(resolvePostLoginRoute()).toBe(workspaceHomePath("SDID"));
    expect(resolvePostLoginRoute()).toBe("/dashboard/sdid");
    expect(shouldShowWorkspaceSelector()).toBe(false);
  });

  it("sends a CRVS-only staff member to /dashboard/crvs", () => {
    seedSession({
      assignments: [{ workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [] }],
    });
    expect(resolvePostLoginRoute()).toBe("/dashboard/crvs");
    expect(shouldShowWorkspaceSelector()).toBe(false);
  });

  it("sends a dual-workspace staff member to the workspace selector", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: [] },
        { workspace: "CRVS", role: "CIVIL_REGISTRAR", permissions: [] },
      ],
    });
    expect(resolvePostLoginRoute()).toBe("/dashboard/workspaces");
    expect(shouldShowWorkspaceSelector()).toBe(true);
  });
});

describe("hasPermission / hasAnyPermission / getActiveAssignment", () => {
  afterEach(() => sessionStorage.clear());

  it("hasPermission checks across every current assignment, not just the active workspace", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: ["get_reports"] },
        { workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: ["crvs.birth_draft.create"] },
      ],
    });

    expect(hasPermission("get_reports")).toBe(true);
    expect(hasPermission("crvs.birth_draft.create")).toBe(true);
    expect(hasPermission("crvs.registration.approve")).toBe(false);
    expect(hasAnyPermission(["crvs.registration.approve", "crvs.birth_draft.create"])).toBe(true);
  });

  it("does not let the SDID SUPERADMIN bypass leak into hasPermission for CRVS", () => {
    seedSession({ accessRole: { value: "SUPERADMIN" }, permissions: [] });
    expect(hasPermission("crvs.registration.approve")).toBe(false);
  });

  it("getActiveAssignment reflects the active workspace, not just the first assignment", () => {
    seedSession({
      assignments: [
        { workspace: "SDID", role: "supervisor", permissions: [] },
        { workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER", permissions: [] },
      ],
    });

    setActiveWorkspace("CRVS");
    expect(getActiveAssignment()?.workspace).toBe("CRVS");

    setActiveWorkspace("SDID");
    expect(getActiveAssignment()?.workspace).toBe("SDID");
  });
});

describe("canAccessJurisdiction", () => {
  afterEach(() => sessionStorage.clear());

  it("denies access when the assignment has no jurisdiction on record", () => {
    seedSession({
      assignments: [{ workspace: "CRVS", role: "CRVS_SUPERVISOR", permissions: [] }],
    });
    expect(canAccessJurisdiction("CRVS", { level: "DISTRICT", id: "dist-1" })).toBe(false);
  });

  it("a NATIONAL-level assignment covers any target jurisdiction", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CRVS_SUPERVISOR",
          permissions: [],
          jurisdiction: { level: "NATIONAL", id: "rw" },
        },
      ],
    });
    expect(canAccessJurisdiction("CRVS", { level: "DISTRICT", id: "dist-1" })).toBe(true);
  });

  it("a DISTRICT-level assignment only covers its own district", () => {
    seedSession({
      assignments: [
        {
          workspace: "CRVS",
          role: "CIVIL_REGISTRAR",
          permissions: [],
          jurisdiction: { level: "DISTRICT", id: "dist-1" },
        },
      ],
    });
    expect(canAccessJurisdiction("CRVS", { level: "DISTRICT", id: "dist-1" })).toBe(true);
    expect(canAccessJurisdiction("CRVS", { level: "DISTRICT", id: "dist-2" })).toBe(false);
  });
});
