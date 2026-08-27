// Marriage-scoped identity-match step (spec §5 step 2/3 "identity
// verification") — reuses demoSearchSdidIdentity()'s underlying lookup
// rather than forking the matching algorithm, exactly like
// crvsDeathIdentitySearch.ts. Runs once per applicant (called twice by the
// wizard/eligibility step), storing the result on that spouse's own
// identityVerification field — never conflating the two applicants' matches.
import { demoSearchSdidIdentity, IdentitySearchResult } from "./crvsIdentitySearch";
import { updateDemoData } from "../storage/demoStore";
import { crvsPolicyConfig } from "@/domain/crvs/crvsPolicyConfig";
import { ApplicantIdentityVerification, SpouseRole } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const classify = (result: IdentitySearchResult): { level: ApplicantIdentityVerification["matchLevel"]; confidence: number } => {
  if (result.state === "SERVICE_UNAVAILABLE") return { level: "NO_MATCH", confidence: 0 };
  if (result.state === "NO_MATCH") return { level: "NO_MATCH", confidence: 0 };
  if (result.state === "MULTIPLE_MATCHES") return { level: "LOW_CONFIDENCE", confidence: crvsPolicyConfig.identityMatchThresholds.manualReview };
  return { level: "CONFIRMED", confidence: crvsPolicyConfig.identityMatchThresholds.autoLink };
};

const applicantKey = (spouseRole: SpouseRole): "applicant1" | "applicant2" =>
  spouseRole === "APPLICANT1" ? "applicant1" : "applicant2";

export const demoSearchMarriageApplicantIdentity = async (
  documentType: string,
  documentNumber: string,
  spouseRole: SpouseRole,
  actorName: string,
  applicationId?: string,
  applicationReference?: string
): Promise<ApplicantIdentityVerification> => {
  const searchResult = await demoSearchSdidIdentity(documentType, documentNumber, actorName);
  const { level, confidence } = classify(searchResult);
  const match = searchResult.matches[0];

  const verification: ApplicantIdentityVerification = {
    checkedAt: new Date().toISOString(),
    checkedBy: actorName,
    matchLevel: level,
    confidenceScore: confidence,
    matchedSdidIdentityId: match?.identityId,
    matchedFields: match ? ["Document number", "Name"] : [],
    requiresManualReview: level === "LOW_CONFIDENCE" || level === "NO_MATCH",
  };

  if (applicationId) {
    updateDemoData((db) => {
      const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
      if (!app) throw new NotFoundError("Marriage application");
      app[applicantKey(spouseRole)].identityVerification = verification;
      if (match?.identityId) app[applicantKey(spouseRole)].sdidIdentityId = match.identityId;
      app.updatedAt = new Date().toISOString();
      app.version += 1;
      logCrvsAudit(
        db,
        actorName,
        "ran identity match",
        "crvs.marriage_identity_search",
        applicationReference || app.reference,
        `${spouseRole}: ${documentType} ${documentNumber.replace(/.(?=.{2})/g, "*")} — ${level}.`
      );
      return db;
    });
  }

  return verification;
};

export const demoResolveMarriageIdentityMatch = (
  applicationId: string,
  spouseRole: SpouseRole,
  resolution: NonNullable<ApplicantIdentityVerification["resolution"]>,
  actorName: string
) =>
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const applicant = app[applicantKey(spouseRole)];
    if (!applicant.identityVerification) throw new Error("No identity match has been run for this applicant.");
    applicant.identityVerification.resolution = resolution;
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "resolved identity match", "crvs.marriage_identity_search", app.reference, `${spouseRole}: ${resolution.type}${resolution.note ? ` — ${resolution.note}` : ""}`);
    return db;
  }).crvsMarriageApplications.find((a) => a.id === applicationId)!;
