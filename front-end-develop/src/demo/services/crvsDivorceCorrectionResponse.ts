// Token-based correction-response flow (spec §18, §8 "/respond/:token").
// Looks the registration up by a correction request's own responseToken
// rather than requiring staff sign-in, and returns only the scoped
// DivorceApplicantResponseView projection — never the full
// DivorceRegistration, and never overwrites the originally submitted
// values (spec §18 "never overwrite the original submission history" — the
// patch here only ever updates the live `applicant`/`evidence` fields, the
// original statusHistory/correctionRequests entries are untouched).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DivorceApplicantResponseView, DivorceApplicant, DivorceRegistration } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { demoSubmitDivorceRegistration } from "./crvsDivorceRegistrations";

const findByToken = (db: ReturnType<typeof getDemoData>, token: string) =>
  db.crvsDivorceRegistrations.find((r) => r.correctionRequests.some((c) => c.responseToken === token));

export const demoGetDivorceApplicantResponseView = async (token: string): Promise<DivorceApplicantResponseView | undefined> => {
  const db = getDemoData();
  const reg = findByToken(db, token);
  if (!reg) return demoDelay(undefined);

  const correctionRequest = reg.correctionRequests.find((c) => c.responseToken === token);
  const view: DivorceApplicantResponseView = {
    registrationReference: reg.reference,
    correctionRequest,
    applicant: reg.applicant,
    evidence: reg.evidence.filter((e) => !e.removed),
  };
  return demoDelay(view);
};

export const demoUpdateDivorceApplicantOwnData = (token: string, patch: Partial<DivorceApplicant>, actorName: string): { reference: string } => {
  let reference = "";
  updateDemoData((db) => {
    const reg = findByToken(db, token);
    if (!reg) throw new NotFoundError("Divorce registration");
    Object.assign(reg.applicant, patch);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "corrected own data", "crvs.divorce_correction", reg.reference, "Applicant corrected their own submitted information via the secure response link.");
    reference = reg.reference;
    return db;
  });
  return { reference };
};

/** Requires explicit resubmission confirmation from the caller (the public
 * response page's own "confirm resubmission" step, spec §18) before
 * creating the new RESUBMITTED version — never triggered implicitly by
 * saving a field edit. */
export const demoResubmitDivorceViaToken = (token: string, actorName: string): DivorceRegistration => {
  const db = getDemoData();
  const reg = findByToken(db, token);
  if (!reg) throw new NotFoundError("Divorce registration");
  return demoSubmitDivorceRegistration(reg.id, actorName);
};

export const demoAcknowledgeDivorceCorrectionItem = (token: string, itemId: string, response: string, actorName: string): { reference: string } => {
  let reference = "";
  updateDemoData((db) => {
    const reg = findByToken(db, token);
    if (!reg) throw new NotFoundError("Divorce registration");
    const correctionRequest = reg.correctionRequests.find((c) => c.responseToken === token);
    const item = correctionRequest?.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("Correction item");
    item.response = response;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "responded to correction item", "crvs.divorce_correction", reg.reference, `${item.section}: ${response}`);
    reference = reg.reference;
    return db;
  });
  return { reference };
};
