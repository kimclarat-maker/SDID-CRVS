// Existing-marriage lookup for the divorce wizard's Step 3 (spec §3 Step 3
// "Existing marriage") — searches the registered MarriageApplication
// records already seeded/created by the marriage module. Never fabricates
// an unverified marriage record: if nothing matches, the caller routes the
// case to the MARRIAGE_RECORD_NOT_FOUND exception instead (spec §3, §10).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { ExistingMarriageCandidate, ExistingMarriageSearchCriteria } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const normalize = (value?: string) => (value || "").trim().toLowerCase();
const sameDay = (a?: string, b?: string) => !!a && !!b && normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

const toCandidate = (app: ReturnType<typeof getDemoData>["crvsMarriageApplications"][number]): ExistingMarriageCandidate => ({
  marriageApplicationId: app.id,
  registrationNumber: app.registrationEvent?.registrationNumber || app.reference,
  marriageDate: app.registrationEvent?.marriageDate || app.proposedMarriageDate || "",
  marriagePlace: app.officeName,
  spouse1Name: [app.applicant1.firstName, app.applicant1.lastName].filter(Boolean).join(" "),
  spouse2Name: [app.applicant2.firstName, app.applicant2.lastName].filter(Boolean).join(" "),
  officeName: app.officeName,
  matchConfidence: "HIGH",
});

/** Only REGISTERED, not-already-dissolved marriages are eligible matches —
 * spec §16 "Existing marriage tab... Marriage status" and §3 "must select a
 * verified active marriage before continuing." */
export const demoSearchExistingMarriages = async (
  criteria: ExistingMarriageSearchCriteria
): Promise<{ candidates: ExistingMarriageCandidate[]; confidence: "LOW" | "MEDIUM" | "HIGH" }> => {
  const db = getDemoData();
  const eligible = db.crvsMarriageApplications.filter((a) => a.status === "REGISTERED" && !a.dissolution);

  let matches = eligible;
  let strongSignal = false;

  if (criteria.marriageRegistrationNumber) {
    const term = normalize(criteria.marriageRegistrationNumber);
    matches = matches.filter((a) => normalize(a.registrationEvent?.registrationNumber) === term || normalize(a.reference) === term);
    strongSignal = true;
  }
  if (criteria.marriageCertificateNumber) {
    const term = normalize(criteria.marriageCertificateNumber);
    matches = matches.filter((a) => normalize(a.registrationEvent?.registrationNumber) === term);
    strongSignal = true;
  }
  if (criteria.spouse1Nin || criteria.spouse2Nin) {
    matches = matches.filter((a) => {
      const nins = [a.applicant1.documentNumber, a.applicant2.documentNumber].map(normalize);
      return (criteria.spouse1Nin && nins.includes(normalize(criteria.spouse1Nin))) || (criteria.spouse2Nin && nins.includes(normalize(criteria.spouse2Nin)));
    });
    strongSignal = true;
  }
  if (!strongSignal && (criteria.spouse1Name || criteria.spouse2Name)) {
    matches = matches.filter((a) => {
      const names = [
        normalize(`${a.applicant1.firstName || ""} ${a.applicant1.lastName || ""}`),
        normalize(`${a.applicant2.firstName || ""} ${a.applicant2.lastName || ""}`),
      ];
      return (criteria.spouse1Name && names.some((n) => n.includes(normalize(criteria.spouse1Name)))) || (criteria.spouse2Name && names.some((n) => n.includes(normalize(criteria.spouse2Name))));
    });
  }
  if (criteria.marriageDate) {
    matches = matches.filter((a) => sameDay(a.registrationEvent?.marriageDate || a.proposedMarriageDate, criteria.marriageDate));
  }
  if (criteria.marriagePlace) {
    const term = normalize(criteria.marriagePlace);
    matches = matches.filter((a) => normalize(a.officeName).includes(term));
  }

  const candidates = matches.map(toCandidate);
  const confidence: "LOW" | "MEDIUM" | "HIGH" = strongSignal && candidates.length === 1 ? "HIGH" : candidates.length === 1 ? "MEDIUM" : "LOW";
  return demoDelay({ candidates, confidence }, 500);
};

export const demoSelectExistingMarriage = (
  registrationId: string,
  candidate: ExistingMarriageCandidate,
  actorName: string
) =>
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.existingMarriage.status = "MATCHED";
    reg.existingMarriage.selected = candidate;
    reg.existingMarriage.searchedAt = new Date().toISOString();
    reg.existingMarriage.searchedBy = actorName;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "selected existing marriage", "crvs.divorce_registration", reg.reference, `Linked marriage ${candidate.registrationNumber}.`);
    return db;
  }).crvsDivorceRegistrations.find((r) => r.id === registrationId)!;

export const demoMarkExistingMarriageNotFound = (registrationId: string, actorName: string, searchCriteria: ExistingMarriageSearchCriteria) =>
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.existingMarriage.status = "NOT_FOUND";
    reg.existingMarriage.searchCriteria = searchCriteria;
    reg.existingMarriage.searchedAt = new Date().toISOString();
    reg.existingMarriage.searchedBy = actorName;
    reg.exception = {
      type: "MARRIAGE_RECORD_NOT_FOUND",
      reason: "The applicant's declared marriage could not be located in the registry.",
      status: "OPEN",
    };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "marked marriage not found", "crvs.divorce_exception", reg.reference, "Routed to MARRIAGE_RECORD_NOT_FOUND exception review.");
    return db;
  }).crvsDivorceRegistrations.find((r) => r.id === registrationId)!;
