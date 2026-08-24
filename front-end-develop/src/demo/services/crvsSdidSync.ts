// Simulated SDID synchronization: queues after official registration,
// "processes" with an injected success/failure outcome (mirrors the existing
// demoSyncOfflineApplication ~70%-success idiom), and on success creates
// exactly one FoundationalIdentity guarded by an idempotency key so retries
// (or accidental re-queues) can never create a second identity or a second
// fictional NIN. Failure never reverses the CRVS registration itself.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { BirthRegistrationCase, FoundationalIdentity, ManualReviewAssignment } from "@/domain/crvs/types";
import { assertTransitionSync } from "@/domain/crvs/statusMachines";
import { syncIdempotencyKey } from "@/domain/crvs/idempotency";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const SYNC_SUCCESS_RATE = 0.8;

const FAILURE_CODES: { code: string; message: string }[] = [
  { code: "SDID_SERVICE_TIMEOUT", message: "The identity service did not respond in time." },
  { code: "SDID_DATA_CONFLICT", message: "Submitted details conflict with an existing SDID record." },
  { code: "SDID_VALIDATION_ERROR", message: "The identity service rejected the submitted record as incomplete." },
];

const nextFictionalNin = (db: ReturnType<typeof getDemoData>) => {
  const seq = db.crvsFoundationalIdentities.length + 1;
  return `DEMO-NIN-2026-${seq.toString().padStart(6, "0")}`;
};

/** Marks a just-registered case ready to synchronize. Idempotent: a case
 * already PENDING/IN_PROGRESS/IDENTITY_CREATED is left untouched. */
export const enqueueSdidSync = (caseId: string): void => {
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) return db;
    if (registrationCase.sdid.status !== "NOT_READY") return db;
    assertTransitionSync("NOT_READY", "PENDING");
    registrationCase.sdid.status = "PENDING";
    registrationCase.sdid.idempotencyKey = syncIdempotencyKey(caseId);
    return db;
  });
};

const createOrReuseFoundationalIdentity = (
  db: ReturnType<typeof getDemoData>,
  registrationCaseId: string
): FoundationalIdentity => {
  const registrationCase = db.crvsRegistrations.find((c) => c.id === registrationCaseId)!;
  const key = registrationCase.sdid.idempotencyKey || syncIdempotencyKey(registrationCaseId);

  const existing = db.crvsFoundationalIdentities.find((f) => f.idempotencyKey === key);
  if (existing) return existing;

  const identity: FoundationalIdentity = {
    id: `FID-${Date.now()}`,
    fictionalNin: nextFictionalNin(db),
    childFirstName: registrationCase.child.firstName,
    childMiddleName: registrationCase.child.middleName,
    childLastName: registrationCase.child.lastName,
    sex: registrationCase.child.sex,
    dateOfBirth: registrationCase.child.dateOfBirth,
    placeOfBirth: registrationCase.placeOfBirth,
    birthRecordReference: registrationCase.officialBirthRecordNumber || registrationCase.reference,
    motherLink: registrationCase.mother.documentNumber,
    fatherLink: registrationCase.father.documentNumber,
    identityStatus: "MINOR_ACTIVE",
    biometrics: "NOT_REQUIRED_FOR_NEWBORN",
    credential: "NOT_ISSUED",
    source: "CRVS_BIRTH_RECORD",
    createdAt: new Date().toISOString(),
    idempotencyKey: key,
  };
  db.crvsFoundationalIdentities.push(identity);
  return identity;
};

export type SyncOutcome = "IDENTITY_CREATED" | "FAILED";

/** Runs one full PENDING -> IN_PROGRESS -> (IDENTITY_CREATED | FAILED) simulation. */
export const demoProcessSdidSync = async (caseId: string, actorName: string): Promise<SyncOutcome> => {
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (registrationCase.sdid.status === "IDENTITY_CREATED") return db;
    assertTransitionSync(registrationCase.sdid.status, "IN_PROGRESS");
    registrationCase.sdid.status = "IN_PROGRESS";
    return db;
  });

  await demoDelay(null, 900);

  let outcome: SyncOutcome = "FAILED";
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (registrationCase.sdid.status === "IDENTITY_CREATED") {
      outcome = "IDENTITY_CREATED";
      return db;
    }

    const now = new Date().toISOString();
    const succeeded = Math.random() < SYNC_SUCCESS_RATE;

    if (succeeded) {
      const identity = createOrReuseFoundationalIdentity(db, caseId);
      assertTransitionSync("IN_PROGRESS", "IDENTITY_CREATED");
      registrationCase.sdid.status = "IDENTITY_CREATED";
      registrationCase.sdid.foundationalIdentityId = identity.id;
      registrationCase.sdid.fictionalNin = identity.fictionalNin;
      registrationCase.sdid.completedAt = now;
      registrationCase.sdid.attempts.push({ at: now, outcome: "SUCCESS" });
      registrationCase.sdid.lastAttemptAt = now;
      outcome = "IDENTITY_CREATED";
      logCrvsAudit(db, actorName, "synchronised", "crvs.sync", registrationCase.reference, `Foundational identity created; fictional NIN ${identity.fictionalNin}.`);
    } else {
      const failure = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)];
      assertTransitionSync("IN_PROGRESS", "FAILED");
      registrationCase.sdid.status = "FAILED";
      registrationCase.sdid.lastFailureCode = failure.code;
      registrationCase.sdid.attempts.push({ at: now, outcome: "FAILED", failureCode: failure.code, failureMessage: failure.message });
      registrationCase.sdid.lastAttemptAt = now;
      outcome = "FAILED";
      logCrvsAudit(db, actorName, "synchronisation failed", "crvs.sync", registrationCase.reference, `${failure.code}: ${failure.message}`);
    }

    registrationCase.updatedAt = now;
    registrationCase.version += 1;
    return db;
  });

  return outcome;
};

export const demoRetrySdidSync = async (caseId: string, actorName: string): Promise<SyncOutcome> => {
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (registrationCase.sdid.status === "IDENTITY_CREATED") return db;
    assertTransitionSync(registrationCase.sdid.status, "IN_PROGRESS");
    logCrvsAudit(db, actorName, "retried synchronisation", "crvs.sync", registrationCase.reference, "Manual retry requested.");
    return db;
  });
  return demoProcessSdidSync(caseId, actorName);
};

export const demoAssignManualReview = (
  caseId: string,
  assignment: Omit<ManualReviewAssignment, "at">,
  actorName: string
): BirthRegistrationCase => {
  let result: BirthRegistrationCase | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    assertTransitionSync(registrationCase.sdid.status, "MANUAL_REVIEW");
    registrationCase.sdid.status = "MANUAL_REVIEW";
    registrationCase.sdid.manualReview = { ...assignment, at: new Date().toISOString() };
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "assigned manual review", "crvs.sync", registrationCase.reference, assignment.reason);
    result = registrationCase;
    return db;
  });
  return result!;
};
