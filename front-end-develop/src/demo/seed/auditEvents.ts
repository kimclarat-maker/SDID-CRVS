import { DemoAccount, DemoApplication, DemoAuditEvent } from "../types";
import { isoDaysAgo, nextId, pick } from "./fixtures";

const AUDIT_COUNT = 20;

const ACTIONS = [
  { action: "created", module: "applications" },
  { action: "submitted", module: "applications" },
  { action: "reviewed", module: "applications" },
  { action: "approved", module: "applications" },
  { action: "rejected", module: "applications" },
  { action: "scheduled", module: "appointments" },
  { action: "transferred", module: "appointments" },
  { action: "captured", module: "biometrics" },
  { action: "created", module: "accounts" },
  { action: "updated", module: "accounts" },
  { action: "assigned", module: "devices" },
  { action: "synchronised", module: "offline" },
  { action: "rolledBack", module: "applications" },
];

export const seedAuditEvents = (
  applications: DemoApplication[],
  accounts: DemoAccount[]
): DemoAuditEvent[] =>
  Array.from({ length: AUDIT_COUNT }, (_, i) => {
    const entry = pick(ACTIONS, i);
    const actor = pick(accounts, i);
    const application = pick(applications, i);

    return {
      id: nextId("LOG"),
      actor: `${actor.firstName} ${actor.lastName}`,
      action: entry.action,
      module: entry.module,
      targetRef: application.reference,
      at: isoDaysAgo(AUDIT_COUNT - i),
      details: `${entry.action} on ${application.reference} by ${actor.firstName} ${actor.lastName}`,
    };
  });
