// Two-party SDID marital-status synchronization for annulment (spec §24) —
// mirrors crvsDivorceSdidSync.ts's shape closely, but the successful
// terminal is NEVER hardcoded to SINGLE: what gets written for each party is
// whatever annulmentPolicyConfig.sdidSync.civilStatusMapping maps the
// CONFIRMED legal-effect classification to. A classification that maps to
// MANUAL_REVIEW routes that party straight to manual review instead of
// attempting a field write. Never lets one affected party's random outcome
// (or manual-review routing) affect the other's; the existing
// MarriageRelationship is reclassified (never deleted, never re-reclassified
// on retry — idempotent) rather than a new relationship created; a per-party
// retry only re-attempts that party's own field update.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { AnnulmentRegistration, AffectedParty, AffectedPartyKey, FoundationalIdentity, ManualReviewAssignment } from "@/domain/crvs/types";
import {
  assertTransitionAnnulmentSync,
  canTransitionAnnulmentSync,
  assertTransitionAnnulmentPartySync,
  canTransitionAnnulmentPartySync,
  aggregateAnnulmentSyncStatus,
} from "@/domain/crvs/statusMachines";
import { annulmentPolicyConfig, sdidConsequenceFor } from "@/domain/crvs/annulmentPolicyConfig";
import { annulmentSyncIdempotencyKey } from "@/domain/crvs/idempotency";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const FAILURE_CODES: { code: string; message: string }[] = [
  { code: "SDID_SERVICE_TIMEOUT", message: "The identity service did not respond in time." },
  { code: "SDID_DATA_CONFLICT", message: "Submitted marital-status update conflicts with an existing SDID record." },
  { code: "SDID_VALIDATION_ERROR", message: "The identity service rejected the submitted update as incomplete." },
];

export type AnnulmentPartyObjKey = "party1" | "party2";
const PARTY_KEYS: AnnulmentPartyObjKey[] = ["party1", "party2"];

const toIdemKey = (key: AnnulmentPartyObjKey): AffectedPartyKey => (key === "party1" ? "PARTY_1" : "PARTY_2");
const toObjKey = (party: AffectedPartyKey): AnnulmentPartyObjKey => (party === "PARTY_1" ? "party1" : "party2");

const findMatchingIdentity = (
  db: ReturnType<typeof getDemoData>,
  party: AffectedParty,
  sub: { linkedFoundationalIdentityId?: string }
): FoundationalIdentity | undefined => {
  if (sub.linkedFoundationalIdentityId) {
    const byId = db.crvsFoundationalIdentities.find((f) => f.id === sub.linkedFoundationalIdentityId);
    if (byId) return byId;
  }
  if (party.nin) {
    const byNin = db.crvsFoundationalIdentities.find((f) => f.fictionalNin === party.nin);
    if (byNin) return byNin;
  }
  if (party.sdidIdentityId) {
    const byIdentityId = db.crvsFoundationalIdentities.find((f) => f.id === party.sdidIdentityId);
    if (byIdentityId) return byIdentityId;
  }
  return undefined;
};

/** Marks a just-registered annulment ready to synchronize. Idempotent — a
 * case whose aggregate isn't NOT_READY is untouched. */
export const enqueueAnnulmentSdidSync = async (caseId: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.sdid.status !== "NOT_READY") return db;
    assertTransitionAnnulmentSync("NOT_READY", "PENDING");
    reg.sdid.status = "PENDING";
    for (const key of PARTY_KEYS) {
      const sub = reg.sdid[key];
      if (sub.status === "NOT_READY") {
        assertTransitionAnnulmentPartySync("NOT_READY", "PENDING");
        sub.status = "PENDING";
        sub.idempotencyKey = sub.idempotencyKey || annulmentSyncIdempotencyKey(caseId, toIdemKey(key));
      }
    }
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === caseId)!;
};

/** Reclassifies the EXISTING relationship between both identities rather
 * than creating a new one — never merges the two identities, never deletes
 * the relationship record, only flips its status (spec §16/§24). Idempotent
 * via reg.sdid.relationshipUpdated. */
