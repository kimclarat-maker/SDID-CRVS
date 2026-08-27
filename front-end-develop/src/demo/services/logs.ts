// Demo-mode backing for the remaining src/api/applogs/* modules
// (src/api/applogs/moduleLogs is already wired via demoFetchAuditEvents in
// demo/services/administration.ts — this file covers the other four).
//
// applicationLogs mirrors moduleLogs exactly (same seeded db.auditEvents,
// same nested {data:{data,total}} nesting fetchApplicationLogs's real
// implementation returns) — it just has no reachable consumer today (the
// admin/applogs "Application logs" tab that would use it is commented out
// in screens/dashboard/admin/applogs/index.tsx).
//
// requestByIdentifierLogs and errorLogs back reachable admin screens
// (RequestIDLogs / LogCode), but both are raw change-log/event-sourcing
// lookups keyed by a specific identifier or error code, rendering deeply
// backend-shaped fields (el.newData.*, el.data.method === "addAppointment",
// etc.) that nothing in the demo dataset produces. Rather than fabricate a
// fake event-sourcing log format no other part of the demo system uses,
// these return a valid empty result — "no logs found for that
// identifier/code" is exactly what the real backend would say for demo
// identifiers too, so this is a legitimate response, not a shortcut.
//
// accountIdentityLogs's four functions already return a static empty
// payload without ever calling api() (so they never threw in demo mode to
// begin with — their "Account logs"/"Session logs" tabs are also commented
// out), but are still routed through here for consistency with the rest of
// this module.
import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";

export const demoFetchApplicationLogs = async (params?: {
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  const offset = params?.offset || 0;
  const limit = params?.limit || 10;
  const page = db.auditEvents.slice(offset, offset + limit).map((e) => ({
    _id: e.id,
    action: e.action,
    module: e.module,
    postedDate: e.at,
    type: e.action,
    id: e.id,
    data: { modifiedBy: e.actor },
  }));

  return demoDelay({
    data: { data: page, total: db.auditEvents.length },
    total: db.auditEvents.length,
  });
};

export const demoFetchErrorLogs = async () =>
  demoDelay({ data: [] });

export const demoFetchRequestByIdentifierLogs = async () =>
  demoDelay({ data: { data: [], total: 0 }, total: 0 });

const emptyLogsResult = async () =>
  demoDelay({ data: { data: [], total: 0 } });

export const demoFetchAccountIdentityLogs = emptyLogsResult;
export const demoFetchSessionActivityLogs = emptyLogsResult;
export const demoFetchAccountActivityLogs = emptyLogsResult;
export const demoFetchAccountActivityLogsBySessionId = emptyLogsResult;
