// Two-party SDID marital-status synchronization for divorce (spec §23) —
// mirrors crvsMarriageSdidSync.ts's shape closely, but the successful
// terminal (a) flips maritalStatus to DIVORCED instead of MARRIED and (b)
// dissolves the EXISTING MarriageRelationship (status -> "DISSOLVED") rather
// than creating a new relationship record. Never lets one former spouse's
// random outcome affect the other's; a relationship, once dissolved, is
// never re-dissolved on retry (idempotent); a per-spouse retry only
// re-attempts that spouse's own field update.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DivorceRegistration, FormerSpouse, MarriageManualReviewAssignment, DivorceSpouseSdidSyncStatus, FoundationalIdentity } from "@/domain/crvs/types";
import { assertTransitionDivorceSync, assertTransitionDivorceSpouseSync, aggregateDivorceSyncStatus } from "@/domain/crvs/statusMachines";
import { divorceSyncIdempotencyKey } from "@/domain/crvs/idempotency";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const SYNC_SUCCESS_RATE = 0.82;

const FAILURE_CODES: { code: string; message: string }[] = [
  { code: "SDID_SERVICE_TIMEOUT", message: "The identity service did not respond in time." },
  { code: "SDID_DATA_CONFLICT", message: "Submitted marital-status update conflicts with an existing SDID record." },
  { code: "SDID_VALIDATION_ERROR", message: "The identity service rejected the submitted update as incomplete." },
];

export type DivorceSpouseKey = "spouse1" | "spouse2";
const SPOUSE_KEYS: DivorceSpouseKey[] = ["spouse1", "spouse2"];

const findMatchingIdentity = (
  db: ReturnType<typeof getDemoData>,
  spouse: FormerSpouse,
  sub: { linkedFoundationalIdentityId?: string }
): FoundationalIdentity | undefined => {
  if (sub.linkedFoundationalIdentityId) {
    const byId = db.crvsFoundationalIdentities.find((f) => f.id === sub.linkedFoundationalIdentityId);
    if (byId) return byId;
  }
  if (spouse.nin) {
    const byNin = db.crvsFoundationalIdentities.find((f) => f.fictionalNin === spouse.nin);
    if (byNin) return byNin;
  }
  if (spouse.sdidIdentityId) {
    const byIdentityId = db.crvsFoundationalIdentities.find((f) => f.id === spouse.sdidIdentityId);
    if (byIdentityId) return byIdentityId;
  }
  return undefined;
};

/** Marks a just-registered divorce ready to synchronize. Idempotent — a case
 * whose aggregate isn't NOT_READY is untouched. */
export const enqueueDivorceSdidSync = (caseId: string): void => {
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) return db;
    if (reg.sdid.status !== "NOT_READY") return db;
    assertTransitionDivorceSync("NOT_READY", "PENDING");
    reg.sdid.status = "PENDING";
    for (const key of SPOUSE_KEYS) {
      const sub = reg.sdid[key];
      if (sub.status === "NOT_READY") {
        assertTransitionDivorceSpouseSync("NOT_READY", "PENDING");
        sub.status = "PENDING";
        sub.idempotencyKey = sub.idempotencyKey || divorceSyncIdempotencyKey(caseId, key === "spouse1" ? "SPOUSE1" : "SPOUSE2");
      }
    }
    return db;
  });
};

/** Dissolves the EXISTING relationship between both identities rather than
 * creating a new one — never merges the two identities, never deletes the
 * relationship record, only flips its status (spec §13/§23). Idempotent via
 * reg.sdid.relationshipDissolved. */
const ensureRelationshipDissolved = (
  db: ReturnType<typeof getDemoData>,
  reg: DivorceRegistration,
  identity1: FoundationalIdentity,
  identity2: FoundationalIdentity,
  now: string
): void => {
  if (reg.sdid.relationshipDissolved) return;
  for (const identity of [identity1, identity2]) {
    const relationship = (identity.relationships || []).find(
      (r) => (r.identityAId === identity1.id && r.identityBId === identity2.id) || (r.identityAId === identity2.id && r.identityBId === identity1.id)
    );
    if (relationship) relationship.status = "DISSOLVED";
  }
  reg.sdid.relationshipDissolved = true;
};

/** Independently attempts one former spouse's own maritalStatus field
 * update. Never touches the other spouse's sub-record or random draw. */