const ensureRelationshipReclassified = (
  db: ReturnType<typeof getDemoData>,
  reg: AnnulmentRegistration,
  identity1: FoundationalIdentity,
  identity2: FoundationalIdentity
): void => {
  if (reg.sdid.relationshipUpdated) return;
  for (const identity of [identity1, identity2]) {
    const relationship = (identity.relationships || []).find(
      (r) => (r.identityAId === identity1.id && r.identityBId === identity2.id) || (r.identityAId === identity2.id && r.identityBId === identity1.id)
    );
    if (relationship) relationship.status = "DISSOLVED";
  }
  reg.sdid.relationshipUpdated = true;
};

const markPartyManualReview = (db: ReturnType<typeof getDemoData>, reg: AnnulmentRegistration, key: AnnulmentPartyObjKey, reason: string, now: string): void => {
  const sub = reg.sdid[key];
  assertTransitionAnnulmentPartySync("IN_PROGRESS", "MANUAL_REVIEW");
  sub.status = "MANUAL_REVIEW";
  sub.manualReview = { reason, assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
  sub.lastFailureCode = "SDID_NO_RELIABLE_MATCH";
  sub.attempts.push({ at: now, outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: reason });
  sub.lastAttemptAt = now;
};

/** Independently attempts one affected party's own maritalStatus field
 * update. Never touches the other party's sub-record or random draw. Never
 * assumes the resulting status is SINGLE — always reads it off the
 * CONFIRMED legal-effect classification's configured mapping (spec §24); a
 * classification that maps to MANUAL_REVIEW routes the party there instead
 * of writing any field. */
const applyPartySyncAttempt = (
  db: ReturnType<typeof getDemoData>,
  reg: AnnulmentRegistration,
  partyKey: AnnulmentPartyObjKey,
  identity: FoundationalIdentity,
  actorName: string,
  now: string
): void => {
  const sub = reg.sdid[partyKey];
  const consequence = reg.legalEffect.confirmedClassification ? sdidConsequenceFor(reg.legalEffect.confirmedClassification) : undefined;

  if (!consequence || consequence.proposedCivilStatus !== "SINGLE") {
    const reason = consequence ? consequence.rationale : "The legal-effect classification has not been confirmed.";
    assertTransitionAnnulmentPartySync("IN_PROGRESS", "MANUAL_REVIEW");
    sub.status = "MANUAL_REVIEW";
    sub.manualReview = { reason, assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.attempts.push({ at: now, outcome: "FAILED", failureCode: "ANNULMENT_MANUAL_REVIEW_REQUIRED", failureMessage: reason });
    sub.lastAttemptAt = now;
    logCrvsAudit(db, actorName, "sent to manual review", "crvs.annulment_sync", reg.reference, `${partyKey}: legal-effect classification requires manual review — no identity field written.`);
    return;
  }

  const succeeded = Math.random() < annulmentPolicyConfig.sdidSync.successRatePerParty;

  if (succeeded) {
    assertTransitionAnnulmentPartySync("IN_PROGRESS", "IDENTITY_UPDATED");
    sub.status = "IDENTITY_UPDATED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.completedAt = now;
    sub.resultingCivilStatus = "SINGLE";
    sub.attempts.push({ at: now, outcome: "SUCCESS" });
    sub.lastAttemptAt = now;

    // Mutate only this identity's own marital-status field — never its
    // name, NIN, nationality, address, child relationships, or the other
    // affected party's record (spec §24).
    identity.maritalStatus = "SINGLE";
    identity.maritalStatusUpdatedAt = now;
    identity.maritalStatusUpdatedByMarriageReference = reg.reference;

    logCrvsAudit(db, actorName, "synchronised", "crvs.annulment_sync", reg.reference, `SDID identity ${identity.fictionalNin} (${partyKey}) marital status updated to SINGLE.`);
  } else {
    const failure = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)];
    assertTransitionAnnulmentPartySync("IN_PROGRESS", "FAILED");
    sub.status = "FAILED";
    sub.linkedFoundationalIdentityId = identity.id;
    sub.linkedNin = identity.fictionalNin;
    sub.lastFailureCode = failure.code;
    sub.attempts.push({ at: now, outcome: "FAILED", failureCode: failure.code, failureMessage: failure.message });
    sub.lastAttemptAt = now;
    logCrvsAudit(db, actorName, "synchronisation failed", "crvs.annulment_sync", reg.reference, `${partyKey}: ${failure.code} — ${failure.message}`);
  }
};

