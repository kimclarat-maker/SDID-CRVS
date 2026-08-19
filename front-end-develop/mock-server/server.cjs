// Zero-dependency mock backend for local frontend dev.
// Serves the app's existing test fixtures (src/mocks/**, bundled into
// .generated/mock-data.cjs by build-data.cjs) over a small REST-ish API
// that mirrors the shapes src/api/** expects.
const http = require("http");
const crypto = require("crypto");
const seed = require("./.generated/mock-data.cjs");

const PORT = process.env.MOCK_PORT || 4000;

// ---- working in-memory copies (so POST/PATCH/DELETE persist for the session) ----
const db = {
  accounts: seed.accounts.map((a, i) => ({
    _id: `acc-${i + 1}`,
    status: "active",
    ...a,
  })),
  centers: [...seed.centers],
  provinces: [...seed.provinces],
  districts: [...seed.districts],
  sectors: [...seed.sectors],
  cells: [...seed.cells],
  villages: [...seed.villages],
  countries: [...seed.countries],
  enrollments: [...seed.enrollments],
  notifications: [...seed.notifications],
  prenrollment: [...seed.prenrollment],
  schedules: [...seed.schedules],
  devices: seed.devices.map((d, i) => ({ _id: d._id || `dev-${i + 1}`, ...d })),
  rollbacks: [...seed.rollbacks],
  transfers: [...seed.transfers],
  drafts: [...seed.drafts],
  alerts: [...seed.alerts],
  reports: [...seed.reports],
};

const smallCatalogs = {
  modules: [
    { _id: "mod-1", name: "Accounts", value: "account", status: "active" },
    { _id: "mod-2", name: "Enrollment", value: "enrollment", status: "active" },
    { _id: "mod-3", name: "Centers", value: "centers", status: "active" },
    { _id: "mod-4", name: "Reports", value: "reports", status: "active" },
    { _id: "mod-5", name: "Devices", value: "device", status: "active" },
  ],
  roles: [
    { _id: "role-1", name: "System Super Administrator", value: "superAdmin", status: "active" },
    { _id: "role-2", name: "Enrollment Officer", value: "enrollementOfficer", status: "active" },
    { _id: "role-3", name: "Supervisor", value: "supervisor", status: "active" },
  ],
  menus: [
    { _id: "menu-1", name: "Dashboard", path: "/dashboard/admin", status: "active" },
    { _id: "menu-2", name: "Accounts", path: "/dashboard/admin/accounts", status: "active" },
    { _id: "menu-3", name: "Devices", path: "/dashboard/admin/devices", status: "active" },
  ],
  documentTypes: [
    { _id: "doc-1", name: "Rwanda National ID", status: "active" },
    { _id: "doc-2", name: "Passport", status: "active" },
    { _id: "doc-3", name: "Refugee ID", status: "active" },
  ],
  holidays: [
    { _id: "hol-1", name: "New Year", date: "2026-01-01" },
    { _id: "hol-2", name: "Liberation Day", date: "2026-07-04" },
    { _id: "hol-3", name: "Christmas", date: "2026-12-25" },
  ],
  supportingDocuments: [
    { _id: "sd-1", fieldName: "idDocument", name: "ID Document", required: true },
    { _id: "sd-2", fieldName: "proofOfAddress", name: "Proof of Address", required: false },
  ],
};

// ---- helpers ----
const send = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  });
  res.end(payload);
};

const list = (res, arr, query) => {
  const offset = parseInt(query.get("offset") || "0", 10) || 0;
  const limit = parseInt(query.get("limit") || String(arr.length || 10), 10) || arr.length;
  send(res, 200, { data: arr.slice(offset, offset + limit), total: arr.length });
};

const byId = (arr, id) => arr.find((it) => it._id === id);

const byParent = (arr, parentKey, parentId) => {
  const filtered = arr.filter((it) => it[`${parentKey}Detail`]?.id === parentId);
  return filtered.length ? filtered : arr;
};

