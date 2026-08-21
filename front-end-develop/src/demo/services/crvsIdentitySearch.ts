// Simulated "SDID lookup" used to verify parents/declarant/witnesses.
// Mirrors demo/services/applicants.ts's document-number lookup against the
// same seeded db.applicants collection, but returns the richer
// initial/searching/match/no-match/multiple-matches/unavailable state set
// the registration wizard's SDID Identity Search modal needs (spec §10).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { logCrvsAudit } from "./crvsAudit";

export type IdentitySearchState =
  | "NO_MATCH"
  | "MATCH_FOUND"
  | "MULTIPLE_MATCHES"
  | "SERVICE_UNAVAILABLE";

export type IdentitySearchResult = {
  state: IdentitySearchState;
  matches: {
    identityId: string;
    firstName: string;
    lastName: string;
    dob: string;
    nationality: string;
    phoneNumber?: string;
  }[];
};

// A fixed, deterministic 1-in-12 "service unavailable" so the modal's
// service-unavailable state is reachable in a demo without being flaky for
// any particular document number.
const isSimulatedOutage = (documentNumber: string) => documentNumber.trim().endsWith("999");

export const demoSearchSdidIdentity = async (
  documentType: string,
  documentNumber: string,
  actorName: string,
  caseReference?: string
): Promise<IdentitySearchResult> => {
  await demoDelay(null, 700);

  if (isSimulatedOutage(documentNumber)) {
    return { state: "SERVICE_UNAVAILABLE", matches: [] };
  }

  const db = getDemoData();
  const term = documentNumber.trim().toUpperCase();
  const matches = db.applicants.filter((a) => a.identityNumber.toUpperCase() === term);

  const result: IdentitySearchResult =
    matches.length === 0
      ? { state: "NO_MATCH", matches: [] }
      : {
          state: matches.length > 1 ? "MULTIPLE_MATCHES" : "MATCH_FOUND",
          matches: matches.map((m) => ({
            identityId: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            dob: m.dob,
            nationality: m.citizenshipStatus,
            phoneNumber: m.phoneNumber,
          })),
        };

  if (caseReference) {
    updateDemoData((updated) => {
      logCrvsAudit(
        updated,
        actorName,
        "ran identity lookup",
        "crvs.identity_search",
        caseReference,
        `${documentType} ${documentNumber.replace(/.(?=.{2})/g, "*")} — ${result.state}.`
      );
      return updated;
    });
  }

  return result;
};
