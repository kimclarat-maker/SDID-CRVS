// Simulated SDID "mark deceased" synchronization. Mirrors crvsSdidSync.ts's
// shape closely, but never creates a FoundationalIdentity — it only ever
// mutates an existing one in place (identityStatus -> "DECEASED"), and when
// no reliable identity match exists it goes straight to MANUAL_REVIEW
// instead of a randomized failure (spec §7: "do not fabricate an identity
// merely to mark it deceased"). A randomized failure is reserved for the
// case where a match WAS found but the simulated sync call itself fails —
// that path never reverses the death registration and is always retryable.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DeathRegistrationCase, FoundationalIdentity, DeathManualReviewAssignment } from "@/domain/crvs/types";
import { assertTransitionDeathSync } from "@/domain/crvs/statusMachines";
import { syncIdempotencyKey } from "@/domain/crvs/idempotency";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const SYNC_SUCCESS_RATE = 0.8;

const FAILURE_CODES: { code: string; message: string }[] = [
  { code: "SDID_SERVICE_TIMEOUT", message: "The identity service did not respond in time." },
  { code: "SDID_DATA_CONFLICT", message: "Submitted details conflict with an existing SDID record." },
  { code: "SDID_VALIDATION_ERROR", message: "The identity service rejected the submitted record as incomplete." },
];

const deathSyncIdempotencyKey = (caseId: string) => `DEATH-${syncIdempotencyKey(caseId)}`;

/** Marks a just-registered death case ready to synchronize. Idempotent: a
 * case already PENDING/IN_PROGRESS/IDENTITY_MARKED_DECEASED is untouched. */
export const enqueueDeathSdidSync = (caseId: string): void => {
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) return db;
    if (deathCase.sdid.status !== "NOT_READY") return db;
    assertTransitionDeathSync("NOT_READY", "PENDING");
    deathCase.sdid.status = "PENDING";
    deathCase.sdid.idempotencyKey = deathCase.sdid.idempotencyKey || deathSyncIdempotencyKey(caseId);
    return db;
  });
};

/** Finds an existing FoundationalIdentity for the deceased — by an
 * already-linked id (set at seed time or a prior attempt), then by NIN,
 * then by the deceased's sdidIdentityId. Never creates one. */
const findMatchingIdentity = (
  db: ReturnType<typeof getDemoData>,
  deathCase: DeathRegistrationCase
): FoundationalIdentity | undefined => {
  if (deathCase.sdid.linkedFoundationalIdentityId) {
    const byId = db.crvsFoundationalIdentities.find((f) => f.id === deathCase.sdid.linkedFoundationalIdentityId);
    if (byId) return byId;
  }
  if (deathCase.deceased.nin) {
    const byNin = db.crvsFoundationalIdentities.find((f) => f.fictionalNin === deathCase.deceased.nin);
    if (byNin) return byNin;
  }
  if (deathCase.deceased.sdidIdentityId) {
    const byIdentityId = db.crvsFoundationalIdentities.find((f) => f.id === deathCase.deceased.sdidIdentityId);
    if (byIdentityId) return byIdentityId;
  }
  return undefined;
};

export type DeathSyncOutcome = "IDENTITY_MARKED_DECEASED" | "FAILED" | "MANUAL_REVIEW";

/** Runs one full PENDING -> IN_PROGRESS -> (IDENTITY_MARKED_DECEASED |
 * FAILED | MANUAL_REVIEW) simulation. */
