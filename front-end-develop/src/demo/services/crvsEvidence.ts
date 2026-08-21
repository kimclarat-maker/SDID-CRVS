// Evidence metadata handling. Per spec §10, demo mode stores metadata and a
// small safe-preview fixture only — never the actual file bytes in
// localStorage. Preview generation is capped: only small image-like files
// get an inline data-URI preview; everything else stores metadata alone.
import { updateDemoData } from "../storage/demoStore";
import { EvidenceItem } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

const MAX_PREVIEW_BYTES = 40_000;

export const buildSafePreview = async (file: File): Promise<string | undefined> => {
  const isImage = file.type.startsWith("image/");
  if (!isImage || file.size > MAX_PREVIEW_BYTES) return undefined;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
};

export type AttachEvidenceInput = {
  documentType: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  description?: string;
  documentDate?: string;
  issuingAuthority?: string;
  previewDataUri?: string;
};

export const demoAttachEvidence = (
  caseId: string,
  input: AttachEvidenceInput,
  actorName: string
): EvidenceItem => {
  let created: EvidenceItem | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    const item: EvidenceItem = {
      id: nextId("EV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
    };
    registrationCase.evidence.push(item);
    registrationCase.updatedAt = item.uploadedAt;
    registrationCase.version += 1;
    created = item;
    logCrvsAudit(db, actorName, "attached evidence", "crvs.evidence", registrationCase.reference, `${input.documentType}: ${input.fileName}`);
    return db;
  });
  return created!;
};

export const demoReplaceEvidence = (
  caseId: string,
  evidenceId: string,
  input: AttachEvidenceInput,
  actorName: string
): EvidenceItem => {
  let created: EvidenceItem | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    const original = registrationCase.evidence.find((e) => e.id === evidenceId);
    if (!original) throw new NotFoundError("Evidence item");
    original.removed = true;
    const item: EvidenceItem = {
      id: nextId("EV"),
      ...input,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      verification: "NOT_VERIFIED",
      replacedFromId: evidenceId,
    };
    registrationCase.evidence.push(item);
    registrationCase.updatedAt = item.uploadedAt;
    registrationCase.version += 1;
    created = item;
    logCrvsAudit(db, actorName, "replaced evidence", "crvs.evidence", registrationCase.reference, `${input.documentType}: ${input.fileName} (replaces ${original.fileName})`);
    return db;
  });
  return created!;
};

/** Draft-only hard removal; once submitted, evidence is only removable via
 * a correction cycle (see demoReplaceEvidence, invoked from the correction
 * page, which soft-replaces rather than deletes). */
export const demoRemoveEvidence = (caseId: string, evidenceId: string, actorName: string): void => {
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (registrationCase.status !== "DRAFT") {
      throw new Error("Evidence can only be removed while the case is still a draft.");
    }
    const evidence = registrationCase.evidence.find((e) => e.id === evidenceId);
    if (!evidence) throw new NotFoundError("Evidence item");
    registrationCase.evidence = registrationCase.evidence.filter((e) => e.id !== evidenceId);
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "removed evidence", "crvs.evidence", registrationCase.reference, `${evidence.documentType}: ${evidence.fileName}`);
    return db;
  });
};
