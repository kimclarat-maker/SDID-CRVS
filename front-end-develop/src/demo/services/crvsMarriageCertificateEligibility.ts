// Thin service wrapper around the pure domain eligibility engine — mirrors
// how birth's equivalent stays a thin pass-through over
// assessCertificateEligibility().
import { updateDemoData, getDemoData } from "../storage/demoStore";
import { MarriageApplication } from "@/domain/crvs/types";
import { assessMarriageCertificateEligibility } from "@/domain/crvs/marriageCertificateEligibility";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoCheckMarriageCertificateEligibility = (applicationId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const verdict = assessMarriageCertificateEligibility({ registration: app });
    app.certificateEligibility = { status: verdict.status, checkedAt: new Date().toISOString(), reasons: verdict.reasons };
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "checked certificate eligibility", "crvs.marriage_certificate", app.reference, `Status: ${verdict.status}.`);
    result = app;
    return db;
  });
  return result!;
};

export const demoGetMarriageCertificateEligibility = (applicationId: string) => {
  const app = getDemoData().crvsMarriageApplications.find((a) => a.id === applicationId);
  if (!app) throw new NotFoundError("Marriage application");
  return app.certificateEligibility || assessMarriageCertificateEligibility({ registration: app });
};
