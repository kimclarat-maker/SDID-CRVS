import { cfg } from "@/constants/cfg";
import { BirthRegistrationCase } from "@/domain/crvs/types";

// Same synchronous sessionStorage read pattern as utils/workspace/index.ts's
// readSession() — there is no getCurrentActorName() export there yet (only
// getCurrentAccountId()), so this fills that one gap locally rather than
// reaching into a shared file outside this slice's ownership.
const STORAGE_NAME = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";

function readSession(): any | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_NAME);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Display name for the signed-in staff member, used as the `actorName`
 * every demo service call records in status history / audit log. */
export function getCurrentActorName(): string {
  const session = readSession();
  const account = session?.account;
  const first = account?.firstName || session?.firstName;
  const last = account?.lastName || session?.lastName;
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || account?.email || session?.email || "Unknown";
}

/** Masks an identity/document number to its last 4 characters, e.g.
 * "1199880012345" -> "•••••••••2345". Never renders a raw identity number
 * in a read-only summary (spec requirement for this slice). */
export function maskId(value: string | undefined | null): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return "•".repeat(trimmed.length - 4) + trimmed.slice(-4);
}

/** Formats an ISO timestamp for display; falls back to the raw value if it
 * isn't parseable rather than throwing/crashing a review card. */
export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function fullName(first?: string, middle?: string, last?: string): string {
  return [first, middle, last].filter(Boolean).join(" ").trim() || "—";
}

/** True when the case's status history shows it went through supervisor
 * late-registration review and was resolved back into UNDER_REVIEW — used
 * by the "Late-registration cases returned by supervisor" queue tab. There
 * is no dedicated status for "returned"; this reconstructs it from the
 * ordered status-history log, which is the only queryable signal available. */
export function returnedFromLateReview(registrationCase: BirthRegistrationCase): boolean {
  if (registrationCase.status !== "UNDER_REVIEW") return false;
  let lastLateIdx = -1;
  let lastUnderReviewIdx = -1;
  registrationCase.statusHistory.forEach((entry, idx) => {
    if (entry.status === "LATE_REGISTRATION_REVIEW") lastLateIdx = idx;
    if (entry.status === "UNDER_REVIEW") lastUnderReviewIdx = idx;
  });
  return lastLateIdx !== -1 && lastUnderReviewIdx > lastLateIdx;
}

export function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