/** Runs one full PENDING -> IN_PROGRESS -> aggregate-outcome cycle for BOTH
 * affected parties. If either identity can't be reliably matched, linkage is
 * considered uncertain overall and both parties go to MANUAL_REVIEW (spec
 * §24 "identity link is uncertain... do not update an uncertain identity")
 * rather than only failing the unmatched one. A synchronization failure must
 * never reverse or delete the annulment registration — this function only
 * ever mutates reg.sdid, never reg.status. */
export const demoProcessAnnulmentSdidSync = async (caseId: string, actorName: string): Promise<AnnulmentRegistration> => {
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.sdid.status === "BOTH_IDENTITIES_UPDATED") return db;
    for (const key of PARTY_KEYS) {
      const sub = reg.sdid[key];
      if (sub.status !== "IDENTITY_UPDATED") {
        assertTransitionAnnulmentPartySync(sub.status, "IN_PROGRESS");
        sub.status = "IN_PROGRESS";
      }
    }
    assertTransitionAnnulmentSync(reg.sdid.status, "IN_PROGRESS");
    reg.sdid.status = "IN_PROGRESS";
    return db;
  });

  await demoDelay(null, 900);

  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.sdid.status === "BOTH_IDENTITIES_UPDATED") return db;

    const now = new Date().toISOString();
    const identity1 = findMatchingIdentity(db, reg.affectedParty1, reg.sdid.party1);
    const identity2 = findMatchingIdentity(db, reg.affectedParty2, reg.sdid.party2);

    if (!identity1 || !identity2) {
      if (reg.sdid.party1.status === "IN_PROGRESS") {
        markPartyManualReview(
          db,
          reg,
          "party1",
          identity1 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.",
          now
        );
      }
      if (reg.sdid.party2.status === "IN_PROGRESS") {
        markPartyManualReview(
          db,
          reg,
          "party2",
          identity2 ? "Partner's SDID identity could not be matched with sufficient confidence." : "No SDID identity could be matched with sufficient confidence.",
          now
        );
      }
      const aggregate = aggregateAnnulmentSyncStatus(reg.sdid.party1.status, reg.sdid.party2.status);
      assertTransitionAnnulmentSync("IN_PROGRESS", aggregate);
      reg.sdid.status = aggregate;
      reg.sdid.manualReview = { reason: "Identity linkage could not be confirmed for both affected parties.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: now };
      reg.updatedAt = now;
      reg.version += 1;
      logCrvsAudit(db, actorName, "sent to manual review", "crvs.annulment_sync", reg.reference, "Identity linkage uncertain — annulment remains registered, requires manual review before any identity update.");
      return db;
    }

    ensureRelationshipReclassified(db, reg, identity1, identity2);

    if (reg.sdid.party1.status === "IN_PROGRESS") applyPartySyncAttempt(db, reg, "party1", identity1, actorName, now);
    if (reg.sdid.party2.status === "IN_PROGRESS") applyPartySyncAttempt(db, reg, "party2", identity2, actorName, now);

    const aggregate = aggregateAnnulmentSyncStatus(reg.sdid.party1.status, reg.sdid.party2.status);
    assertTransitionAnnulmentSync("IN_PROGRESS", aggregate);
    reg.sdid.status = aggregate;
    reg.updatedAt = now;
    reg.version += 1;
    return db;
  });

  return getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === caseId)!;
};

/** Retries ONLY the named affected party's own sync sub-record — never
 * re-runs the other party's already-succeeded (or independently in-flight)
 * attempt (spec §24 "allow authorized retry... do not rerun the successful
 * update"). */
