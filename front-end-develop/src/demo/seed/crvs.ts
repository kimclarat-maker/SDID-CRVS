// Static, read-only fictional fixtures for the CRVS workspace foundation
// milestone. Unlike src/demo/storage/demoStore.ts (SDID's mutable,
// localStorage-persisted dataset), these are plain in-memory arrays — the
// birth-registration workflow that would make CRVS data mutable is out of
// scope for this milestone. Reference numbers follow the same "-DEMO-"
// naming convention as the rest of the demo data (see README.md).

export type CrvsBirthNotification = {
  id: string;
  reference: string;
  childName: string;
  dateOfBirth: string;
  facility: string;
  notifiedBy: string;
  notifiedAt: string;
  status: "new" | "acknowledged";
};

export type CrvsRegistrationCaseStatus =
  | "draft"
  | "submitted"
  | "correctionRequested"
  | "approved"
  | "rejected";

export type CrvsRegistrationCase = {
  id: string;
  reference: string;
  childName: string;
  submittedAt: string;
  submittedByName: string;
  submittedByOfficerId: string;
  jurisdiction: string;
  status: CrvsRegistrationCaseStatus;
};

export type CrvsCorrectionRequest = {
  id: string;
  reference: string;
  caseReference: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  status: "open" | "resolved";
};

export type CrvsExceptionCase = {
  id: string;
  reference: string;
  childName: string;
  daysLate: number;
  reason: string;
  assignedTo: string;
  status: "unassigned" | "inProgress" | "resolved";
};

export type CrvsAuditEntry = {
  id: string;
  actor: string;
  action: string;
  at: string;
  details: string;
};

export const NOTIFIER_DEMO_ID = "notifier@demo.identity.local";
export const REGISTRATION_OFFICER_DEMO_ID = "crvs.officer@demo.identity.local";
export const CIVIL_REGISTRAR_DEMO_ID = "registrar@demo.identity.local";
export const DUAL_WORKSPACE_DEMO_ID = "dual.staff@demo.identity.local";

export const crvsBirthNotifications: CrvsBirthNotification[] = [
  {
    id: "BN-1",
    reference: "BN-DEMO-2026-0001",
    childName: "Baby of A. Uwase",
    dateOfBirth: "2026-08-12",
    facility: "Demo District Health Centre",
    notifiedBy: NOTIFIER_DEMO_ID,
    notifiedAt: "2026-08-13T08:15:00Z",
    status: "new",
  },
  {
    id: "BN-2",
    reference: "BN-DEMO-2026-0002",
    childName: "Baby of J. Mugisha",
    dateOfBirth: "2026-08-10",
    facility: "Demo District Health Centre",
    notifiedBy: NOTIFIER_DEMO_ID,
    notifiedAt: "2026-08-10T14:40:00Z",
    status: "acknowledged",
  },
  {
    id: "BN-3",
    reference: "BN-DEMO-2026-0003",
    childName: "Baby of E. Niyonsaba",
    dateOfBirth: "2026-08-05",
    facility: "Demo Referral Hospital",
    notifiedBy: NOTIFIER_DEMO_ID,
    notifiedAt: "2026-08-05T19:05:00Z",
    status: "acknowledged",
  },
];

