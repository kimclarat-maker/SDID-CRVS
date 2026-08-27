// Token-based second-applicant response flow (spec §6 "Applicant response
// page"). Looks the application up by partnerResponseToken rather than
// requiring staff sign-in, and returns only the scoped
// MarriageApplicantResponseView projection — never the full
// MarriageApplication — so the responding applicant sees their own data plus
// only a minimal MarriagePartner summary of the other spouse.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { MarriageApplicantResponseView, MarriageApplicant, SpouseRole } from "@/domain/crvs/types";
import { assertTransitionMarriageApplication } from "@/domain/crvs/statusMachines";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const spouseRoleForToken = (): SpouseRole => "APPLICANT2";

export const demoGetMarriageApplicantResponseView = async (token: string): Promise<MarriageApplicantResponseView | undefined> => {
  const db = getDemoData();
  const app = db.crvsMarriageApplications.find((a) => a.partnerResponseToken === token);
  if (!app) return demoDelay(undefined);

  const respondingSpouseRole = spouseRoleForToken();
  const own: MarriageApplicant = app.applicant2;
  const partnerData = app.applicant1;

  const view: MarriageApplicantResponseView = {
    applicationReference: app.reference,
    respondingSpouseRole,
    ownData: own,
    partner: {
      spouseRole: "APPLICANT1",
      firstName: partnerData.firstName,
      lastName: partnerData.lastName,
      proposedMarriageDate: app.proposedMarriageDate,
      officeName: app.officeName,
    },
    proposedMarriageDate: app.proposedMarriageDate,
    officeName: app.officeName,
    correctionRequest: app.correctionRequests.find((c) => !c.resolvedAt),
  };
  return demoDelay(view);
};

export const demoConfirmMarriagePartnerParticipation = (token: string, actorName: string): { reference: string } => {
  let reference = "";
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.partnerResponseToken === token);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    app.applicant2.partnerConfirmationStatus = "CONFIRMED";
    app.applicant2.partnerConfirmedAt = now;
    app.applicant2.verification = "VERIFIED";
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "confirmed participation", "crvs.marriage_partner_response", app.reference, "Applicant 2 confirmed participation via the secure response link.");
    reference = app.reference;
    return db;
  });
  return { reference };
};

export const demoUpdateMarriageApplicantOwnData = (
  token: string,
  patch: Partial<MarriageApplicant>,
  actorName: string
): { reference: string } => {
  let reference = "";
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.partnerResponseToken === token);
    if (!app) throw new NotFoundError("Marriage application");
    Object.assign(app.applicant2, patch);
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "corrected own data", "crvs.marriage_partner_response", app.reference, "Applicant 2 corrected their own submitted information.");
    reference = app.reference;
    return db;
  });
  return { reference };
};

/** A decline blocks progression to approval — mirrors PARTNER_VERIFICATION_
 * REQUIRED -> REJECTED in the status machine (spec §6 "a declined response
 * must prevent progression to approval"). */
export const demoDeclineMarriagePartnerParticipation = (token: string, reason: string, actorName: string): { reference: string } => {
  let reference = "";
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.partnerResponseToken === token);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    app.applicant2.partnerConfirmationStatus = "DECLINED";
    app.applicant2.partnerDeclinedAt = now;
    app.applicant2.partnerDeclineReason = reason;
    assertTransitionMarriageApplication(app.status, "REJECTED");
    app.status = "REJECTED";
    app.rejectedAt = now;
    app.rejectionReason = { reason: "Applicant 2 declined participation.", explanation: reason, evidenceRefs: [], applicantsNotified: true };
    app.statusHistory.push({ status: "REJECTED", at: now, by: "Applicant 2 (self-service)", note: reason });
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "declined participation", "crvs.marriage_partner_response", app.reference, reason);
    reference = app.reference;
    return db;
  });
  return { reference };
};
