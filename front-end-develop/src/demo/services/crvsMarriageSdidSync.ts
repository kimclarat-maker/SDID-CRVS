// Two-party SDID marital-status synchronization (spec §8) — the single most
// novel service in this module. Generalizes crvsDeathSdidSync.ts's shape
// over "which spouse", but never lets one spouse's random outcome affect the
// other's, and never merges the two identities: it (1) links both verified
// identities via a MarriageRelationship record once both are matched, then
// (2) independently attempts each identity's own maritalStatus field update.
// A relationship, once created, is never re-created on retry (idempotent);
// a per-spouse retry only re-attempts that spouse's own field update.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  MarriageApplication,
  MarriageApplicant,
  MarriageRelationship,
  MarriageManualReviewAssignment,
  MarriageSpouseSdidSyncStatus,
  FoundationalIdentity,
} from "@/domain/crvs/types";
import {
  assertTransitionMarriageSync,
  assertTransitionMarriageSpouseSync,
  aggregateMarriageSyncStatus,
} from "@/domain/crvs/statusMachines";
import { marriageSyncIdempotencyKey } from "@/domain/crvs/idempotency";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

const SYNC_SUCCESS_RATE = 0.8;

const FAILURE_CODES: { code: string; message: string }[] = [
  { code: "SDID_SERVICE_TIMEOUT", message: "The identity service did not respond in time." },
  { code: "SDID_DATA_CONFLICT", message: "Submitted marital-status update conflicts with an existing SDID record." },
  { code: "SDID_VALIDATION_ERROR", message: "The identity service rejected the submitted update as incomplete." },
];

export type MarriageSpouseKey = "applicant1" | "applicant2";
const SPOUSE_KEYS: MarriageSpouseKey[] = ["applicant1", "applicant2"];

const findMatchingIdentity = (
  db: ReturnType<typeof getDemoData>,
  applicant: MarriageApplicant,
  sub: { linkedFoundationalIdentityId?: string }
): FoundationalIdentity | undefined => {
  if (sub.linkedFoundationalIdentityId) {
    const byId = db.crvsFoundationalIdentities.find((f) => f.id === sub.linkedFoundationalIdentityId);
    if (byId) return byId;
  }
  if (applicant.nin) {
    const byNin = db.crvsFoundationalIdentities.find((f) => f.fictionalNin === applicant.nin);
    if (byNin) return byNin;
  }
  if (applicant.sdidIdentityId) {
    const byIdentityId = db.crvsFoundationalIdentities.find((f) => f.id === applicant.sdidIdentityId);
    if (byIdentityId) return byIdentityId;
  }
  return undefined;
};

/** Marks a just-registered marriage ready to synchronize. Idempotent — a
 * case whose aggregate isn't NOT_READY is untouched. */
export const enqueueMarriageSdidSync = (caseId: string): void => {
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) return db;
    if (app.sdid.status !== "NOT_READY") return db;
    assertTransitionMarriageSync("NOT_READY", "PENDING");
    app.sdid.status = "PENDING";
    for (const key of SPOUSE_KEYS) {
      const sub = app.sdid[key];
      if (sub.status === "NOT_READY") {
        assertTransitionMarriageSpouseSync("NOT_READY", "PENDING");
        sub.status = "PENDING";
        sub.idempotencyKey = sub.idempotencyKey || marriageSyncIdempotencyKey(caseId, key === "applicant1" ? "APPLICANT1" : "APPLICANT2");
      }
    }
    return db;
  });
};

const ensureRelationship = (
  db: ReturnType<typeof getDemoData>,
  app: MarriageApplication,
  identity1: FoundationalIdentity,
  identity2: FoundationalIdentity,
  now: string
): void => {
  if (app.sdid.relationshipId) return;
  const relationship: MarriageRelationship = {
    id: nextId("MREL"),
    type: "SPOUSE",
    identityAId: identity1.id,
    identityBId: identity2.id,
    marriageRegistrationReference: app.reference,
    createdAt: now,
    status: "ACTIVE",
  };
  identity1.relationships = [...(identity1.relationships || []), relationship];
  identity2.relationships = [...(identity2.relationships || []), relationship];
  app.sdid.relationshipId = relationship.id;
};

/** Independently attempts one spouse's own maritalStatus field update.
 * Never touches the other spouse's sub-record or random draw. */
