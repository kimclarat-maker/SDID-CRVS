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
export const PLATFORM_ADMINISTRATOR_DEMO_ID = "crvs.admin@demo.identity.local";
export const DUAL_WORKSPACE_DEMO_ID = "dual.staff@demo.identity.local";

export const NOTIFIER_DEMO_NAME = "Birth Notification Officer";
export const REGISTRATION_OFFICER_DEMO_NAME = "CRVS Registration Officer";
export const CIVIL_REGISTRAR_DEMO_NAME = "Civil Registrar";
export const CRVS_SUPERVISOR_DEMO_NAME = "CRVS Supervisor";
export const PLATFORM_ADMINISTRATOR_DEMO_NAME = "Platform Administrator";

// Death-workflow demo actors. REGISTRATION_OFFICER_DEMO_ID/
// CIVIL_REGISTRAR_DEMO_ID/CRVS_SUPERVISOR_DEMO_ID above are reused for the
// death workflow too (those roles carry both birth and death permissions —
// see constants/crvsRoles.ts), so only the death-specific roles get new ids.
export const DEATH_NOTIFICATION_OFFICER_DEMO_ID = "death.notifier@demo.identity.local";
export const MEDICAL_CERTIFIER_DEMO_ID = "medical.certifier@demo.identity.local";
export const CRVS_AUDITOR_DEMO_ID = "crvs.auditor@demo.identity.local";

export const DEATH_NOTIFICATION_OFFICER_DEMO_NAME = "Death Notification Officer";
export const MEDICAL_CERTIFIER_DEMO_NAME = "Medical Certifier";
export const CRVS_AUDITOR_DEMO_NAME = "CRVS Auditor";

// Matches DEMO_CRVS_FACILITY in demo/session.ts so jurisdiction/facility
// guard checks agree between the logged-in assignment and seeded case data.
export const DEMO_FACILITY_ID = "FAC-DEMO-01";
export const DEMO_FACILITY_NAME = "Demo District Health Centre";
export const DEMO_JURISDICTION = "Demo District";
export const OTHER_JURISDICTION = "Other District";
export const DEMO_PROCESSING_OFFICE = "Demo District Registration Office";
