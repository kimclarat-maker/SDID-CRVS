// Divorce-scoped identity-match step (spec §3 Step 2 "SDID identity lookup",
// Steps 4/5 "SDID identity" for each former spouse) — reuses
// demoSearchSdidIdentity()'s underlying lookup rather than forking the
// matching algorithm, exactly like crvsMarriageIdentitySearch.ts. Runs once
// per target (applicant, formerSpouse1, formerSpouse2), storing the result
// on that target's own identityVerification/identityMatchConfidence field —
// never conflating the three.
import { demoSearchSdidIdentity, IdentitySearchResult } from "./crvsIdentitySearch";
import { updateDemoData } from "../storage/demoStore";
import { crvsPolicyConfig } from "@/domain/crvs/crvsPolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export type DivorceIdentitySearchTarget = "applicant" | "formerSpouse1" | "formerSpouse2";

const classifyForApplicant = (result: IdentitySearchResult): "NOT_VERIFIED" | "VERIFIED" | "MANUAL_REVIEW_REQUIRED" => {
  if (result.state === "MATCH_FOUND") return "VERIFIED";
  if (result.state === "MULTIPLE_MATCHES") return "MANUAL_REVIEW_REQUIRED";
  return "NOT_VERIFIED";
};

const classifyForSpouse = (result: IdentitySearchResult): { level: "NO_MATCH" | "LOW_CONFIDENCE" | "PROBABLE" | "CONFIRMED"; confidence: number } => {
  if (result.state === "MATCH_FOUND") return { level: "CONFIRMED", confidence: crvsPolicyConfig.identityMatchThresholds.autoLink };
  if (result.state === "MULTIPLE_MATCHES") return { level: "LOW_CONFIDENCE", confidence: crvsPolicyConfig.identityMatchThresholds.manualReview };
  return { level: "NO_MATCH", confidence: 0 };
};

/** Searches for and links the given target's SDID identity onto the
 * registration draft. Returns the raw search result so the modal can render
 * every candidate match, never a collapsed pass/fail (spec §8). */
export const demoSearchDivorceIdentity = async (
  registrationId: string,
  target: DivorceIdentitySearchTarget,
  documentType: string,
  documentNumber: string,
  actorName: string
): Promise<IdentitySearchResult> => {
  const searchResult = await demoSearchSdidIdentity(documentType, documentNumber, actorName);
  const match = searchResult.matches[0];

  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");

    if (target === "applicant") {
      reg.applicant.identityVerification = classifyForApplicant(searchResult);
      if (match?.identityId) reg.applicant.sdidIdentityId = match.identityId;
    } else {
      const spouseClassification = classifyForSpouse(searchResult);
      const spouse = target === "formerSpouse1" ? reg.formerSpouse1 : reg.formerSpouse2;
      spouse.identityMatchConfidence = spouseClassification.level;
      spouse.identityVerification = spouseClassification.level === "CONFIRMED" ? "VERIFIED" : spouseClassification.level === "NO_MATCH" ? "NOT_VERIFIED" : "MANUAL_REVIEW_REQUIRED";
      if (match?.identityId) spouse.sdidIdentityId = match.identityId;
    }

    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran identity match",
      "crvs.divorce_identity_search",
      reg.reference,
      `${target}: ${documentType} ${documentNumber.replace(/.(?=.{2})/g, "*")} — ${searchResult.state}.`
    );
    return db;
  });

  return searchResult;
};