export const crvsRegistrationCases: CrvsRegistrationCase[] = [
  {
    id: "BR-0",
    reference: "BR-DEMO-2026-0014",
    childName: "Baby of A. Uwase",
    submittedAt: "2026-08-15T07:45:00Z",
    submittedByName: "CRVS Registration Officer",
    submittedByOfficerId: REGISTRATION_OFFICER_DEMO_ID,
    jurisdiction: "Demo District",
    status: "draft",
  },
  {
    id: "BR-1",
    reference: "BR-DEMO-2026-0011",
    childName: "Baby of J. Mugisha",
    submittedAt: "2026-08-14T09:00:00Z",
    submittedByName: "CRVS Registration Officer",
    submittedByOfficerId: REGISTRATION_OFFICER_DEMO_ID,
    jurisdiction: "Demo District",
    status: "submitted",
  },
  {
    id: "BR-2",
    reference: "BR-DEMO-2026-0012",
    childName: "Baby of E. Niyonsaba",
    submittedAt: "2026-08-13T11:30:00Z",
    submittedByName: "CRVS Registration Officer",
    submittedByOfficerId: REGISTRATION_OFFICER_DEMO_ID,
    jurisdiction: "Demo District",
    status: "submitted",
  },
  {
    id: "BR-3",
    reference: "BR-DEMO-2026-0013",
    childName: "Baby of D. Habimana",
    submittedAt: "2026-08-09T16:20:00Z",
    submittedByName: "Civil Registrar",
    // Deliberately authored by the Civil Registrar demo account itself, so
    // the "can't approve your own case" rule has a real row to demonstrate
    // against (see utils/workspace/crvsRules.ts).
    submittedByOfficerId: CIVIL_REGISTRAR_DEMO_ID,
    jurisdiction: "Demo District",
    status: "submitted",
  },
  {
    id: "BR-5",
    reference: "BR-DEMO-2026-0007",
    childName: "Baby of C. Nshimiyimana",
    submittedAt: "2026-08-11T10:00:00Z",
    submittedByName: "CRVS Registration Officer",
    submittedByOfficerId: REGISTRATION_OFFICER_DEMO_ID,
    jurisdiction: "Demo District",
    status: "correctionRequested",
  },
  {
    id: "BR-4",
    reference: "BR-DEMO-2026-0009",
    childName: "Baby of R. Iradukunda",
    submittedAt: "2026-08-02T08:00:00Z",
    submittedByName: "CRVS Registration Officer",
    submittedByOfficerId: REGISTRATION_OFFICER_DEMO_ID,
    jurisdiction: "Demo District",
    status: "approved",
  },
];

export const crvsCorrectionRequests: CrvsCorrectionRequest[] = [
  {
    id: "CR-1",
    reference: "CR-DEMO-2026-0004",
    caseReference: "BR-DEMO-2026-0007",
    requestedBy: CIVIL_REGISTRAR_DEMO_ID,
    requestedAt: "2026-08-11T10:00:00Z",
    reason: "Child's given name spelling does not match the notification record.",
    status: "open",
  },
  {
    id: "CR-2",
    reference: "CR-DEMO-2026-0003",
    caseReference: "BR-DEMO-2026-0005",
    requestedBy: CIVIL_REGISTRAR_DEMO_ID,
    requestedAt: "2026-08-07T13:45:00Z",
    reason: "Missing father's identity document number.",
    status: "resolved",
  },
];

export const crvsExceptions: CrvsExceptionCase[] = [
  {
    id: "EX-1",
    reference: "BR-DEMO-2026-0002",
    childName: "Baby of P. Ndayisenga",
    daysLate: 46,
    reason: "Late registration — beyond the standard notification window.",
    assignedTo: "crvs.supervisor@demo.identity.local",
    status: "inProgress",
  },
  {
    id: "EX-2",
    reference: "BR-DEMO-2026-0001",
    childName: "Baby of S. Uwimana",
    daysLate: 92,
    reason: "Late registration — facility notification delayed.",
    assignedTo: "",
    status: "unassigned",
  },
];

export const crvsAuditLog: CrvsAuditEntry[] = [
  {
    id: "AU-1",
    actor: CIVIL_REGISTRAR_DEMO_ID,
    action: "approved",
    at: "2026-08-14T12:10:00Z",
    details: "Approved BR-DEMO-2026-0009",
  },
  {
    id: "AU-2",
    actor: REGISTRATION_OFFICER_DEMO_ID,
    action: "submitted",
    at: "2026-08-13T11:30:00Z",
    details: "Submitted BR-DEMO-2026-0012 for review",
  },
  {
    id: "AU-3",
    actor: "crvs.supervisor@demo.identity.local",
    action: "reassigned",
    at: "2026-08-12T09:00:00Z",
    details: "Reassigned BR-DEMO-2026-0002 exception to self",
  },
];

export const crvsWorkloadSummary = {
  pendingReview: crvsRegistrationCases.filter((c) => c.status === "submitted").length,
  approvedThisWeek: crvsRegistrationCases.filter((c) => c.status === "approved").length,
  openCorrections: crvsCorrectionRequests.filter((c) => c.status === "open").length,
  openExceptions: crvsExceptions.filter((e) => e.status !== "resolved").length,
  avgProcessingDays: 3.2,
  staffOnDuty: 5,
};
