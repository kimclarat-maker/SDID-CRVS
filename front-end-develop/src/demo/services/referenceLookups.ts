// Demo-mode backing for the small read-mostly configuration/reference-data
// API modules: document-types, holidays, rights (access-rights), modules
// (app module list), and supporting-documents. These are dropdown/lookup
// sources touched constantly across enrollment and CRVS forms, but have no
// meaningful create/edit UI reachable in the app, so — per the task brief —
// they're returned as lightweight static datasets rather than being modeled
// as full localStorage-backed collections.
import { demoDelay } from "../config";

// ---- Document types (used by document-type dropdowns across enrollment forms) ----
let DEMO_DOCUMENT_TYPES = [
  {
    _id: "doctype-nid",
    name: "National ID",
    value: "NATIONAL_ID",
    identifierName: { en: "National ID Number", fr: "Numéro CNI", rw: "Indangamuntu" },
    status: "active",
  },
  {
    _id: "doctype-passport",
    name: "Passport",
    value: "PASSPORT",
    identifierName: { en: "Passport Number", fr: "Numéro de passeport", rw: "Nomero ya Pasiporo" },
    status: "active",
  },
  {
    _id: "doctype-refugee",
    name: "Refugee ID",
    value: "REFUGEE_ID",
    identifierName: { en: "Refugee ID Number", fr: "Numéro de réfugié", rw: "Indangamuntu y'Impunzi" },
    status: "active",
  },
  {
    _id: "doctype-birth-cert",
    name: "Birth Certificate",
    value: "BIRTH_CERTIFICATE",
    identifierName: { en: "Birth Certificate Number", fr: "Numéro d'acte de naissance", rw: "Nomero y'icyemezo cy'amavuko" },
    status: "active",
  },
];

export const demoFetchDocumentTypes = async (params?: { offset?: number; limit?: number; search?: string }) => {
  let results = DEMO_DOCUMENT_TYPES;
  if (params?.search) {
    const term = params.search.toLowerCase();
    results = results.filter((d) => d.name.toLowerCase().includes(term));
  }
  return demoDelay({ data: { data: results, total: results.length } });
};

export const demoFetchSingleDocumentType = async (id: string) =>
  demoDelay({ data: DEMO_DOCUMENT_TYPES.find((d) => d._id === id) });

export const demoDeleteDocumentType = async (id: string) => {
  DEMO_DOCUMENT_TYPES = DEMO_DOCUMENT_TYPES.filter((d) => d._id !== id);
  return demoDelay({ data: { message: "Document type deleted (demo)." } });
};

// ---- Holidays (used by appointment-scheduling date pickers) ----
const currentYear = new Date().getFullYear();
let DEMO_HOLIDAYS = [
  { date: `${currentYear}-01-01`, name: "New Year's Day" },
  { date: `${currentYear}-02-01`, name: "National Heroes' Day" },
  { date: `${currentYear}-04-07`, name: "Genocide Memorial Day" },
  { date: `${currentYear}-05-01`, name: "Labour Day" },
  { date: `${currentYear}-07-01`, name: "Independence Day" },
  { date: `${currentYear}-07-04`, name: "Liberation Day" },
  { date: `${currentYear}-08-15`, name: "Assumption Day" },
  { date: `${currentYear}-12-25`, name: "Christmas Day" },
].map((h) => ({ ...h, holidayDate: h.date, _id: `holiday-${h.date}` }));

export const demoDeleteHoliday = async (id: string) => {
  DEMO_HOLIDAYS = DEMO_HOLIDAYS.filter((h) => h._id !== id);
  return demoDelay({ data: { message: "Holiday deleted (demo)." } });
};

export const demoFetchHolidays = async () =>
  demoDelay({ data: DEMO_HOLIDAYS.map((h) => h.date) });

export const demoFetchHolidaysByYear = async (year?: number) => {
  const y = year || currentYear;
  return demoDelay({
    data: DEMO_HOLIDAYS.filter((h) => h.date.startsWith(String(y))),
  });
};

export const demoFetchHolidaysAll = async () => demoDelay({ data: DEMO_HOLIDAYS });

export const demoUploadHolidays = async () =>
  demoDelay({ data: { message: "Holidays uploaded (demo)." } });

