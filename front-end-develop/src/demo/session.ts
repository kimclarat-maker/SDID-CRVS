import { setStorage } from "@/utils/storage";
import { UserType } from "@/types/User";
import { DemoCredential } from "./credentials";
import { DEMO_STORAGE_PREFIX } from "./config";
import { DemoAccount, DemoRole } from "./types";
import { getDemoData } from "./storage/demoStore";
import { StaffAssignment } from "@/types/Workspace";
import { CRVS_ROLES, CRVS_ROLE_PERMISSIONS, CrvsRole } from "@/constants/crvsRoles";

const base64Url = (obj: unknown) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// A JWT-shaped (but unsigned) token so the app's existing isTokenExpired()
// (jwt-decode) and RequireAuth guard work unmodified. Never accepted by a
// real backend — there is no valid signature, only a "demo" marker segment.
const createDemoToken = (email: string, hoursValid = 8) => {
  const header = base64Url({ alg: "none", typ: "JWT" });
  const payload = base64Url({
    demo: true,
    user: email,
    exp: Math.floor(Date.now() / 1000) + hoursValid * 3600,
  });
  return `${header}.${payload}.demo`;
};

const ROLE_PERMISSIONS: Record<DemoRole, string[]> = {
  administrator: [
    "get_reports",
    "get_enrollment",
    "post_enrollment",
    "patch_enrollment",
    "get_schedule",
    "post_schedule",
    "patch_schedule",
    "get_notifications",
    "get_centers",
    "post_centers",
    "get_account",
    "post_account",
    "patch_account",
    "get_supportingdocuments",
    "get_deviceManagement",
    "post_deviceManagement",
    "get_geography",
    "get_logs",
  ],
  enrolment_officer: [
    "get_reports",
    "get_enrollment",
    "post_enrollment",
    "patch_enrollment",
    "get_schedule",
    "post_schedule",
    "patch_schedule",
    "get_notifications",
    "get_supportingdocuments",
    "post_supportingdocuments",
  ],
  reviewer: [
    "get_reports",
    "get_enrollment",
    "patch_enrollment",
    "get_notifications",
  ],
  supervisor: [
    "get_reports",
    "get_enrollment",
    "get_schedule",
    "get_notifications",
    "get_centers",
    "get_account",
    "get_deviceManagement",
    "get_geography",
    "get_logs",
  ],
};

const ROLE_ACCESS_VALUE: Record<DemoRole, string> = {
  administrator: "superAdmin",
  enrolment_officer: "enrolmentOfficer",
  reviewer: "reviewer",
  supervisor: "supervisor",
};

const isCrvsRole = (role: DemoCredential["role"]): role is CrvsRole =>
  (Object.values(CRVS_ROLES) as string[]).includes(role as string);

// Fictional facility/jurisdiction shared by the CRVS demo accounts — this
// milestone doesn't wire CRVS staff to real geography data yet.
const DEMO_CRVS_FACILITY = {
  facilityId: "FAC-DEMO-01",
  jurisdiction: {
    level: "DISTRICT" as const,
    id: "dist-demo-01",
    name: "Demo District",
  },
};

const buildAssignments = (
  credential: DemoCredential,
  account?: DemoAccount
): StaffAssignment[] => {
  if (credential.role === "dual_workspace" && credential.dualRoles) {
    const { sdid, crvs } = credential.dualRoles;
    return [
      {
        workspace: "SDID",
        role: ROLE_ACCESS_VALUE[sdid],
        permissions: ROLE_PERMISSIONS[sdid],
        centerId: account?.centerId,
      },
      {
        workspace: "CRVS",
        role: crvs,
        permissions: CRVS_ROLE_PERMISSIONS[crvs],
        ...DEMO_CRVS_FACILITY,
      },
    ];
  }

  if (isCrvsRole(credential.role)) {
    return [
      {
        workspace: "CRVS",
        role: credential.role,
        permissions: CRVS_ROLE_PERMISSIONS[credential.role],
        ...DEMO_CRVS_FACILITY,
      },
    ];
  }

  const sdidRole = credential.role as DemoRole;
  return [
    {
      workspace: "SDID",
      role: ROLE_ACCESS_VALUE[sdidRole],
      permissions: ROLE_PERMISSIONS[sdidRole],
      centerId: account?.centerId,
    },
  ];
};

const findAccountForCredential = (
  credential: DemoCredential
): DemoAccount | undefined =>
  getDemoData().accounts.find(
    (a) => a.email.toLowerCase() === credential.email.toLowerCase()
  );

export const buildDemoSession = (credential: DemoCredential): UserType => {
  // Only the 4 original SDID demo credentials exist in the seeded
  // DemoDatabase (src/demo/seed/accounts.ts) — CRVS/dual accounts fall back
  // to the credential's own fields below, same as this already did before.
  const account = findAccountForCredential(credential);
  const token = createDemoToken(credential.email);
  const assignments = buildAssignments(credential, account);
  const sdidAssignment = assignments.find((a) => a.workspace === "SDID");

  return {
    email: credential.email,
    firstName: account?.firstName || credential.roleLabel,
    lastName: account?.lastName || "Demo",
    token,
    photo: "",
    accountType: credential.role,
    phoneNumber: account?.phoneNumber,
    account: {
      // CRVS/dual credentials aren't in the seeded SDID DemoDatabase, so
      // they have no account.id — fall back to their (unique, stable)
      // email so per-account identity still works, e.g. for the "can't
      // approve your own case" rule in the CRVS demo queues.
      _id: account?.id || credential.email,
      firstName: account?.firstName || credential.roleLabel,
      lastName: account?.lastName || "Demo",
      email: credential.email,
      phoneNumber: account?.phoneNumber,
      centerId: account?.centerId,
      // Legacy shape kept exactly as before for SDID roles, so every
      // existing defineAccess()/sidebar check keeps working unmodified.
      // CRVS-only accounts get a non-superAdmin placeholder here (they have
      // no SDID assignment, so route/permission guards never let them near
      // SDID screens regardless of this value).
      accessRole: sdidAssignment
        ? {
            _id: `role-${sdidAssignment.role}`,
            name: credential.roleLabel,
            value: sdidAssignment.role,
          }
        : { _id: `role-${credential.role}`, name: credential.roleLabel, value: credential.role },
      permissions: sdidAssignment?.permissions || [],
      status: "active",
      language: "en",
      isDemo: true,
      assignments,
    },
  } as UserType;
};

// Writes into the SAME storage the real login flow uses, so every existing
// guard/permission check (RequireAuth, defineAccess, Navbar, Sidebar) works
// against a demo session without modification. The `isDemo` flag above and
// the "demo." token marker keep it distinguishable and unusable against a
// real backend.
export const startDemoSession = async (credential: DemoCredential) => {
  const session = buildDemoSession(credential);
  await setStorage(session);
  sessionStorage.setItem(
    `${DEMO_STORAGE_PREFIX}-session`,
    JSON.stringify({ role: credential.role, loggedInAt: new Date().toISOString() })
  );
  return session;
};

export const endDemoSession = () => {
  sessionStorage.removeItem(`${DEMO_STORAGE_PREFIX}-session`);
};

export const isDemoSessionActive = (): boolean =>
  typeof window !== "undefined" &&
  !!sessionStorage.getItem(`${DEMO_STORAGE_PREFIX}-session`);
