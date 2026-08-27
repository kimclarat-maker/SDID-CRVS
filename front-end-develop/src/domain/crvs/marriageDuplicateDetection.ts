// Deterministic duplicate/conflict-detection simulation for marriage
// applications. Two separate pure functions, unlike death's single
// deathDuplicateDetection.ts, because marriage genuinely has two distinct
// concerns: (1) has this exact declaration already been submitted
// (findMarriageDuplicateCandidates, mirrors deathDuplicateDetection.ts's
// scoring approach), and (2) is either spouse already party to another
// active marriage application/registration elsewhere
// (findExistingMarriageConflicts, called once per spouse by the caller).
import {
  MarriageApplication,
  MarriageApplicant,
  MarriageDuplicateCandidate,
  MarriageExistingConflictCandidate,
  DuplicateMatchLevel,
  SpouseRole,
} from "./types";

const normalize = (value?: string) => (value || "").trim().toLowerCase();

const applicantFullName = (applicant: MarriageApplicant) =>
  normalize(`${applicant.firstName || ""} ${applicant.middleName || ""} ${applicant.lastName || ""}`);

const sameDay = (a?: string, b?: string) => !!a && !!b && normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}${"*".repeat(Math.max(first.length - 1, 2))}` : "***";
  const l = last ? `${last.charAt(0)}${"*".repeat(Math.max(last.length - 1, 2))}` : "***";
  return `${f} ${l}`;
};

function matchLevelRank(level: DuplicateMatchLevel): number {
  return { NONE: 0, POTENTIAL: 1, PROBABLE: 2, EXACT: 3 }[level];
}

export type MarriageDuplicateCandidateInput = {
  applicant1: MarriageApplicant;
  applicant2: MarriageApplicant;
  proposedMarriageDate?: string;
  officeId: string;
};

/** Classic near-identical-declaration detection: both spouses' normalized
 * names + proposed marriage date + office fingerprint. */
export function findMarriageDuplicateCandidates(
  input: MarriageDuplicateCandidateInput,
  existingApplications: MarriageApplication[],
  excludeApplicationId?: string
): MarriageDuplicateCandidate[] {
  return existingApplications
    .filter((app) => app.id !== excludeApplicationId && app.status !== "REJECTED" && app.status !== "CANCELLED")
    .map((existing) => {
      const namesMatchDirect =
        applicantFullName(input.applicant1) === applicantFullName(existing.applicant1) &&
        applicantFullName(input.applicant2) === applicantFullName(existing.applicant2);
      const namesMatchSwapped =
        applicantFullName(input.applicant1) === applicantFullName(existing.applicant2) &&
        applicantFullName(input.applicant2) === applicantFullName(existing.applicant1);
      const namesMatch = (namesMatchDirect || namesMatchSwapped) && !!existing.applicant1.lastName;
      const dateMatch = sameDay(input.proposedMarriageDate, existing.proposedMarriageDate);
      const officeMatch = input.officeId === existing.officeId;

      const score = [namesMatch, dateMatch, officeMatch].filter(Boolean).length;
      let matchLevel: DuplicateMatchLevel = "NONE";
      if (namesMatch && dateMatch) matchLevel = "EXACT";
      else if (score >= 2) matchLevel = "PROBABLE";
      else if (score >= 1) matchLevel = "POTENTIAL";

      const matchedFields: string[] = [];
      if (namesMatch) matchedFields.push("Both applicants' names");
      if (dateMatch) matchedFields.push("Proposed marriage date");
      if (officeMatch) matchedFields.push("Processing office");

      return {
        applicationId: existing.id,
        reference: existing.reference,
        matchLevel,
        matchedFields,
        maskedSummary: `${maskName(existing.applicant1.firstName, existing.applicant1.lastName)} & ${maskName(existing.applicant2.firstName, existing.applicant2.lastName)} — proposed ${(existing.proposedMarriageDate || "").slice(0, 10)}`,
        existingRecordStatus: existing.status,
      };
    })
    .filter((candidate) => candidate.matchLevel !== "NONE")
    .sort((a, b) => matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel));
}

export function overallMarriageMatchLevel(candidates: MarriageDuplicateCandidate[]): DuplicateMatchLevel {
  return candidates.reduce<DuplicateMatchLevel>(
    (max, c) => (matchLevelRank(c.matchLevel) > matchLevelRank(max) ? c.matchLevel : max),
    "NONE"
  );
}

const ACTIVE_APPLICATION_STATUSES = new Set([
  "SUBMITTED",
  "ELIGIBILITY_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "PAYMENT_PENDING",
  "PAID",
  "APPROVED",
  "APPOINTMENT_SCHEDULED",
  "READY_FOR_CEREMONY",
  "CEREMONY_COMPLETED",
  "REGISTERED",
]);

/** "Is this person already party to another active marriage?" check — run
 * once per spouse by the caller (crvsMarriageDuplicateCheck.ts), never
 * conflated with the declaration-duplicate check above. Matches by NIN or
 * sdidIdentityId against either applicant slot on any other application. */
export function findExistingMarriageConflicts(
  spouse: MarriageApplicant,
  spouseRoleOnThisApplication: SpouseRole,
  existingApplications: MarriageApplication[],
  excludeApplicationId?: string
): MarriageExistingConflictCandidate[] {
  const results: MarriageExistingConflictCandidate[] = [];
  for (const other of existingApplications) {
    if (other.id === excludeApplicationId) continue;
    if (!ACTIVE_APPLICATION_STATUSES.has(other.status)) continue;

    for (const [slotRole, slot] of [
      ["APPLICANT1", other.applicant1],
      ["APPLICANT2", other.applicant2],
    ] as const) {
      const ninMatch = !!spouse.nin && !!slot.nin && normalize(spouse.nin) === normalize(slot.nin);
      const identityMatch = !!spouse.sdidIdentityId && !!slot.sdidIdentityId && spouse.sdidIdentityId === slot.sdidIdentityId;
      if (ninMatch || identityMatch) {
        results.push({
          applicationId: other.id,
          reference: other.reference,
          matchedSpouseRole: spouseRoleOnThisApplication,
          status: other.status,
          maskedSummary: `${maskName(slot.firstName, slot.lastName)} — ${slotRole === "APPLICANT1" ? "applicant 1" : "applicant 2"} on ${other.reference}`,
        });
      }
    }
  }
  return results;
}
