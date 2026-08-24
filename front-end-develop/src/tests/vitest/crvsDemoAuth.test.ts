import { describe, expect, it } from "vitest";
import {
  demoCredentials,
  crvsDemoCredentials,
  dualWorkspaceDemoCredential,
  allStaffDemoCredentials,
  findDemoCredential,
} from "@/demo/credentials";
import { buildDemoSession } from "@/demo/session";

describe("Existing SDID demo credentials are untouched", () => {
  it("still documents exactly the four spec roles", () => {
    const roles = demoCredentials.map((c) => c.role).sort();
    expect(roles).toEqual(
      ["administrator", "enrolment_officer", "reviewer", "supervisor"].sort()
    );
  });

  it("existing SDID demo accounts still authenticate", () => {
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    expect(findDemoCredential(admin.email, admin.password)?.role).toBe("administrator");
  });
});

describe("CRVS demo credentials", () => {
  it("documents exactly the eight CRVS roles (five birth-era plus three death-workflow roles), plus one dual-workspace account", () => {
    expect(crvsDemoCredentials).toHaveLength(8);
    expect(crvsDemoCredentials.every((c) => c.workspaces.length === 1 && c.workspaces[0] === "CRVS")).toBe(
      true
    );
    expect(dualWorkspaceDemoCredential.workspaces.sort()).toEqual(["CRVS", "SDID"]);
  });

  it("uses only the fictional @demo.identity.local domain", () => {
    [...crvsDemoCredentials, dualWorkspaceDemoCredential].forEach((c) => {
      expect(c.email.endsWith("@demo.identity.local")).toBe(true);
    });
  });

  it("is discoverable through the combined findDemoCredential lookup", () => {
    const registrar = crvsDemoCredentials.find((c) => c.role === "CIVIL_REGISTRAR")!;
    expect(findDemoCredential(registrar.email, registrar.password)?.role).toBe(
      "CIVIL_REGISTRAR"
    );
    expect(
      findDemoCredential(dualWorkspaceDemoCredential.email, dualWorkspaceDemoCredential.password)
        ?.role
    ).toBe("dual_workspace");
  });

  it("allStaffDemoCredentials is the union of all three groups", () => {
    expect(allStaffDemoCredentials).toHaveLength(
      demoCredentials.length + crvsDemoCredentials.length + 1
    );
  });
});

describe("Demo session assignments", () => {
  it("gives a CRVS demo account only a CRVS assignment, no SDID access", () => {
    const officer = crvsDemoCredentials.find((c) => c.role === "CRVS_REGISTRATION_OFFICER")!;
    const session = buildDemoSession(officer);

    expect(session.account?.assignments).toEqual([
      expect.objectContaining({ workspace: "CRVS", role: "CRVS_REGISTRATION_OFFICER" }),
    ]);
    expect(session.account?.permissions).toEqual([]);
  });

  it("gives the dual-workspace demo account both an SDID and a CRVS assignment", () => {
    const session = buildDemoSession(dualWorkspaceDemoCredential);
    const workspaces = session.account?.assignments?.map((a: any) => a.workspace).sort();

    expect(workspaces).toEqual(["CRVS", "SDID"]);
    // Legacy shape still populated for the SDID half, so existing
    // defineAccess()-based checks work if they land on an SDID screen.
    expect(session.account?.accessRole?.value).toBe("supervisor");
  });

  it("does not grant the dual-workspace demo account Civil Registrar approval authority", () => {
    // Holding both workspaces must not imply registration-approval rights —
    // that requires an explicit Civil Registrar assignment (spec §20).
    const session = buildDemoSession(dualWorkspaceDemoCredential);
    const crvsAssignment = session.account?.assignments?.find((a: any) => a.workspace === "CRVS");

    expect(crvsAssignment?.role).toBe("CRVS_REGISTRATION_OFFICER");
    expect(crvsAssignment?.permissions).not.toContain("crvs.registration.approve");
    expect(crvsAssignment?.permissions).not.toContain("crvs.registration.reject");
  });

  it("still grants the administrator demo role full (superAdmin) access", () => {
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    const session = buildDemoSession(admin);
    expect(session.account?.accessRole?.value).toBe("superAdmin");
    expect(session.account?.assignments).toEqual([
      expect.objectContaining({ workspace: "SDID", role: "superAdmin" }),
    ]);
  });
});