const applySpouseSyncAttempt = (
  db: ReturnType<typeof getDemoData>,
  reg: DivorceRegistration,
  spouseKey: DivorceSpouseKey,
  identity: FoundationalIdentity,
  actorName: string,
  now: string
): void => {
  const sub = reg.sdid[spouseKey];
  const succeeded = Math.random() < SYNC_SUCCESS_RATE;

  if (succeeded) {
    assertTransitionDivorceSpouseSync("IN_PROGRESS", "IDENTITY_UPDATED");
    sub.status = "IDENTITY_UPDATED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.completedAt = now;
    sub.attempts.push({ at: now, outcome: "SUCCESS" });
    sub.lastAttemptAt = now;

    // Mutate only this identity's own marital-status field — never its
    // name, NIN, nationality, address, child relationships, or the other
    // former spouse's record (spec §23).
    identity.maritalStatus = "DIVORCED";
    identity.maritalStatusUpdatedAt = now;
    identity.maritalStatusUpdatedByMarriageReference = reg.reference;

    logCrvsAudit(db, actorName, "synchronised", "crvs.divorce_sync", reg.reference, `SDID identity ${identity.fictionalNin} (${spouseKey}) marital status updated to DIVORCED.`);
  } else {
    const failure = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)];
    assertTransitionDivorceSpouseSync("IN_PROGRESS", "FAILED");
    sub.status = "FAILED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.lastFailureCode = failure.code;
    sub.attempts.push({ at: now, outcome: "FAILED", failureCode: failure.code, failureMessage: failure.message });
    sub.lastAttemptAt = now;
    logCrvsAudit(db, actorName, "synchronisation failed", "crvs.divorce_sync", reg.reference, `${spouseKey}: ${failure.code} — ${failure.message}`);
  }
};

const markSpouseManualReview = (db: ReturnType<typeof getDemoData>, reg: DivorceRegistration, spouseKey: DivorceSpouseKey, reason: string, now: string): void => {
  const sub = reg.sdid[spouseKey];
  assertTransitionDivorceSpouseSync("IN_PROGRESS", "MANUAL_REVIEW");
  sub.status = "MANUAL_REVIEW";
  sub.manualReview = { reason, assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
  sub.lastFailureCode = "SDID_NO_RELIABLE_MATCH";
  sub.attempts.push({ at: now, outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: reason });
  sub.lastAttemptAt = now;
};

export type DivorceSyncOutcome = DivorceRegistration["sdid"]["status"];

/** Runs one full PENDING -> IN_PROGRESS -> aggregate-outcome cycle for BOTH
 * former spouses. If either identity can't be reliably matched, linkage is
 * considered uncertain overall and both spouses go to MANUAL_REVIEW (spec
 * §23 "identity link is uncertain... do not update an uncertain identity")
 * rather than only failing the unmatched one. A synchronization failure must
 * never reverse or delete the divorce registration — this function only
 * ever mutates reg.sdid, never reg.status. */
export const demoProcessDivorceSdidSync = async (caseId: string, actorName: string): Promise<DivorceSyncOutcome> => {
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (reg.sdid.status === "BOTH_IDENTITIES_UPDATED") return db;
    for (const key of SPOUSE_KEYS) {
      const sub = reg.sdid[key];
      if (sub.status !== "IDENTITY_UPDATED") {
        assertTransitionDivorceSpouseSync(sub.status, "IN_PROGRESS");
        sub.status = "IN_PROGRESS";
      }
    }
    assertTransitionDivorceSync(reg.sdid.status, "IN_PROGRESS");
    reg.sdid.status = "IN_PROGRESS";
    return db;
  });

  await demoDelay(null, 900);

  let outcome: DivorceSyncOutcome = "FAILED";
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (reg.sdid.status === "BOTH_IDENTITIES_UPDATED") {
      outcome = "BOTH_IDENTITIES_UPDATED";
      return db;
    }

    const now = new Date().toISOString();
    const identity1 = findMatchingIdentity(db, reg.formerSpouse1, reg.sdid.spouse1);
    const identity2 = findMatchingIdentity(db, reg.formerSpouse2, reg.sdid.spouse2);

    if (!identity1 || !identity2) {
      if (reg.sdid.spouse1.status === "IN_PROGRESS") {
        markSpouseManualReview(db, reg, "spouse1", identity1 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.", now);
      }
      if (reg.sdid.spouse2.status === "IN_PROGRESS") {
        markSpouseManualReview(db, reg, "spouse2", identity2 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.", now);
      }
      const aggregate = aggregateDivorceSyncStatus(reg.sdid.spouse1.status, reg.sdid.spouse2.status);
      assertTransitionDivorceSync("IN_PROGRESS", aggregate);
      reg.sdid.status = aggregate;
      reg.sdid.manualReview = { reason: "Identity linkage could not be confirmed for both former spouses.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
      reg.updatedAt = now;
      reg.version += 1;
      logCrvsAudit(db, actorName, "sent to manual review", "crvs.divorce_sync", reg.reference, "Identity linkage uncertain — divorce remains registered, requires manual review before any identity update.");
      outcome = aggregate;
      return db;
    }

    ensureRelationshipDissolved(db, reg, identity1, identity2, now);

    if (reg.sdid.spouse1.status === "IN_PROGRESS") applySpouseSyncAttempt(db, reg, "spouse1", identity1, actorName, now);
    if (reg.sdid.spouse2.status === "IN_PROGRESS") applySpouseSyncAttempt(db, reg, "spouse2", identity2, actorName, now);

    const aggregate = aggregateDivorceSyncStatus(reg.sdid.spouse1.status, reg.sdid.spouse2.status);
    assertTransitionDivorceSync("IN_PROGRESS", aggregate);
    reg.sdid.status = aggregate;
    reg.updatedAt = now;
    reg.version += 1;
    outcome = aggregate;
    return db;
  });

  return outcome;
};

