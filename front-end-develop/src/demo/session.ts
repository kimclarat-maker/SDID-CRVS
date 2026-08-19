import { setStorage } from "@/utils/storage";
import { UserType } from "@/types/User";
import { DemoCredential } from "./credentials";
import { DEMO_STORAGE_PREFIX } from "./config";
import { DemoAccount, DemoRole } from "./types";
import { getDemoData } from "./storage/demoStore";

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

const findAccountForCredential = (
  credential: DemoCredential
): DemoAccount | undefined =>
  getDemoData().accounts.find(
    (a) => a.email.toLowerCase() === credential.email.toLowerCase()
  );

export const buildDemoSession = (credential: DemoCredential): UserType => {
  const account = findAccountForCredential(credential);
  const token = createDemoToken(credential.email);

  return {
    email: credential.email,
    firstName: account?.firstName || credential.roleLabel,
    lastName: account?.lastName || "Demo",
    token,
    photo: "",
    accountType: credential.role,
    phoneNumber: account?.phoneNumber,
    account: {
      _id: account?.id,
      firstName: account?.firstName || credential.roleLabel,
      lastName: account?.lastName || "Demo",
      email: credential.email,
      phoneNumber: account?.phoneNumber,
      centerId: account?.centerId,
      accessRole: {
        _id: `role-${credential.role}`,
        name: credential.roleLabel,
        value: ROLE_ACCESS_VALUE[credential.role],
      },
      permissions: ROLE_PERMISSIONS[credential.role],
      status: "active",
      language: "en",
      isDemo: true,
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
