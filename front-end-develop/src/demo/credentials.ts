import { DemoRole } from "./types";
import { CrvsRole, CRVS_ROLES, CRVS_ROLE_LABELS } from "@/constants/crvsRoles";
import { StaffWorkspace } from "@/types/Workspace";

export type DemoCredential = {
  role: DemoRole | CrvsRole | "dual_workspace";
  roleLabel: string;
  email: string;
  password: string;
  description: string;
  workspaces: StaffWorkspace[];
  // Only set when role === "dual_workspace": which role to grant in each workspace.
  dualRoles?: { sdid: DemoRole; crvs: CrvsRole };
};

// Fictional accounts, fictional domain, documented in README.md. Only ever
// accepted by the login screen when VITE_DEMO_MODE=true (see demo/session.ts).
//
// Kept exactly as-is (same 4 SDID roles/emails/passwords) so nothing about
// the existing demo login flow changes — CRVS and dual-workspace accounts
// live in the separate arrays below instead of being merged into this one.
export const demoCredentials: DemoCredential[] = [
  {
    role: "administrator",
    roleLabel: "Administrator",
    email: "admin@demo.identity.local",
    password: "DemoAdmin@2026",
    description: "Full access — accounts, roles, centres, devices, settings.",
    workspaces: ["SDID"],
  },
  {
    role: "enrolment_officer",
    roleLabel: "Enrolment Officer",
    email: "officer@demo.identity.local",
    password: "DemoOfficer@2026",
    description: "Search citizens, run pre-enrolment, schedule appointments.",
    workspaces: ["SDID"],
  },
  {
    role: "reviewer",
    roleLabel: "Reviewer",
    email: "reviewer@demo.identity.local",
    password: "DemoReviewer@2026",
    description: "Review, approve, reject, and request corrections.",
    workspaces: ["SDID"],
  },
  {
    role: "supervisor",
    roleLabel: "Supervisor",
    email: "supervisor@demo.identity.local",
    password: "DemoSupervisor@2026",
    description: "Analytics, staff performance, exceptions, audit history.",
    workspaces: ["SDID"],
  },
];

export const crvsDemoCredentials: DemoCredential[] = [
  {
    role: CRVS_ROLES.BIRTH_NOTIFICATION_OFFICER,
    roleLabel: CRVS_ROLE_LABELS.BIRTH_NOTIFICATION_OFFICER,
    email: "notifier@demo.identity.local",
    password: "DemoNotifier@2026",
    description: "Create and view birth notifications for the assigned facility.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.CRVS_REGISTRATION_OFFICER,
    roleLabel: CRVS_ROLE_LABELS.CRVS_REGISTRATION_OFFICER,
    email: "crvs.officer@demo.identity.local",
    password: "DemoCrvsOfficer@2026",
    description: "Draft, verify, attach evidence, and submit birth registrations.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.CIVIL_REGISTRAR,
    roleLabel: CRVS_ROLE_LABELS.CIVIL_REGISTRAR,
    email: "registrar@demo.identity.local",
    password: "DemoRegistrar@2026",
    description: "Review evidence, request corrections, approve or reject cases.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.CRVS_SUPERVISOR,
    roleLabel: CRVS_ROLE_LABELS.CRVS_SUPERVISOR,
    email: "crvs.supervisor@demo.identity.local",
    password: "DemoCrvsSupervisor@2026",
    description: "Workload, analytics, exceptions, reassignment, audit history.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.PLATFORM_ADMINISTRATOR,
    roleLabel: CRVS_ROLE_LABELS.PLATFORM_ADMINISTRATOR,
    email: "crvs.admin@demo.identity.local",
    password: "DemoCrvsAdmin@2026",
    description: "Configure certificate templates, fees, validity and delivery settings.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.DEATH_NOTIFICATION_OFFICER,
    roleLabel: CRVS_ROLE_LABELS.DEATH_NOTIFICATION_OFFICER,
    email: "death.notifier@demo.identity.local",
    password: "DemoDeathNotifier@2026",
    description: "Create and submit death notifications for the assigned facility.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.MEDICAL_CERTIFIER,
    roleLabel: CRVS_ROLE_LABELS.MEDICAL_CERTIFIER,
    email: "medical.certifier@demo.identity.local",
    password: "DemoMedicalCertifier@2026",
    description: "Certify cause of death on notifications and registrations.",
    workspaces: ["CRVS"],
  },
  {
    role: CRVS_ROLES.CRVS_AUDITOR,
    roleLabel: CRVS_ROLE_LABELS.CRVS_AUDITOR,
    email: "crvs.auditor@demo.identity.local",
    password: "DemoCrvsAuditor@2026",
    description: "Read-only access to death registrations and audit history.",
    workspaces: ["CRVS"],
  },
];

// Deliberately paired with CRVS Registration Officer, not Civil Registrar —
// a dual-workspace account must not gain registration-approval authority
// just by also having SDID access. Approval requires an explicit Civil
// Registrar assignment (see registrar@demo.identity.local above).
export const dualWorkspaceDemoCredential: DemoCredential = {
  role: "dual_workspace",
  roleLabel: "SDID Supervisor + CRVS Registration Officer",
  email: "dual.staff@demo.identity.local",
  password: "DemoDualStaff@2026",
  description: "Holds both an SDID and a CRVS assignment — opens the workspace selector.",
  workspaces: ["SDID", "CRVS"],
  dualRoles: { sdid: "supervisor", crvs: CRVS_ROLES.CRVS_REGISTRATION_OFFICER },
};

export const allStaffDemoCredentials: DemoCredential[] = [
  ...demoCredentials,
  ...crvsDemoCredentials,
  dualWorkspaceDemoCredential,
];

export const findDemoCredential = (
  email: string,
  password: string
): DemoCredential | undefined =>
  allStaffDemoCredentials.find(
    (c) =>
      c.email.toLowerCase() === email.trim().toLowerCase() &&
      c.password === password
  );
