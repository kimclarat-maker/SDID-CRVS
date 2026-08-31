// Existing-marriage lookup for the marriage-annulment wizard's Step 3 (spec
// §11 Step 3 "Existing marriage") — searches the registered
// MarriageApplication records already seeded/created by the marriage
// module. Never fabricates an unverified marriage record: if nothing
// matches, the caller routes the case to the MARRIAGE_RECORD_NOT_FOUND
// exception instead (spec §1, §11). Unlike crvsDivorceMarriageSearch.ts,
// matches are NOT filtered to still-active/non-dissolved marriages — an
// already-annulled or already-divorced marriage is still a valid search
// result; the conflict is then surfaced explicitly by the
// decision-verification EXISTING_DIVORCE_CONFLICT rule and the duplicate
// detectors, never silently hidden at search time. currentCivilStatus is
// computed per candidate via deriveMarriageCivilStatus() so staff see it up
// front.
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { AnnulmentMarriageCandidate, AnnulmentMarriageSearchCriteria } from "@/domain/crvs/types";
import { deriveMarriageCivilStatus } from "@/domain/crvs/marriageCivilStatus";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

const normalize = (value?: string) => (value || "").trim().toLowerCase();
const sameDay = (a?: string, b?: string) => !!a && !!b && normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

const toCandidate = (
  app: ReturnType<typeof getDemoData>["crvsMarriageApplications"][number],
  db: ReturnType<typeof getDemoData>
): AnnulmentMarriageCandidate => ({
  marriageApplicationId: app.id,
  registrationNumber: app.registrationEvent?.registrationNumber || app.reference,
  marriageDate: app.registrationEvent?.marriageDate || app.proposedMarriageDate || "",
  marriagePlace: app.officeName,
  party1Name: [app.applicant1.firstName, app.applicant1.lastName].filter(Boolean).join(" "),
  party2Name: [app.applicant2.firstName, app.applicant2.lastName].filter(Boolean).join(" "),
  officeName: app.officeName,
  currentCivilStatus: deriveMarriageCivilStatus(app, { annulmentRegistrations: db.crvsAnnulmentRegistrations }),
  matchConfidence: "HIGH",
});

/** Only REGISTERED marriages are eligible matches — spec §11 Step 3 "must
 * select a verified marriage before continuing." */
export const demoSearchExistingAnnulmentMarriages = async (
  criteria: AnnulmentMarriageSearchCriteria
): Promise<{ candidates: AnnulmentMarriageCandidate[]; confidence: "LOW" | "MEDIUM" | "HIGH" }> => {
  const db = getDemoData();
  const eligible = db.crvsMarriageApplications.filter((a) => a.status === "REGISTERED");

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
  if (criteria.party1Nin || criteria.party2Nin) {
    matches = matches.filter((a) => {
      const nins = [a.applicant1.documentNumber, a.applicant2.documentNumber].map(normalize);
      return (criteria.party1Nin && nins.includes(normalize(criteria.party1Nin))) || (criteria.party2Nin && nins.includes(normalize(criteria.party2Nin)));
    });
    strongSignal = true;
  }
  if (!strongSignal && (criteria.party1Name || criteria.party2Name)) {
    matches = matches.filter((a) => {
      const names = [
        normalize(`${a.applicant1.firstName || ""} ${a.applicant1.lastName || ""}`),
        normalize(`${a.applicant2.firstName || ""} ${a.applicant2.lastName || ""}`),
      ];
      return (criteria.party1Name && names.some((n) => n.includes(normalize(criteria.party1Name)))) || (criteria.party2Name && names.some((n) => n.includes(normalize(criteria.party2Name))));
    });
  }
  if (criteria.marriageDate) {
    matches = matches.filter((a) => sameDay(a.registrationEvent?.marriageDate || a.proposedMarriageDate, criteria.marriageDate));
  }
  if (criteria.marriagePlace) {
    const term = normalize(criteria.marriagePlace);
    matches = matches.filter((a) => normalize(a.officeName).includes(term));
  }

  const candidates = matches.map((a) => toCandidate(a, db));
  const confidence: "LOW" | "MEDIUM" | "HIGH" = strongSignal && candidates.length === 1 ? "HIGH" : candidates.length === 1 ? "MEDIUM" : "LOW";
  return demoDelay({ candidates, confidence }, 500);
};

export const demoSelectExistingAnnulmentMarriage = async (registrationId: string, candidate: AnnulmentMarriageCandidate, actorName: string) =>
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.existingMarriage.status = "MATCHED";
    reg.existingMarriage.selected = candidate;
    reg.existingMarriage.searchedAt = new Date().toISOString();
    reg.existingMarriage.searchedBy = actorName;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "selected existing marriage", "crvs.annulment_registration", reg.reference, `Linked marriage ${candidate.registrationNumber}.`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;

export const demoMarkAnnulmentMarriageNotFound = async (registrationId: string, actorName: string, searchCriteria?: AnnulmentMarriageSearchCriteria) =>
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.existingMarriage.status = "NOT_FOUND";
    if (searchCriteria) reg.existingMarriage.searchCriteria = searchCriteria;
    reg.existingMarriage.searchedAt = new Date().toISOString();
    reg.existingMarriage.searchedBy = actorName;
    reg.exception = {
      type: "MARRIAGE_RECORD_NOT_FOUND",
      reason: "The declared marriage could not be located in the registry.",
      status: "OPEN",
    };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "marked marriage not found", "crvs.annulment_exception", reg.reference, "Routed to MARRIAGE_RECORD_NOT_FOUND exception review.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
