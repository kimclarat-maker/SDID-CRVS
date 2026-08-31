// Annulment-scoped identity-match step (spec §11 Step 2 "SDID identity
// lookup", Steps 4/5 "SDID identity" for each affected party) — mirrors
// crvsDivorceIdentitySearch.ts: reuses demoSearchSdidIdentity()'s underlying
// lookup rather than forking the matching algorithm. Runs once per target
// (applicant, party1, party2), storing the result on that target's own
// identityVerification/identityMatchConfidence field — never conflating the
// three.
import { demoSearchSdidIdentity, IdentitySearchResult } from "./crvsIdentitySearch";
import { updateDemoData } from "../storage/demoStore";
import { crvsPolicyConfig } from "@/domain/crvs/crvsPolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export type AnnulmentIdentitySearchTarget = "applicant" | "party1" | "party2";

const classifyForApplicant = (result: IdentitySearchResult): "NOT_VERIFIED" | "VERIFIED" | "MANUAL_REVIEW_REQUIRED" => {
  if (result.state === "MATCH_FOUND") return "VERIFIED";
  if (result.state === "MULTIPLE_MATCHES") return "MANUAL_REVIEW_REQUIRED";
  return "NOT_VERIFIED";
};

const classifyForParty = (result: IdentitySearchResult): { level: "NO_MATCH" | "LOW_CONFIDENCE" | "PROBABLE" | "CONFIRMED"; confidence: number } => {
  if (result.state === "MATCH_FOUND") return { level: "CONFIRMED", confidence: crvsPolicyConfig.identityMatchThresholds.autoLink };
  if (result.state === "MULTIPLE_MATCHES") return { level: "LOW_CONFIDENCE", confidence: crvsPolicyConfig.identityMatchThresholds.manualReview };
  return { level: "NO_MATCH", confidence: 0 };
};

/** Searches for and links the given target's SDID identity onto the
 * registration draft. Returns the raw search result so the modal can render
 * every candidate match, never a collapsed pass/fail (spec §17). */
export const demoSearchAnnulmentIdentity = async (
  registrationId: string,
  target: AnnulmentIdentitySearchTarget,
  documentType: string,
  documentNumber: string,
  actorName: string
): Promise<IdentitySearchResult> => {
  const searchResult = await demoSearchSdidIdentity(documentType, documentNumber, actorName);
  const match = searchResult.matches[0];

  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");

    if (target === "applicant") {
      reg.applicant.identityVerification = classifyForApplicant(searchResult);
      if (match?.identityId) reg.applicant.sdidIdentityId = match.identityId;
    } else {
      const partyClassification = classifyForParty(searchResult);
      const party = target === "party1" ? reg.affectedParty1 : reg.affectedParty2;
      party.identityMatchConfidence = partyClassification.level;
      party.identityVerification = partyClassification.level === "CONFIRMED" ? "VERIFIED" : partyClassification.level === "NO_MATCH" ? "NOT_VERIFIED" : "MANUAL_REVIEW_REQUIRED";
      if (match?.identityId) party.sdidIdentityId = match.identityId;
    }

    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran identity match",
      "crvs.annulment_identity_search",
      reg.reference,
      `${target}: ${documentType} ${documentNumber.replace(/.(?=.{2})/g, "*")} — ${searchResult.state}.`
    );
    return db;
  });

  return searchResult;
};