const applySpouseSyncAttempt = (
  db: ReturnType<typeof getDemoData>,
  app: MarriageApplication,
  spouseKey: MarriageSpouseKey,
  identity: FoundationalIdentity,
  actorName: string,
  now: string
): void => {
  const sub = app.sdid[spouseKey];
  const succeeded = Math.random() < SYNC_SUCCESS_RATE;

  if (succeeded) {
    assertTransitionMarriageSpouseSync("IN_PROGRESS", "IDENTITY_UPDATED");
    sub.status = "IDENTITY_UPDATED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.completedAt = now;
    sub.attempts.push({ at: now, outcome: "SUCCESS" });
    sub.lastAttemptAt = now;

    // Mutate only this identity's own marital-status field — never its
    // name, NIN, nationality, address, or the other spouse's record.
    identity.maritalStatus = "MARRIED";
    identity.maritalStatusUpdatedAt = now;
    identity.maritalStatusUpdatedByMarriageReference = app.reference;

    logCrvsAudit(db, actorName, "synchronised", "crvs.marriage_sync", app.reference, `SDID identity ${identity.fictionalNin} (${spouseKey}) marital status updated to MARRIED.`);
  } else {
    const failure = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)];
    assertTransitionMarriageSpouseSync("IN_PROGRESS", "FAILED");
    sub.status = "FAILED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.lastFailureCode = failure.code;
    sub.attempts.push({ at: now, outcome: "FAILED", failureCode: failure.code, failureMessage: failure.message });
    sub.lastAttemptAt = now;
    logCrvsAudit(db, actorName, "synchronisation failed", "crvs.marriage_sync", app.reference, `${spouseKey}: ${failure.code} — ${failure.message}`);
  }
};

const markSpouseManualReview = (
  db: ReturnType<typeof getDemoData>,
  app: MarriageApplication,
  spouseKey: MarriageSpouseKey,
  reason: string,
  now: string
): void => {
  const sub = app.sdid[spouseKey];
  assertTransitionMarriageSpouseSync("IN_PROGRESS", "MANUAL_REVIEW");
  sub.status = "MANUAL_REVIEW";
  sub.manualReview = { reason, assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
  sub.lastFailureCode = "SDID_NO_RELIABLE_MATCH";
  sub.attempts.push({ at: now, outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: reason });
  sub.lastAttemptAt = now;
};

export type MarriageSyncOutcome = MarriageApplication["sdid"]["status"];

/** Runs one full PENDING -> IN_PROGRESS -> aggregate-outcome cycle for BOTH
 * spouses. If either identity can't be reliably matched, linkage is
 * considered uncertain overall and both spouses go to MANUAL_REVIEW
 * (spec §8: "prevent an unsafe automatic update") rather than only failing
 * the unmatched one. Once both identities ARE matched, the relationship is
 * created and each spouse's own marital-status update is attempted and can
 * independently succeed or fail. */
export const demoProcessMarriageSdidSync = async (caseId: string, actorName: string): Promise<MarriageSyncOutcome> => {
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) throw new NotFoundError("Marriage application");
    if (app.sdid.status === "BOTH_IDENTITIES_UPDATED") return db;
    for (const key of SPOUSE_KEYS) {
      const sub = app.sdid[key];
      if (sub.status !== "IDENTITY_UPDATED") {
        assertTransitionMarriageSpouseSync(sub.status, "IN_PROGRESS");
        sub.status = "IN_PROGRESS";
      }
    }
    assertTransitionMarriageSync(app.sdid.status, "IN_PROGRESS");
    app.sdid.status = "IN_PROGRESS";
    return db;
  });

  await demoDelay(null, 900);

  let outcome: MarriageSyncOutcome = "FAILED";
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) throw new NotFoundError("Marriage application");
    if (app.sdid.status === "BOTH_IDENTITIES_UPDATED") {
      outcome = "BOTH_IDENTITIES_UPDATED";
      return db;
    }

    const now = new Date().toISOString();
    const identity1 = findMatchingIdentity(db, app.applicant1, app.sdid.applicant1);
    const identity2 = findMatchingIdentity(db, app.applicant2, app.sdid.applicant2);

    if (!identity1 || !identity2) {
      // Linkage uncertain for at least one spouse — never guess, mark both
      // for manual review rather than linking one confidently-matched
      // identity to an unconfirmed partner.
      if (app.sdid.applicant1.status === "IN_PROGRESS") {
        markSpouseManualReview(db, app, "applicant1", identity1 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.", now);
      }
      if (app.sdid.applicant2.status === "IN_PROGRESS") {
        markSpouseManualReview(db, app, "applicant2", identity2 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.", now);
      }
      const aggregate = aggregateMarriageSyncStatus(app.sdid.applicant1.status, app.sdid.applicant2.status);
      assertTransitionMarriageSync("IN_PROGRESS", aggregate);
      app.sdid.status = aggregate;
      app.sdid.manualReview = { reason: "Identity linkage could not be confirmed for both spouses.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
      app.updatedAt = now;
      app.version += 1;
      logCrvsAudit(db, actorName, "sent to manual review", "crvs.marriage_sync", app.reference, "Identity linkage uncertain — marriage remains registered, requires manual review before any identity update.");
      outcome = aggregate;
      return db;
    }

    ensureRelationship(db, app, identity1, identity2, now);

    if (app.sdid.applicant1.status === "IN_PROGRESS") applySpouseSyncAttempt(db, app, "applicant1", identity1, actorName, now);
    if (app.sdid.applicant2.status === "IN_PROGRESS") applySpouseSyncAttempt(db, app, "applicant2", identity2, actorName, now);

    const aggregate = aggregateMarriageSyncStatus(app.sdid.applicant1.status, app.sdid.applicant2.status);
    assertTransitionMarriageSync("IN_PROGRESS", aggregate);
    app.sdid.status = aggregate;
    app.updatedAt = now;
    app.version += 1;
    outcome = aggregate;
    return db;
  });

  return outcome;
};

