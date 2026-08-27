// Evidence metadata handling for marriage applications — mirrors
// crvsDeathEvidence.ts exactly (metadata + small safe-preview only, never
// raw file bytes, per spec §10) against db.crvsMarriageApplications.
import { updateDemoData } from "../storage/demoStore";
import { MarriageEvidence, MarriageApplication } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { AttachEvidenceInput } from "./crvsEvidence";

// Both mutations return the full updated application (not just the evidence
// item) so the wizard can resync its local `version` after this out-of-band
// write, rather than its next autosave call using a stale expectedVersion.
export const demoAttachMarriageEvidence = (applicationId: string, input: AttachEvidenceInput, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const item: MarriageEvidence = {
      id: nextId("MEV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
    };
    app.evidence.push(item);
    app.updatedAt = item.uploadedAt;
    app.version += 1;
    result = app;
    logCrvsAudit(db, actorName, "attached evidence", "crvs.marriage_evidence", app.reference, `${input.documentType}: ${input.fileName}`);
    return db;
  });
  return result!;
};

export const demoRemoveMarriageEvidence = (applicationId: string, evidenceId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    if (app.status !== "DRAFT" && app.status !== "CORRECTION_REQUIRED") {
      throw new Error("Evidence can only be removed while the application is a draft or awaiting correction.");
    }
    const evidence = app.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    app.evidence = app.evidence.filter((e) => e.id !== evidenceId);
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    result = app;
    logCrvsAudit(db, actorName, "removed evidence", "crvs.marriage_evidence", app.reference, `${evidence.documentType}: ${evidence.fileName}`);
    return db;
  });
  return result!;
};
