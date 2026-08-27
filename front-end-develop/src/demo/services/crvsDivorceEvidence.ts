// Evidence metadata handling for divorce registrations — mirrors
// crvsMarriageEvidence.ts exactly (metadata + small safe-preview only, never
// raw file bytes, per spec §7) against db.crvsDivorceRegistrations. Also
// covers mark-valid/mark-invalid/request-replacement for the Evidence tab
// (spec §16).
import { updateDemoData } from "../storage/demoStore";
import { DivorceEvidence, DivorceRegistration } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { AttachEvidenceInput } from "./crvsEvidence";

export const demoAttachDivorceEvidence = (registrationId: string, input: AttachEvidenceInput, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const item: DivorceEvidence = {
      id: nextId("DEV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
    };
    reg.evidence.push(item);
    reg.updatedAt = item.uploadedAt;
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "attached evidence", "crvs.divorce_evidence", reg.reference, `${input.documentType}: ${input.fileName}`);
    return db;
  });
  return result!;
};

export const demoReplaceDivorceEvidence = (registrationId: string, evidenceId: string, input: AttachEvidenceInput, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const previous = reg.evidence.find((e) => e.id === evidenceId);
    if (!previous) throw new NotFoundError("Evidence item");
    previous.removed = true;
    const item: DivorceEvidence = {
      id: nextId("DEV"),
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
    logCrvsAudit(db, actorName, "replaced evidence", "crvs.divorce_evidence", reg.reference, `${input.documentType}: ${input.fileName} (replaces ${previous.fileName})`);
    return db;
  });
  return result!;
};

export const demoRemoveDivorceEvidence = (registrationId: string, evidenceId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (reg.status !== "DRAFT" && reg.status !== "CORRECTION_REQUIRED") {
      throw new Error("Evidence can only be removed while the registration is a draft or awaiting correction.");
    }
    const evidence = reg.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    reg.evidence = reg.evidence.filter((e) => e.id !== evidenceId);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "removed evidence", "crvs.divorce_evidence", reg.reference, `${evidence.documentType}: ${evidence.fileName}`);
    return db;
  });
  return result!;
};

export const demoSetDivorceEvidenceVerification = (
  registrationId: string,
  evidenceId: string,
  verification: DivorceEvidence["verification"],
  actorName: string,
  note?: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const evidence = reg.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    evidence.verification = verification;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    result = reg;
    logCrvsAudit(db, actorName, "set evidence verification", "crvs.divorce_evidence", reg.reference, `${evidence.documentType}: ${verification}${note ? ` — ${note}` : ""}`);
    return db;
  });
  return result!;
};