/** Retries ONLY the named spouse's own sync sub-record — never re-runs the
 * other spouse's already-succeeded (or independently in-flight) attempt
 * (spec §8: "allow a targeted retry ... do not repeat the successful update
 * unnecessarily"). */
export const demoRetryMarriageSdidSync = async (caseId: string, spouseKey: MarriageSpouseKey, actorName: string): Promise<MarriageSyncOutcome> => {
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) throw new NotFoundError("Marriage application");
    const sub = app.sdid[spouseKey];
    if (sub.status === "IDENTITY_UPDATED") return db;
    assertTransitionMarriageSpouseSync(sub.status, "IN_PROGRESS");
    sub.status = "IN_PROGRESS";
    // Route the case-level aggregate through IN_PROGRESS too, mirroring
    // demoProcessMarriageSdidSync's own phase-1 step — IN_PROGRESS already
    // fans out to every possible outcome in the transition table, so the
    // final recompute below never needs a bespoke entry for every
    // PARTIAL_FAILURE/FAILED/MANUAL_REVIEW -> X jump a retry could produce.
    if (app.sdid.status !== "IN_PROGRESS") {
      assertTransitionMarriageSync(app.sdid.status, "IN_PROGRESS");
      app.sdid.status = "IN_PROGRESS";
    }
    logCrvsAudit(db, actorName, "retried synchronisation", "crvs.marriage_sync", app.reference, `Manual retry requested for ${spouseKey}.`);
    return db;
  });

  await demoDelay(null, 700);

  let outcome: MarriageSyncOutcome = "FAILED";
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    const otherKey: MarriageSpouseKey = spouseKey === "applicant1" ? "applicant2" : "applicant1";
    const identity = findMatchingIdentity(db, app[spouseKey], app.sdid[spouseKey]);
    const otherIdentity = findMatchingIdentity(db, app[otherKey], app.sdid[otherKey]);

    if (!identity) {
      markSpouseManualReview(db, app, spouseKey, "No SDID identity could be matched with sufficient confidence.", now);
    } else {
      if (otherIdentity) ensureRelationship(db, app, spouseKey === "applicant1" ? identity : otherIdentity, spouseKey === "applicant1" ? otherIdentity : identity, now);
      applySpouseSyncAttempt(db, app, spouseKey, identity, actorName, now);
    }

    const aggregate = aggregateMarriageSyncStatus(app.sdid.applicant1.status, app.sdid.applicant2.status);
    assertTransitionMarriageSync(app.sdid.status, aggregate);
    app.sdid.status = aggregate;
    app.updatedAt = now;
    app.version += 1;
    outcome = aggregate;
    return db;
  });

  return outcome;
};

export const demoAssignMarriageManualReview = (
  caseId: string,
  assignment: Omit<MarriageManualReviewAssignment, "at">,
  actorName: string,
  spouseKey?: MarriageSpouseKey
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === caseId);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    const keysToFlag: MarriageSpouseKey[] = spouseKey ? [spouseKey] : SPOUSE_KEYS;
    for (const key of keysToFlag) {
      const sub = app.sdid[key];
      if (sub.status !== "IDENTITY_UPDATED") {
        sub.status = "MANUAL_REVIEW" as MarriageSpouseSdidSyncStatus;
        sub.manualReview = { ...assignment, at: now };
      }
    }
    app.sdid.manualReview = { ...assignment, at: now };
    const aggregate = aggregateMarriageSyncStatus(app.sdid.applicant1.status, app.sdid.applicant2.status);
    app.sdid.status = aggregate;
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "assigned manual review", "crvs.marriage_sync", app.reference, assignment.reason);
    result = app;
    return db;
  });
  return result!;
};