// ---- Access rights (roles -> permissions matrix on the admin settings screen) ----
const DEMO_ACCESS_RIGHTS = [
  {
    _id: "right-administrator",
    module: "Administrator",
    roleId: "role-administrator",
    permissions: [
      { module: "enrollment", get: "true", post: "true", update: "true", delete: "true" },
      { module: "account", get: "true", post: "true", update: "true", delete: "true" },
      { module: "centers", get: "true", post: "true", update: "true", delete: "true" },
      { module: "device", get: "true", post: "true", update: "true", delete: "true" },
      { module: "logs", get: "true", post: "false", update: "false", delete: "false" },
    ],
  },
  {
    _id: "right-enrolment_officer",
    module: "Enrolment Officer",
    roleId: "role-enrolment_officer",
    permissions: [
      { module: "enrollment", get: "true", post: "true", update: "true", delete: "false" },
      { module: "schedule", get: "true", post: "true", update: "true", delete: "false" },
    ],
  },
  {
    _id: "right-reviewer",
    module: "Reviewer",
    roleId: "role-reviewer",
    permissions: [
      { module: "enrollment", get: "true", post: "false", update: "true", delete: "false" },
    ],
  },
  {
    _id: "right-supervisor",
    module: "Supervisor",
    roleId: "role-supervisor",
    permissions: [
      { module: "enrollment", get: "true", post: "false", update: "false", delete: "false" },
      { module: "logs", get: "true", post: "false", update: "false", delete: "false" },
    ],
  },
];

export const demoFetchAccessRights = async (params?: { id?: string; search?: string }) => {
  if (params?.id) {
    const single = DEMO_ACCESS_RIGHTS.find((r) => r._id === params.id);
    return demoDelay(single);
  }
  let results = DEMO_ACCESS_RIGHTS;
  if (params?.search) {
    const term = params.search.toLowerCase();
    results = results.filter((r) => r.module.toLowerCase().includes(term));
  }
  return demoDelay({ data: results, total: results.length });
};

// ---- Modules (the app-module list access rights are granted against) ----
const DEMO_MODULES = [
  { _id: "module-enrollment", name: "Enrollment", value: "enrollment" },
  { _id: "module-account", name: "Accounts", value: "account" },
  { _id: "module-centers", name: "Centres", value: "centers" },
  { _id: "module-device", name: "Devices", value: "deviceManagement" },
  { _id: "module-schedule", name: "Appointments", value: "schedule" },
  { _id: "module-logs", name: "Logs", value: "logs" },
  { _id: "module-geography", name: "Geography", value: "geography" },
  { _id: "module-reports", name: "Reports", value: "reports" },
];

export const demoFetchModules = async (params?: { id?: string; search?: string }) => {
  if (params?.id) {
    // Mirrors fetchModules(): returns the single module body unwrapped — the
    // consuming hook (useFetchModules) does its own `[data]` wrapping for the
    // id case, same as it does for fetchAccessRights.
    const single = DEMO_MODULES.find((m) => m._id === params.id);
    return demoDelay(single);
  }
  let results = DEMO_MODULES;
  if (params?.search) {
    const term = params.search.toLowerCase();
    results = results.filter((m) => m.name.toLowerCase().includes(term));
  }
  return demoDelay({ data: results, total: results.length });
};

// ---- Supporting documents (the document-field -> accepted-file-types config used by upload widgets) ----
const DEMO_SUPPORTING_DOCUMENTS: Record<string, { name: string; required: boolean }[]> = {
  proofOfAddress: [
    { name: "Utility bill", required: false },
    { name: "Local government attestation", required: false },
  ],
  divorceCertificate: [{ name: "Divorce certificate", required: true }],
  deathCertificate: [{ name: "Death certificate", required: true }],
  guardianshipProof: [{ name: "Guardianship order", required: true }],
};

let DEMO_SUPPORTING_DOCUMENT_LIST = Object.entries(DEMO_SUPPORTING_DOCUMENTS).map(
  ([fieldName, documents], i) => ({
    _id: `supdoc-${i}`,
    fieldName,
    documents,
  })
);

export const demoFetchSupportingDocuments = async () =>
  demoDelay({ data: DEMO_SUPPORTING_DOCUMENT_LIST, total: DEMO_SUPPORTING_DOCUMENT_LIST.length });

export const demoDeleteSupportingDocument = async (id: string) => {
  DEMO_SUPPORTING_DOCUMENT_LIST = DEMO_SUPPORTING_DOCUMENT_LIST.filter((d) => d._id !== id);
  return demoDelay({ data: { message: "Supporting document configuration deleted (demo)." } });
};

export const demoFetchSingleSupportingDocuments = async (fieldName?: string) =>
  demoDelay(
    DEMO_SUPPORTING_DOCUMENTS[fieldName || ""] || []
  );
