// Thin service wrapper around the pure domain eligibility engine — mirrors
// crvsDivorceCertificateEligibility.ts's pass-through shape, but scoped to
// TWO distinct assessments (spec §23/§25 models AnnulmentRecordEligibility
// and AnnulmentCertificateEligibility as distinct concepts, since some
// jurisdictions issue only an annulment record and not a certificate).
import { updateDemoData, getDemoData } from "../storage/demoStore";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { assessAnnulmentRecordEligibility, assessAnnulmentCertificateEligibility } from "@/domain/crvs/annulmentCertificateEligibility";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoCheckAnnulmentRecordEligibility = async (registrationId: string, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const verdict = assessAnnulmentRecordEligibility({ registration: reg });
    reg.recordEligibility = { status: verdict.status, checkedAt: new Date().toISOString(), reasons: verdict.reasons };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "checked record eligibility", "crvs.annulment_certificate", reg.reference, `Status: ${verdict.status}.`);
    result = reg;
    return db;
  });
  return result!;
};

export const demoGetAnnulmentRecordEligibility = (registrationId: string) => {
  const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
  if (!reg) throw new NotFoundError("Annulment registration");
  return reg.recordEligibility || assessAnnulmentRecordEligibility({ registration: reg });
};

export const demoCheckAnnulmentCertificateEligibility = async (registrationId: string, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const verdict = assessAnnulmentCertificateEligibility({ registration: reg });
    reg.certificateEligibility = { status: verdict.status, checkedAt: new Date().toISOString(), reasons: verdict.reasons };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "checked certificate eligibility", "crvs.annulment_certificate", reg.reference, `Status: ${verdict.status}.`);
    result = reg;
    return db;
  });
  return result!;
};

export const demoGetAnnulmentCertificateEligibility = (registrationId: string) => {
  const reg = getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
  if (!reg) throw new NotFoundError("Annulment registration");
  return reg.certificateEligibility || assessAnnulmentCertificateEligibility({ registration: reg });
};
