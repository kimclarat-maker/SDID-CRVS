// Deterministic duplicate-detection simulation for death registrations,
// mirroring duplicateDetection.ts's approach: compares a candidate case's
// deceased name + date of death + location fingerprint against existing
// death registrations.
import { DeathRegistrationCase, DeceasedPerson, DeathDuplicateCandidate, DuplicateMatchLevel } from "./types";

const normalize = (value?: string) => (value || "").trim().toLowerCase();

const deceasedFullName = (deceased: DeceasedPerson) =>
  normalize(`${deceased.firstName || ""} ${deceased.middleName || ""} ${deceased.lastName || ""}`);

const sameDay = (a: string, b: string) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

export type DeathDuplicateCandidateInput = {
  deceased: DeceasedPerson;
  dateOfDeath: string;
  facilityId?: string;
  location: string;
};

function matchLevel(a: DeathDuplicateCandidateInput, existing: DeathRegistrationCase): DuplicateMatchLevel {
  const nameMatch = deceasedFullName(a.deceased) === deceasedFullName(existing.deceased) && !!existing.deceased.lastName;
  const dobMatch = sameDay(a.dateOfDeath, existing.dateOfDeath);
  const ninMatch = !!a.deceased.nin && normalize(a.deceased.nin) === normalize(existing.deceased.nin);
  const locationMatch =
    (a.facilityId && a.facilityId === existing.facilityId) || normalize(a.location) === normalize(existing.occurrence.location);

  const score = [nameMatch, dobMatch, ninMatch, locationMatch].filter(Boolean).length;

  if (ninMatch && (nameMatch || dobMatch)) return "EXACT";
  if (nameMatch && dobMatch) return "EXACT";
  if (score >= 3) return "PROBABLE";
  if (score >= 2) return "POTENTIAL";
  return "NONE";
}

function matchedFields(a: DeathDuplicateCandidateInput, existing: DeathRegistrationCase): string[] {
  const fields: string[] = [];
  if (deceasedFullName(a.deceased) === deceasedFullName(existing.deceased)) fields.push("Deceased name");
  if (sameDay(a.dateOfDeath, existing.dateOfDeath)) fields.push("Date of death");
  if (a.deceased.nin && normalize(a.deceased.nin) === normalize(existing.deceased.nin)) fields.push("National identification number");
  if ((a.facilityId && a.facilityId === existing.facilityId) || normalize(a.location) === normalize(existing.occurrence.location)) {
    fields.push("Place of death");
  }
  return fields;
}

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}${"*".repeat(Math.max(first.length - 1, 2))}` : "***";
  const l = last ? `${last.charAt(0)}${"*".repeat(Math.max(last.length - 1, 2))}` : "***";
  return `${f} ${l}`;
};

export function findDeathDuplicateCandidates(
  input: DeathDuplicateCandidateInput,
  existingCases: DeathRegistrationCase[],
  excludeCaseId?: string
): DeathDuplicateCandidate[] {
  return existingCases
    .filter((c) => c.id !== excludeCaseId && c.status !== "REJECTED" && c.status !== "CANCELLED")
    .map((existing) => ({
      caseId: existing.id,
      reference: existing.reference,
      matchLevel: matchLevel(input, existing),
      matchedFields: matchedFields(input, existing),
      maskedSummary: `${maskName(existing.deceased.firstName, existing.deceased.lastName)} — died ${existing.dateOfDeath.slice(0, 10)}`,
      existingRecordStatus: existing.status,
    }))
    .filter((candidate) => candidate.matchLevel !== "NONE")
    .sort((a, b) => matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel));
}

function matchLevelRank(level: DuplicateMatchLevel): number {
  return { NONE: 0, POTENTIAL: 1, PROBABLE: 2, EXACT: 3 }[level];
}

export function overallDeathMatchLevel(candidates: DeathDuplicateCandidate[]): DuplicateMatchLevel {
  return candidates.reduce<DuplicateMatchLevel>(
    (max, c) => (matchLevelRank(c.matchLevel) > matchLevelRank(max) ? c.matchLevel : max),
    "NONE"
  );
}
