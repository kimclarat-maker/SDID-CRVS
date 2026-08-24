// Evidence metadata handling for death cases — mirrors crvsEvidence.ts
// exactly (same "metadata + small safe-preview only, never raw file bytes"
// rule from spec §10) against db.crvsDeathRegistrations instead of
// db.crvsRegistrations. buildSafePreview() is pure and reused as-is.
import { updateDemoData } from "../storage/demoStore";
import { DeathEvidence, DeathRegistrationCase } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { AttachEvidenceInput } from "./crvsEvidence";

// Both mutations return the full updated case (not just the evidence item)
// so callers — the wizard in particular — can resync their local `version`
// after this out-of-band write, rather than the wizard's own next
// autosave call using a stale expectedVersion and failing with
// ConcurrencyError.
export const demoAttachDeathEvidence = (caseId: string, input: AttachEvidenceInput, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    const item: DeathEvidence = {
      id: nextId("DEV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
    };
    deathCase.evidence.push(item);
    deathCase.updatedAt = item.uploadedAt;
    deathCase.version += 1;
    result = deathCase;
    logCrvsAudit(db, actorName, "attached evidence", "crvs.death_registration", deathCase.reference, `${input.documentType}: ${input.fileName}`);
    return db;
  });
  return result!;
};

export const demoRemoveDeathEvidence = (caseId: string, evidenceId: string, actorName: string): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (deathCase.status !== "DRAFT") {
      throw new Error("Evidence can only be removed while the case is still a draft.");
    }
    const evidence = deathCase.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    deathCase.evidence = deathCase.evidence.filter((e) => e.id !== evidenceId);
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    result = deathCase;
    logCrvsAudit(db, actorName, "removed evidence", "crvs.death_registration", deathCase.reference, `${evidence.documentType}: ${evidence.fileName}`);
    return db;
  });
  return result!;
};
