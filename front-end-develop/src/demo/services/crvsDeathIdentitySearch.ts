// Death-scoped identity-match step (spec §5 step 8 "SDID identity match").
// Reuses demoSearchSdidIdentity()'s underlying applicant/document-number
// lookup rather than forking the matching algorithm, then classifies the
// result against crvsPolicyConfig's confidence thresholds into the
// IdentityMatch shape the wizard's review-match modal expects.
import { demoSearchSdidIdentity, IdentitySearchResult } from "./crvsIdentitySearch";
import { updateDemoData } from "../storage/demoStore";
import { crvsPolicyConfig } from "@/domain/crvs/crvsPolicyConfig";
import { DeathIdentityMatchLevel, IdentityMatch } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const classify = (result: IdentitySearchResult): { level: DeathIdentityMatchLevel; confidence: number } => {
  if (result.state === "SERVICE_UNAVAILABLE") return { level: "NO_MATCH", confidence: 0 };
  if (result.state === "NO_MATCH") return { level: "NO_MATCH", confidence: 0 };
  if (result.state === "MULTIPLE_MATCHES") return { level: "LOW_CONFIDENCE", confidence: crvsPolicyConfig.identityMatchThresholds.manualReview };
  return { level: "CONFIRMED", confidence: crvsPolicyConfig.identityMatchThresholds.autoLink };
};

export const demoSearchDeathIdentity = async (
  documentType: string,
  documentNumber: string,
  actorName: string,
  caseId?: string,
  caseReference?: string
): Promise<IdentityMatch> => {
  const searchResult = await demoSearchSdidIdentity(documentType, documentNumber, actorName);
  const { level, confidence } = classify(searchResult);
  const match = searchResult.matches[0];

  const identityMatch: IdentityMatch = {
    checkedAt: new Date().toISOString(),
    checkedBy: actorName,
    matchLevel: level,
    confidenceScore: confidence,
    matchedSdidIdentityId: match?.identityId,
    matchedFields: match ? ["Document number", "Name"] : [],
    maskedSummary: match ? `${match.firstName.charAt(0)}*** ${match.lastName.charAt(0)}***` : undefined,
    requiresManualReview: level === "LOW_CONFIDENCE" || level === "NO_MATCH",
  };

  if (caseId) {
    updateDemoData((db) => {
      const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
      if (!deathCase) throw new NotFoundError("Death registration case");
      deathCase.identityMatch = identityMatch;
      deathCase.updatedAt = new Date().toISOString();
      deathCase.version += 1;
      logCrvsAudit(
        db,
        actorName,
        "ran identity match",
        "crvs.death_identity_search",
        caseReference || deathCase.reference,
        `${documentType} ${documentNumber.replace(/.(?=.{2})/g, "*")} — ${level}.`
      );
      return db;
    });
  }

  return identityMatch;
};

export const demoResolveDeathIdentityMatch = (
  caseId: string,
  resolution: NonNullable<IdentityMatch["resolution"]>,
  actorName: string
) =>
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (!deathCase.identityMatch) throw new Error("No identity match has been run for this case.");
    deathCase.identityMatch.resolution = resolution;
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "resolved identity match", "crvs.death_identity_search", deathCase.reference, `${resolution.type}${resolution.note ? `: ${resolution.note}` : ""}`);
    return db;
  }).crvsDeathRegistrations.find((c) => c.id === caseId)!;