export const demoProcessDeathSdidSync = async (caseId: string, actorName: string): Promise<DeathSyncOutcome> => {
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (deathCase.sdid.status === "IDENTITY_MARKED_DECEASED") return db;
    assertTransitionDeathSync(deathCase.sdid.status, "IN_PROGRESS");
    deathCase.sdid.status = "IN_PROGRESS";
    return db;
  });

  await demoDelay(null, 900);

  let outcome: DeathSyncOutcome = "FAILED";
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (deathCase.sdid.status === "IDENTITY_MARKED_DECEASED") {
      outcome = "IDENTITY_MARKED_DECEASED";
      return db;
    }

    const now = new Date().toISOString();
    const identity = findMatchingIdentity(db, deathCase);

    if (!identity) {
      assertTransitionDeathSync("IN_PROGRESS", "MANUAL_REVIEW");
      deathCase.sdid.status = "MANUAL_REVIEW";
      deathCase.sdid.manualReview = {
        reason: "No SDID identity could be matched with sufficient confidence.",
        assignedTo: "crvs.supervisor@demo.identity.local",
        priority: "MEDIUM",
        at: now,
      };
      deathCase.sdid.lastFailureCode = "SDID_NO_RELIABLE_MATCH";
      deathCase.sdid.attempts.push({ at: now, outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: "No SDID identity could be matched with sufficient confidence." });
      deathCase.sdid.lastAttemptAt = now;
      outcome = "MANUAL_REVIEW";
      logCrvsAudit(db, actorName, "sent to manual review", "crvs.death_sync", deathCase.reference, "No reliable SDID identity match — death remains registered, identity linkage requires manual review.");
      deathCase.updatedAt = now;
      deathCase.version += 1;
      return db;
    }

    const succeeded = Math.random() < SYNC_SUCCESS_RATE;

    if (succeeded) {
      assertTransitionDeathSync("IN_PROGRESS", "IDENTITY_MARKED_DECEASED");
      deathCase.sdid.status = "IDENTITY_MARKED_DECEASED";
      deathCase.sdid.linkedFoundationalIdentityId = identity.id;
      deathCase.sdid.linkedNin = identity.fictionalNin;
      deathCase.sdid.completedAt = now;
      deathCase.sdid.crvsReference = deathCase.reference;
      deathCase.sdid.attempts.push({ at: now, outcome: "SUCCESS" });
      deathCase.sdid.lastAttemptAt = now;

      // Mutate the identity in place — never delete, never recreate.
      // Every other field (NIN, relationships, credential/biometrics
      // history) is preserved untouched.
      identity.identityStatus = "DECEASED";
      identity.deceasedAt = now;
      identity.deceasedByDeathRegistrationReference = deathCase.reference;

      outcome = "IDENTITY_MARKED_DECEASED";
      logCrvsAudit(db, actorName, "synchronised", "crvs.death_sync", deathCase.reference, `SDID identity ${identity.fictionalNin} marked deceased.`);
    } else {
      const failure = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)];
      assertTransitionDeathSync("IN_PROGRESS", "FAILED");
      deathCase.sdid.status = "FAILED";
      deathCase.sdid.linkedFoundationalIdentityId = identity.id;
      deathCase.sdid.linkedNin = identity.fictionalNin;
      deathCase.sdid.lastFailureCode = failure.code;
      deathCase.sdid.attempts.push({ at: now, outcome: "FAILED", failureCode: failure.code, failureMessage: failure.message });
      deathCase.sdid.lastAttemptAt = now;
      outcome = "FAILED";
      logCrvsAudit(db, actorName, "synchronisation failed", "crvs.death_sync", deathCase.reference, `${failure.code}: ${failure.message}`);
    }

    deathCase.updatedAt = now;
    deathCase.version += 1;
    return db;
  });

  return outcome;
};

export const demoRetryDeathSdidSync = async (caseId: string, actorName: string): Promise<DeathSyncOutcome> => {
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (deathCase.sdid.status === "IDENTITY_MARKED_DECEASED") return db;
    assertTransitionDeathSync(deathCase.sdid.status, "IN_PROGRESS");
    logCrvsAudit(db, actorName, "retried synchronisation", "crvs.death_sync", deathCase.reference, "Manual retry requested.");
    return db;
  });
  return demoProcessDeathSdidSync(caseId, actorName);
};

export const demoAssignDeathManualReview = (
  caseId: string,
  assignment: Omit<DeathManualReviewAssignment, "at">,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    assertTransitionDeathSync(deathCase.sdid.status, "MANUAL_REVIEW");
    deathCase.sdid.status = "MANUAL_REVIEW";
    deathCase.sdid.manualReview = { ...assignment, at: new Date().toISOString() };
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "assigned manual review", "crvs.death_sync", deathCase.reference, assignment.reason);
    result = deathCase;
    return db;
  });
  return result!;
};
