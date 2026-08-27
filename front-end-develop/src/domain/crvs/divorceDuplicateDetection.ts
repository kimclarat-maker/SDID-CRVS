// Deterministic duplicate/conflict-detection simulation for divorce
// registrations — mirrors marriageDuplicateDetection.ts's split into two
// concerns: (1) has this exact divorce already been registered/submitted
// (findDivorceDuplicateCandidates, scored NONE/POTENTIAL/PROBABLE/EXACT),
// and (2) is the SAME marriage already the subject of another active
// divorce registration (findExistingDivorceConflicts) — the divorce-scoped
// equivalent of "is this person already party to another active marriage."
import { DivorceRegistration, DuplicateMatchLevel } from "./types";

const normalize = (value?: string) => (value || "").trim().toLowerCase();

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}${"*".repeat(Math.max(first.length - 1, 2))}` : "***";
  const l = last ? `${last.charAt(0)}${"*".repeat(Math.max(last.length - 1, 2))}` : "***";
  return `${f} ${l}`;
};

function matchLevelRank(level: DuplicateMatchLevel): number {
  return { NONE: 0, POTENTIAL: 1, PROBABLE: 2, EXACT: 3 }[level];
}

export type DivorceDuplicateCandidate = {
  registrationId: string;
  reference: string;
  matchLevel: DuplicateMatchLevel;
  matchedFields: string[];
  maskedSummary: string;
  existingRecordStatus: DivorceRegistration["status"];
};

const ACTIVE_REGISTRATION_STATUSES = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "JUDGMENT_VERIFICATION",
  "FOREIGN_JUDGMENT_REVIEW",
  "EXCEPTION_REVIEW",
  "APPROVED",
  "REGISTERED",
]);

export type DivorceDuplicateCandidateInput = {
  marriageApplicationId?: string;
  courtCaseNumber?: string;
  judgmentNumber?: string;
};

/** Near-identical-registration detection: same underlying marriage plus a
 * matching court case number or judgment number — either alone is enough to
 * flag POTENTIAL, both together is EXACT (spec §8/§17 "no duplicate divorce
 * registration", "court-reference duplication", "judgment-number
 * duplication"). */
export function findDivorceDuplicateCandidates(
  input: DivorceDuplicateCandidateInput,
  existingRegistrations: DivorceRegistration[],
  excludeRegistrationId?: string
): DivorceDuplicateCandidate[] {
  return existingRegistrations
    .filter((reg) => reg.id !== excludeRegistrationId && ACTIVE_REGISTRATION_STATUSES.has(reg.status))
    .map((existing) => {
      const marriageMatch =
        !!input.marriageApplicationId &&
        !!existing.existingMarriage.selected?.marriageApplicationId &&
        input.marriageApplicationId === existing.existingMarriage.selected.marriageApplicationId;
      const caseNumberMatch =
        !!input.courtCaseNumber && normalize(input.courtCaseNumber) === normalize(existing.judgment.courtCaseNumber);
      const judgmentNumberMatch =
        !!input.judgmentNumber && normalize(input.judgmentNumber) === normalize(existing.judgment.judgmentNumber);

      const score = [marriageMatch, caseNumberMatch, judgmentNumberMatch].filter(Boolean).length;
      let matchLevel: DuplicateMatchLevel = "NONE";
      if (caseNumberMatch && judgmentNumberMatch) matchLevel = "EXACT";
      else if (score >= 2) matchLevel = "PROBABLE";
      else if (score >= 1) matchLevel = "POTENTIAL";

      const matchedFields: string[] = [];
      if (marriageMatch) matchedFields.push("Underlying marriage record");
      if (caseNumberMatch) matchedFields.push("Court case number");
      if (judgmentNumberMatch) matchedFields.push("Judgment number");

      return {
        registrationId: existing.id,
        reference: existing.reference,
        matchLevel,
        matchedFields,
        maskedSummary: `${maskName(existing.formerSpouse1.firstName, existing.formerSpouse1.lastName)} & ${maskName(existing.formerSpouse2.firstName, existing.formerSpouse2.lastName)} — ${existing.judgment.courtCaseNumber || "no case number"}`,
        existingRecordStatus: existing.status,
      };
    })
    .filter((candidate) => candidate.matchLevel !== "NONE")
    .sort((a, b) => matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel));
}

export function overallDivorceMatchLevel(candidates: DivorceDuplicateCandidate[]): DuplicateMatchLevel {
  return candidates.reduce<DuplicateMatchLevel>((max, c) => (matchLevelRank(c.matchLevel) > matchLevelRank(max) ? c.matchLevel : max), "NONE");
}

/** "Is this exact marriage already the subject of another active divorce
 * registration?" — the divorce-scoped equivalent of
 * findExistingMarriageConflicts(), called once per case rather than once
 * per spouse since both former spouses share the same underlying marriage. */
export function findExistingDivorceConflicts(
  marriageApplicationId: string | undefined,
  existingRegistrations: DivorceRegistration[],
  excludeRegistrationId?: string
): DivorceDuplicateCandidate[] {
  if (!marriageApplicationId) return [];
  return existingRegistrations
    .filter(
      (reg) =>
        reg.id !== excludeRegistrationId &&
        ACTIVE_REGISTRATION_STATUSES.has(reg.status) &&
        reg.existingMarriage.selected?.marriageApplicationId === marriageApplicationId
    )
    .map((existing) => ({
      registrationId: existing.id,
      reference: existing.reference,
      matchLevel: "EXACT" as DuplicateMatchLevel,
      matchedFields: ["Underlying marriage record"],
      maskedSummary: `${maskName(existing.formerSpouse1.firstName, existing.formerSpouse1.lastName)} & ${maskName(existing.formerSpouse2.firstName, existing.formerSpouse2.lastName)}`,
      existingRecordStatus: existing.status,
    }));
}