/** Retries ONLY the named former spouse's own sync sub-record — never
 * re-runs the other spouse's already-succeeded (or independently in-flight)
 * attempt (spec §23 "allow authorized retry... do not rerun the successful
 * update"). */
export const demoRetryDivorceSdidSync = async (caseId: string, spouseKey: DivorceSpouseKey, actorName: string): Promise<DivorceSyncOutcome> => {
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const sub = reg.sdid[spouseKey];
    if (sub.status === "IDENTITY_UPDATED") return db;
    assertTransitionDivorceSpouseSync(sub.status, "IN_PROGRESS");
    sub.status = "IN_PROGRESS";
    if (reg.sdid.status !== "IN_PROGRESS") {
      assertTransitionDivorceSync(reg.sdid.status, "IN_PROGRESS");
      reg.sdid.status = "IN_PROGRESS";
    }
    logCrvsAudit(db, actorName, "retried synchronisation", "crvs.divorce_sync", reg.reference, `Manual retry requested for ${spouseKey}.`);
    return db;
  });

  await demoDelay(null, 700);

  let outcome: DivorceSyncOutcome = "FAILED";
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const now = new Date().toISOString();
    const otherKey: DivorceSpouseKey = spouseKey === "spouse1" ? "spouse2" : "spouse1";
    const spouseField = spouseKey === "spouse1" ? "formerSpouse1" : "formerSpouse2";
    const otherField = otherKey === "spouse1" ? "formerSpouse1" : "formerSpouse2";
    const identity = findMatchingIdentity(db, reg[spouseField], reg.sdid[spouseKey]);
    const otherIdentity = findMatchingIdentity(db, reg[otherField], reg.sdid[otherKey]);

    if (!identity) {
      markSpouseManualReview(db, reg, spouseKey, "No SDID identity could be matched with sufficient confidence.", now);
    } else {
      if (otherIdentity) ensureRelationshipDissolved(db, reg, spouseKey === "spouse1" ? identity : otherIdentity, spouseKey === "spouse1" ? otherIdentity : identity, now);
      applySpouseSyncAttempt(db, reg, spouseKey, identity, actorName, now);
    }

    const aggregate = aggregateDivorceSyncStatus(reg.sdid.spouse1.status, reg.sdid.spouse2.status);
    assertTransitionDivorceSync(reg.sdid.status, aggregate);
    reg.sdid.status = aggregate;
    reg.updatedAt = now;
    reg.version += 1;
    outcome = aggregate;
    return db;
  });

  return outcome;
};

export const demoRetryAllFailedDivorceSdidSync = async (caseId: string, actorName: string): Promise<DivorceSyncOutcome> => {
  const db = getDemoData();
  const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
  if (!reg) throw new NotFoundError("Divorce registration");
  const keysToRetry = SPOUSE_KEYS.filter((k) => reg.sdid[k].status === "FAILED");
  let outcome: DivorceSyncOutcome = reg.sdid.status;
  for (const key of keysToRetry) {
    outcome = await demoRetryDivorceSdidSync(caseId, key, actorName);
  }
  return outcome;
};

export const demoAssignDivorceManualReview = (
  caseId: string,
  assignment: Omit<MarriageManualReviewAssignment, "at">,
  actorName: string,
  spouseKey?: DivorceSpouseKey
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const now = new Date().toISOString();
    const keysToFlag: DivorceSpouseKey[] = spouseKey ? [spouseKey] : SPOUSE_KEYS;
    for (const key of keysToFlag) {
      const sub = reg.sdid[key];
      if (sub.status !== "IDENTITY_UPDATED") {
        sub.status = "MANUAL_REVIEW" as DivorceSpouseSdidSyncStatus;
        sub.manualReview = { ...assignment, at: now };
      }
    }
    reg.sdid.manualReview = { ...assignment, at: now };
    const aggregate = aggregateDivorceSyncStatus(reg.sdid.spouse1.status, reg.sdid.spouse2.status);
    reg.sdid.status = aggregate;
    reg.updatedAt = now;
    reg.version += 1;
    logCrvsAudit(db, actorName, "assigned manual review", "crvs.divorce_sync", reg.reference, assignment.reason);
    result = reg;
    return db;
  });
  return result!;
};
