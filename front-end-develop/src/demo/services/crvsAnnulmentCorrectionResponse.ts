// Token-based correction-response flow for marriage annulment (spec §18-
// equivalent, §11 "/respond/:token"). Mirrors
// crvsDivorceCorrectionResponse.ts: looks the registration up by a
// correction request's own responseToken rather than requiring staff
// sign-in, and returns only the scoped AnnulmentApplicantResponseView
// projection — never the full AnnulmentRegistration, and never overwrites
// the originally submitted values (the patch here only ever updates the
// live `applicant`/`evidence` fields, the original statusHistory/
// correctionRequests entries are untouched).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { AnnulmentApplicantResponseView, AnnulmentApplicant, AnnulmentRegistration } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { demoSubmitAnnulmentRegistration } from "./crvsAnnulmentRegistrations";

const findByToken = (db: ReturnType<typeof getDemoData>, token: string) =>
  db.crvsAnnulmentRegistrations.find((r) => r.correctionRequests.some((c) => c.responseToken === token));

export const demoGetAnnulmentApplicantResponseView = async (token: string): Promise<AnnulmentApplicantResponseView | undefined> => {
  const db = getDemoData();
  const reg = findByToken(db, token);
  if (!reg) return demoDelay(undefined);

  const correctionRequest = reg.correctionRequests.find((c) => c.responseToken === token);
  const view: AnnulmentApplicantResponseView = {
    registrationReference: reg.reference,
    correctionRequest,
    applicant: reg.applicant,
    evidence: reg.evidence.filter((e) => !e.removed),
  };
  return demoDelay(view);
};

export const demoUpdateAnnulmentApplicantOwnData = async (token: string, patch: Partial<AnnulmentApplicant>, actorName: string): Promise<{ reference: string }> => {
  let reference = "";
  updateDemoData((db) => {
    const reg = findByToken(db, token);
    if (!reg) throw new NotFoundError("Annulment registration");
    Object.assign(reg.applicant, patch);
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "corrected own data", "crvs.annulment_correction", reg.reference, "Applicant corrected their own submitted information via the secure response link.");
    reference = reg.reference;
    return db;
  });
  return { reference };
};

/** Requires explicit resubmission confirmation from the caller (the public
 * response page's own "confirm resubmission" step) before creating the new
 * RESUBMITTED version — never triggered implicitly by saving a field edit.
 * Awaits demoSubmitAnnulmentRegistration() since (unlike its divorce
 * equivalent) that function is async. */
export const demoResubmitAnnulmentViaToken = async (token: string, actorName: string): Promise<AnnulmentRegistration> => {
  const db = getDemoData();
  const reg = findByToken(db, token);
  if (!reg) throw new NotFoundError("Annulment registration");
  return demoSubmitAnnulmentRegistration(reg.id, actorName);
};

export const demoAcknowledgeAnnulmentCorrectionItem = async (token: string, itemId: string, response: string, actorName: string): Promise<{ reference: string }> => {
  let reference = "";
  updateDemoData((db) => {
    const reg = findByToken(db, token);
    if (!reg) throw new NotFoundError("Annulment registration");
    const correctionRequest = reg.correctionRequests.find((c) => c.responseToken === token);
    const item = correctionRequest?.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("Correction item");
    item.response = response;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "responded to correction item", "crvs.annulment_correction", reg.reference, `${item.section}: ${response}`);
    reference = reg.reference;
    return db;
  });
  return { reference };
};
