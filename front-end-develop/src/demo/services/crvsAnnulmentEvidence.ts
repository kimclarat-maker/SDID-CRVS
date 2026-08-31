// Evidence metadata handling for marriage-annulment registrations — mirrors
// crvsDivorceEvidence.ts exactly (metadata + small safe-preview only, never
// raw file bytes, per spec §7) against db.crvsAnnulmentRegistrations. Also
// covers mark-valid/mark-invalid/request-replacement for the Evidence tab
// (spec §16 equivalent).
import { updateDemoData } from "../storage/demoStore";
import { AnnulmentEvidence, AnnulmentRegistration } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { AttachEvidenceInput } from "./crvsEvidence";

export const demoAttachAnnulmentEvidence = async (registrationId: string, input: AttachEvidenceInput, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const item: AnnulmentEvidence = {
      id: nextId("AEV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
    };
    reg.evidence.push(item);
    reg.updatedAt = item.uploadedAt;
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "attached evidence", "crvs.annulment_evidence", reg.reference, `${input.documentType}: ${input.fileName}`);
    return db;
  });
  return result!;
};

export const demoReplaceAnnulmentEvidence = async (registrationId: string, evidenceId: string, input: AttachEvidenceInput, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const previous = reg.evidence.find((e) => e.id === evidenceId);
    if (!previous) throw new NotFoundError("Evidence item");
    previous.removed = true;
    const item: AnnulmentEvidence = {
      id: nextId("AEV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
      replacedFromId: previous.id,
    };
    reg.evidence.push(item);
    reg.updatedAt = item.uploadedAt;
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "replaced evidence", "crvs.annulment_evidence", reg.reference, `${input.documentType}: ${input.fileName} (replaces ${previous.fileName})`);
    return db;
  });
  return result!;
};

export const demoRemoveAnnulmentEvidence = async (registrationId: string, evidenceId: string, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.status !== "DRAFT" && reg.status !== "CORRECTION_REQUIRED") {
      throw new Error("Evidence can only be removed while the registration is a draft or awaiting correction.");
    }
    const evidence = reg.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    reg.evidence = reg.evidence.filter((e) => e.id !== evidenceId);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "removed evidence", "crvs.annulment_evidence", reg.reference, `${evidence.documentType}: ${evidence.fileName}`);
    return db;
  });
  return result!;
};

export const demoSetAnnulmentEvidenceVerification = async (
  registrationId: string,
  evidenceId: string,
  verification: AnnulmentEvidence["verification"],
  actorName: string,
  note?: string
): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const evidence = reg.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    evidence.verification = verification;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "set evidence verification", "crvs.annulment_evidence", reg.reference, `${evidence.documentType}: ${verification}${note ? ` — ${note}` : ""}`);
    return db;
  });
  return result!;
};
