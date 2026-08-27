// Thin service wrapper around the pure domain eligibility engine — mirrors
// crvsMarriageCertificateEligibility.ts's pass-through shape exactly.
import { updateDemoData, getDemoData } from "../storage/demoStore";
import { DivorceRegistration } from "@/domain/crvs/types";
import { assessDivorceCertificateEligibility } from "@/domain/crvs/divorceCertificateEligibility";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoCheckDivorceCertificateEligibility = (registrationId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    const verdict = assessDivorceCertificateEligibility({ registration: reg });
    reg.certificateEligibility = { status: verdict.status, checkedAt: new Date().toISOString(), reasons: verdict.reasons };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "checked certificate eligibility", "crvs.divorce_certificate", reg.reference, `Status: ${verdict.status}.`);
    result = reg;
    return db;
  });
  return result!;
};

export const demoGetDivorceCertificateEligibility = (registrationId: string) => {
  const reg = getDemoData().crvsDivorceRegistrations.find((r) => r.id === registrationId);
  if (!reg) throw new NotFoundError("Divorce registration");
  return reg.certificateEligibility || assessDivorceCertificateEligibility({ registration: reg });
};
