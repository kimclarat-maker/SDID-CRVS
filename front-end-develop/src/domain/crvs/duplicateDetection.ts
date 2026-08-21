// Deterministic duplicate-detection simulation. Compares a candidate case's
// child + mother + date-of-birth + facility fingerprint against existing
// registrations. Multiple-birth siblings (same mother + same date of birth,
// different birth order) are explicitly exempted from matching each other —
// spec §16/§28 calls this out as a scenario that must not be misflagged.
import { BirthRegistrationCase, ChildDetails, DuplicateCandidate, DuplicateMatchLevel, MotherDetails } from "./types";

const normalize = (value?: string) => (value || "").trim().toLowerCase();

const childFullName = (child: ChildDetails) =>
  normalize(`${child.firstName || ""} ${child.middleName || ""} ${child.lastName}`);

const motherFullName = (mother: MotherDetails) => normalize(`${mother.firstName} ${mother.lastName}`);

const sameDay = (a: string, b: string) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

export type DuplicateCandidateInput = {
  child: ChildDetails;
  mother: MotherDetails;
  facilityId?: string;
  facilityName?: string;
  placeOfBirth: string;
};

function isExemptSibling(a: DuplicateCandidateInput, existing: BirthRegistrationCase): boolean {
  const sameMother =
    motherFullName(a.mother) === motherFullName(existing.mother) &&
    normalize(a.mother.documentNumber) === normalize(existing.mother.documentNumber);
  const sameDob = sameDay(a.child.dateOfBirth, existing.child.dateOfBirth);
  const bothMultiple = a.child.multipleBirth?.isMultiple && existing.child.multipleBirth?.isMultiple;
  const differentOrder =
    (a.child.multipleBirth?.birthOrder ?? 0) !== (existing.child.multipleBirth?.birthOrder ?? -1);
  return sameMother && sameDob && !!bothMultiple && differentOrder;
}

function matchLevel(a: DuplicateCandidateInput, existing: BirthRegistrationCase): DuplicateMatchLevel {
  if (isExemptSibling(a, existing)) return "NONE";

  const nameMatch = childFullName(a.child) === childFullName(existing.child) && !!existing.child.lastName;
  const dobMatch = sameDay(a.child.dateOfBirth, existing.child.dateOfBirth);
  const motherMatch =
    motherFullName(a.mother) === motherFullName(existing.mother) ||
    (!!a.mother.documentNumber &&
      normalize(a.mother.documentNumber) === normalize(existing.mother.documentNumber));
  const facilityMatch =
    (a.facilityId && a.facilityId === existing.facilityId) ||
    normalize(a.placeOfBirth) === normalize(existing.placeOfBirth);

  const score = [nameMatch, dobMatch, motherMatch, facilityMatch].filter(Boolean).length;

  if (nameMatch && dobMatch && motherMatch) return "EXACT";
  if (score >= 3) return "PROBABLE";
  if (score >= 2) return "POTENTIAL";
  return "NONE";
}

function matchedFields(a: DuplicateCandidateInput, existing: BirthRegistrationCase): string[] {
  const fields: string[] = [];
  if (childFullName(a.child) === childFullName(existing.child)) fields.push("Child name");
  if (sameDay(a.child.dateOfBirth, existing.child.dateOfBirth)) fields.push("Date of birth");
  if (
    motherFullName(a.mother) === motherFullName(existing.mother) ||
    (!!a.mother.documentNumber && normalize(a.mother.documentNumber) === normalize(existing.mother.documentNumber))
  ) {
    fields.push("Mother's identity");
  }
  if (
    (a.facilityId && a.facilityId === existing.facilityId) ||
    normalize(a.placeOfBirth) === normalize(existing.placeOfBirth)
  ) {
    fields.push("Place of birth");
  }
  return fields;
}

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}${"*".repeat(Math.max(first.length - 1, 2))}` : "***";
  const l = last ? `${last.charAt(0)}${"*".repeat(Math.max(last.length - 1, 2))}` : "***";
  return `${f} ${l}`;
};

export function findDuplicateCandidates(
  input: DuplicateCandidateInput,
  existingCases: BirthRegistrationCase[],
  excludeCaseId?: string
): DuplicateCandidate[] {
  return existingCases
    .filter((c) => c.id !== excludeCaseId && c.status !== "REJECTED" && c.status !== "CANCELLED")
    .map((existing) => ({
      caseId: existing.id,
      reference: existing.reference,
      matchLevel: matchLevel(input, existing),
      matchedFields: matchedFields(input, existing),
      maskedSummary: `${maskName(existing.child.firstName, existing.child.lastName)} — DOB ${existing.child.dateOfBirth.slice(0, 10)}`,
      existingRecordStatus: existing.status,
    }))
    .filter((candidate) => candidate.matchLevel !== "NONE")
    .sort((a, b) => matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel));
}

function matchLevelRank(level: DuplicateMatchLevel): number {
  return { NONE: 0, POTENTIAL: 1, PROBABLE: 2, EXACT: 3 }[level];
}

export function overallMatchLevel(candidates: DuplicateCandidate[]): DuplicateMatchLevel {
  return candidates.reduce<DuplicateMatchLevel>(
    (max, c) => (matchLevelRank(c.matchLevel) > matchLevelRank(max) ? c.matchLevel : max),
    "NONE"
  );
}
