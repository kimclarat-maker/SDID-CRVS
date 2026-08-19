import { describe, expect, it } from "vitest";
import { demoCredentials, findDemoCredential } from "@/demo/credentials";
import { buildDemoSession } from "@/demo/session";

describe("Demo credentials", () => {
  it("documents exactly the four spec roles", () => {
    const roles = demoCredentials.map((c) => c.role).sort();
    expect(roles).toEqual(
      ["administrator", "enrolment_officer", "reviewer", "supervisor"].sort()
    );
  });

  it("uses only the fictional @demo.identity.local domain", () => {
    demoCredentials.forEach((c) => {
      expect(c.email.endsWith("@demo.identity.local")).toBe(true);
    });
  });

  it("matches a valid email/password pair", () => {
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    const found = findDemoCredential(admin.email, admin.password);
    expect(found?.role).toBe("administrator");
  });

  it("is case-insensitive on email but exact on password", () => {
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    expect(
      findDemoCredential(admin.email.toUpperCase(), admin.password)
    ).toBeTruthy();
    expect(findDemoCredential(admin.email, "WrongPassword")).toBeUndefined();
  });

  it("rejects credentials that don't match any demo account", () => {
    expect(
      findDemoCredential("nobody@demo.identity.local", "whatever")
    ).toBeUndefined();
  });
});

describe("Demo session building", () => {
  it("builds a session with a demo-marked, JWT-shaped token", () => {
    const credential = demoCredentials[0];
    const session = buildDemoSession(credential);

    expect(session.token?.split(".")).toHaveLength(3);
    expect(session.account?.isDemo).toBe(true);
    expect(session.email).toBe(credential.email);
  });

  it("grants the administrator role full (superAdmin) access", () => {
    const admin = demoCredentials.find((c) => c.role === "administrator")!;
    const session = buildDemoSession(admin);
    expect(session.account?.accessRole?.value).toBe("superAdmin");
  });

  it("scopes non-administrator roles to a role-specific permission set", () => {
    const reviewer = demoCredentials.find((c) => c.role === "reviewer")!;
    const session = buildDemoSession(reviewer);
    expect(session.account?.accessRole?.value).not.toBe("superAdmin");
    expect(session.account?.permissions).toContain("patch_enrollment");
    expect(session.account?.permissions).not.toContain("post_account");
  });
});
