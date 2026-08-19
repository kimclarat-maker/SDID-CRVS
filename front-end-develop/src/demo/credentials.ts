import { DemoRole } from "./types";

export type DemoCredential = {
  role: DemoRole;
  roleLabel: string;
  email: string;
  password: string;
  description: string;
};

// Fictional accounts, fictional domain, documented in README.md. Only ever
// accepted by the login screen when VITE_DEMO_MODE=true (see demo/session.ts).
export const demoCredentials: DemoCredential[] = [
  {
    role: "administrator",
    roleLabel: "Administrator",
    email: "admin@demo.identity.local",
    password: "DemoAdmin@2026",
    description: "Full access — accounts, roles, centres, devices, settings.",
  },
  {
    role: "enrolment_officer",
    roleLabel: "Enrolment Officer",
    email: "officer@demo.identity.local",
    password: "DemoOfficer@2026",
    description: "Search citizens, run pre-enrolment, schedule appointments.",
  },
  {
    role: "reviewer",
    roleLabel: "Reviewer",
    email: "reviewer@demo.identity.local",
    password: "DemoReviewer@2026",
    description: "Review, approve, reject, and request corrections.",
  },
  {
    role: "supervisor",
    roleLabel: "Supervisor",
    email: "supervisor@demo.identity.local",
    password: "DemoSupervisor@2026",
    description: "Analytics, staff performance, exceptions, audit history.",
  },
];

export const findDemoCredential = (
  email: string,
  password: string
): DemoCredential | undefined =>
  demoCredentials.find(
    (c) =>
      c.email.toLowerCase() === email.trim().toLowerCase() &&
      c.password === password
  );