const genId = () => crypto.randomUUID();

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

// registers GET (list + :id), POST, PATCH, DELETE for a simple array resource
const crud = (routes, base, arrKey) => {
  routes.push({ method: "GET", regex: new RegExp(`^${base}$`), handler: (res, _m, query) => list(res, db[arrKey], query) });
  routes.push({
    method: "GET",
    regex: new RegExp(`^${base}/([^/]+)$`),
    handler: (res, m) => {
      const item = byId(db[arrKey], m[1]);
      item ? send(res, 200, { data: item }) : send(res, 404, { message: "Not found" });
    },
  });
  routes.push({
    method: "POST",
    regex: new RegExp(`^${base}$`),
    handler: async (res, _m, _q, body) => {
      const record = { _id: genId(), status: "active", ...body };
      db[arrKey].push(record);
      send(res, 201, { data: record });
    },
  });
  routes.push({
    method: "PATCH",
    regex: new RegExp(`^${base}/([^/]+)$`),
    handler: async (res, m, _q, body) => {
      const item = byId(db[arrKey], m[1]);
      if (!item) return send(res, 404, { message: "Not found" });
      Object.assign(item, body);
      send(res, 200, { data: item });
    },
  });
  routes.push({
    method: "DELETE",
    regex: new RegExp(`^${base}/([^/]+)$`),
    handler: (res, m) => {
      const idx = db[arrKey].findIndex((it) => it._id === m[1]);
      if (idx === -1) return send(res, 404, { message: "Not found" });
      db[arrKey].splice(idx, 1);
      send(res, 200, { data: { success: true } });
    },
  });
};

const routes = [];

// ---- auth ----
routes.push({ method: "POST", regex: /^\/auth\/login$/, handler: (res) => send(res, 200, seed.emailPasswordResponse) });
routes.push({
  method: "POST",
  regex: /^\/auth\/(mfa\/verify-email|mfa-verify-email|mfa\/verify-face|mfa\/verify-embedding)$/,
  handler: (res) => send(res, 200, seed.loggedInUser),
});
routes.push({
  method: "POST",
  regex: /^\/auth\/(mfa\/send-otp-by-email|send-email-otp)$/,
  handler: (res) => send(res, 200, seed.sendOtpResponse),
});
routes.push({ method: "POST", regex: /^\/auth\/logout$/, handler: (res) => send(res, 200, { data: { success: true } }) });
routes.push({ method: "POST", regex: /^\/auth\/sync-account-data$/, handler: (res) => send(res, 200, { data: { success: true } }) });
routes.push({
  method: "POST",
  regex: /^\/auth\/(send-password-reset-link|reset-password|reset-password\/verify-token)$/,
  handler: (res) => send(res, 200, { data: { success: true, message: "OK (mock)" } }),
});

// ---- geo (parent filters must be registered before the generic :id route) ----
routes.push({ method: "GET", regex: /^\/geo\/districts\/byprovince\/([^/]+)$/, handler: (res, m) => list(res, byParent(db.districts, "province", m[1]), new URLSearchParams()) });
routes.push({ method: "GET", regex: /^\/geo\/sectors\/bydistrict\/([^/]+)$/, handler: (res, m) => list(res, byParent(db.sectors, "district", m[1]), new URLSearchParams()) });
routes.push({ method: "GET", regex: /^\/geo\/cells\/bysector\/([^/]+)$/, handler: (res, m) => list(res, byParent(db.cells, "sector", m[1]), new URLSearchParams()) });
routes.push({ method: "GET", regex: /^\/geo\/villages\/bycell\/([^/]+)$/, handler: (res, m) => list(res, byParent(db.villages, "cell", m[1]), new URLSearchParams()) });

crud(routes, "/geo/provinces", "provinces");
crud(routes, "/geo/districts", "districts");
crud(routes, "/geo/sectors", "sectors");
crud(routes, "/geo/cells", "cells");
crud(routes, "/geo/villages", "villages");
crud(routes, "/geo/countries", "countries");