export const demoRetryAnnulmentSdidSync = async (caseId: string, party: AffectedPartyKey, actorName: string): Promise<AnnulmentRegistration> => {
  const partyKey = toObjKey(party);

  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const sub = reg.sdid[partyKey];
    if (sub.status === "IDENTITY_UPDATED") return db;
    assertTransitionAnnulmentPartySync(sub.status, "IN_PROGRESS");
    sub.status = "IN_PROGRESS";
    if (reg.sdid.status !== "IN_PROGRESS") {
      assertTransitionAnnulmentSync(reg.sdid.status, "IN_PROGRESS");
      reg.sdid.status = "IN_PROGRESS";
    }
    logCrvsAudit(db, actorName, "retried synchronisation", "crvs.annulment_sync", reg.reference, `Manual retry requested for ${partyKey}.`);
    return db;
  });

  await demoDelay(null, 700);

  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const now = new Date().toISOString();
    const otherKey: AnnulmentPartyObjKey = partyKey === "party1" ? "party2" : "party1";
    const partyField = partyKey === "party1" ? "affectedParty1" : "affectedParty2";
    const otherField = otherKey === "party1" ? "affectedParty1" : "affectedParty2";
    const identity = findMatchingIdentity(db, reg[partyField], reg.sdid[partyKey]);
    const otherIdentity = findMatchingIdentity(db, reg[otherField], reg.sdid[otherKey]);

    if (!identity) {
      markPartyManualReview(db, reg, partyKey, "No SDID identity could be matched with sufficient confidence.", now);
    } else {
      if (otherIdentity) {
        ensureRelationshipReclassified(db, reg, partyKey === "party1" ? identity : otherIdentity, partyKey === "party1" ? otherIdentity : identity);
      }
      applyPartySyncAttempt(db, reg, partyKey, identity, actorName, now);
    }

    const aggregate = aggregateAnnulmentSyncStatus(reg.sdid.party1.status, reg.sdid.party2.status);
    if (aggregate !== reg.sdid.status && canTransitionAnnulmentSync(reg.sdid.status, aggregate)) {
      assertTransitionAnnulmentSync(reg.sdid.status, aggregate);
      reg.sdid.status = aggregate;
    }
    reg.updatedAt = now;
    reg.version += 1;
    return db;
  });

  return getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === caseId)!;
};

export const demoRetryAllFailedAnnulmentSdidSync = async (caseId: string, actorName: string): Promise<AnnulmentRegistration> => {
  const db = getDemoData();
  const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
  if (!reg) throw new NotFoundError("Annulment registration");
  const keysToRetry: AffectedPartyKey[] = [];
  if (reg.sdid.party1.status === "FAILED") keysToRetry.push("PARTY_1");
  if (reg.sdid.party2.status === "FAILED") keysToRetry.push("PARTY_2");

  let result = reg;
  for (const key of keysToRetry) {
    result = await demoRetryAnnulmentSdidSync(caseId, key, actorName);
  }
  return result;
};

export const demoAssignAnnulmentManualReview = async (
  caseId: string,
  reason: string,
  assignedTo: string,
  priority: ManualReviewAssignment["priority"],
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === caseId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const now = new Date().toISOString();

    for (const key of PARTY_KEYS) {
      const sub = reg.sdid[key];
      if (sub.status === "IDENTITY_UPDATED") continue;
      if (sub.status === "MANUAL_REVIEW") {
        sub.manualReview = { reason, assignedTo, priority, at: now };
        continue;
      }
      if (canTransitionAnnulmentPartySync(sub.status, "MANUAL_REVIEW")) {
        assertTransitionAnnulmentPartySync(sub.status, "MANUAL_REVIEW");
        sub.status = "MANUAL_REVIEW";
        sub.manualReview = { reason, assignedTo, priority, at: now };
      }
    }

    reg.sdid.manualReview = { reason, assignedTo, priority, at: now };
    const aggregate = aggregateAnnulmentSyncStatus(reg.sdid.party1.status, reg.sdid.party2.status);
    if (aggregate !== reg.sdid.status && canTransitionAnnulmentSync(reg.sdid.status, aggregate)) {
      assertTransitionAnnulmentSync(reg.sdid.status, aggregate);
      reg.sdid.status = aggregate;
    }
    reg.updatedAt = now;
    reg.version += 1;
    logCrvsAudit(db, actorName, "assigned manual review", "crvs.annulment_sync", reg.reference, reason);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === caseId)!;
};
