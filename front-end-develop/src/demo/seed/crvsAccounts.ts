// Stable actor identifiers for CRVS seed data. These match the email
// addresses buildDemoSession()/getCurrentAccountId() actually produce for
// CRVS-only demo accounts (see demo/session.ts: account._id falls back to
// credential.email for accounts not in the seeded SDID DemoDatabase), so
// logging in as e.g. registrar@demo.identity.local resolves to exactly the
// same id used as officerId/reviewerId/etc. in the seeded case data below.
export const NOTIFIER_DEMO_ID = "notifier@demo.identity.local";
export const REGISTRATION_OFFICER_DEMO_ID = "crvs.officer@demo.identity.local";
export const CIVIL_REGISTRAR_DEMO_ID = "registrar@demo.identity.local";
export const CRVS_SUPERVISOR_DEMO_ID = "crvs.supervisor@demo.identity.local";
export const DUAL_WORKSPACE_DEMO_ID = "dual.staff@demo.identity.local";

export const NOTIFIER_DEMO_NAME = "Birth Notification Officer";
export const REGISTRATION_OFFICER_DEMO_NAME = "CRVS Registration Officer";
export const CIVIL_REGISTRAR_DEMO_NAME = "Civil Registrar";
export const CRVS_SUPERVISOR_DEMO_NAME = "CRVS Supervisor";

// Matches DEMO_CRVS_FACILITY in demo/session.ts so jurisdiction/facility
// guard checks agree between the logged-in assignment and seeded case data.
export const DEMO_FACILITY_ID = "FAC-DEMO-01";
export const DEMO_FACILITY_NAME = "Demo District Health Centre";
export const DEMO_JURISDICTION = "Demo District";
export const OTHER_JURISDICTION = "Other District";
export const DEMO_PROCESSING_OFFICE = "Demo District Registration Office";