// ---- core resources ----
crud(routes, "/configuration/centers", "centers");
crud(routes, "/accounts", "accounts");
crud(routes, "/schedules", "schedules");
crud(routes, "/devices", "devices");

routes.push({ method: "GET", regex: /^\/enrollment(\/offline)?$/, handler: (res, _m, query) => list(res, db.enrollments, query) });
routes.push({ method: "GET", regex: /^\/enrollment\/([^/]+)$/, handler: (res, m) => {
  const item = byId(db.enrollments, m[1]);
  send(res, 200, { data: item || null });
} });
routes.push({ method: "GET", regex: /^\/notifications$/, handler: (res, _m, query) => list(res, db.notifications, query) });
routes.push({ method: "GET", regex: /^\/pre-enrollment\/search\/all$/, handler: (res, _m, query) => list(res, db.prenrollment, query) });
routes.push({ method: "GET", regex: /^\/pre-enrollment\/rollback$/, handler: (res, _m, query) => list(res, db.rollbacks, query) });
routes.push({ method: "GET", regex: /^\/dashboard\/reports$/, handler: (res, _m, query) => list(res, db.reports, query) });

// ---- analytics / reports ----
routes.push({ method: "GET", regex: /^\/analytics\/summary$/, handler: (res) => send(res, 200, { data: seed.analyticsSummary }) });
routes.push({
  method: "GET",
  regex: /^\/reports\/dashboard$/,
  handler: (res) =>
    send(res, 200, {
      data: {
        ...seed.analyticsSummary,
        centers: db.reports,
      },
    }),
});

// ---- configuration catalogs ----
routes.push({ method: "GET", regex: /^\/configuration\/access-rights\/modules(\/[^/]+)?$/, handler: (res, _m, query) => list(res, smallCatalogs.modules, query) });
routes.push({ method: "GET", regex: /^\/configuration\/access-rights(\/[^/]+)?$/, handler: (res, _m, query) => list(res, smallCatalogs.roles, query) });
routes.push({ method: "GET", regex: /^\/configuration\/roles(\/[^/]+)?$/, handler: (res, _m, query) => list(res, smallCatalogs.roles, query) });
routes.push({ method: "GET", regex: /^\/configuration\/menus$/, handler: (res, _m, query) => list(res, smallCatalogs.menus, query) });
routes.push({ method: "GET", regex: /^\/configuration\/document-types(\/[^/]+)?$/, handler: (res, _m, query) => list(res, smallCatalogs.documentTypes, query) });
routes.push({ method: "GET", regex: /^\/configuration\/holidays(\/(all|[^/]+))?$/, handler: (res, _m, query) => list(res, smallCatalogs.holidays, query) });
routes.push({ method: "GET", regex: /^\/configuration\/supporting-documents(\/[^/]+)?$/, handler: (res, _m, query) => list(res, smallCatalogs.supportingDocuments, query) });
routes.push({ method: "GET", regex: /^\/configuration\/(sms|email)-(settings|templates)(\/flows)?$/, handler: (res) => send(res, 200, { data: {} }) });

// ---- health / misc noise the app polls ----
routes.push({ method: "GET", regex: /^\/health(\/.*)?$/, handler: (res) => send(res, 200, { status: "UP" }) });

console.log("Registered", routes.length, "mock routes");

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  const match = routes.find((r) => r.method === req.method && r.regex.test(pathname));
  if (!match) {
    console.log(`[unmocked] ${req.method} ${pathname}`);
    if (req.method === "GET") return send(res, 200, { data: [], total: 0 });
    const body = await readBody(req);
    return send(res, 200, { data: { success: true, ...body } });
  }

  const m = match.regex.exec(pathname);
  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await readBody(req);
  try {
    await match.handler(res, m, url.searchParams, body);
  } catch (err) {
    console.error("Mock route error:", err);
    send(res, 500, { message: "Mock server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Mock SDID backend listening on http://localhost:${PORT}`);
});
