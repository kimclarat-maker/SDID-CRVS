// Deterministic duplicate/conflict-detection simulation for marriage-
// annulment registrations — mirrors divorceDuplicateDetection.ts's split
// into two concerns: (1) has this exact annulment already been registered/
// submitted (findAnnulmentDuplicateCandidates, scored NONE/POTENTIAL/
// PROBABLE/EXACT), and (2) is the SAME marriage already the subject of
// another active annulment registration (findExistingAnnulmentConflicts).
// Adds two checks divorce doesn't need: a RECIPROCAL scan against
// crvsDivorceRegistrations (an already-divorced marriage cannot also be
// annulled — spec §2/§10 "detect an existing divorce... conflicting
// civil-status event") and a read of the demo-only judicial-separation/
// marriage-correction markers (see the scope-boundary note in
// annulmentPolicyConfig.ts).
import { AnnulmentRegistration, DivorceRegistration, DuplicateMatchLevel, MarriageApplication } from "./types";

const normalize = (value?: string) => (value || "").trim().toLowerCase();

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}${"*".repeat(Math.max(first.length - 1, 2))}` : "***";
  const l = last ? `${last.charAt(0)}${"*".repeat(Math.max(last.length - 1, 2))}` : "***";
  return `${f} ${l}`;
};

function matchLevelRank(level: DuplicateMatchLevel): number {
  return { NONE: 0, POTENTIAL: 1, PROBABLE: 2, EXACT: 3 }[level];
}

export type AnnulmentDuplicateCandidate = {
  registrationId: string;
  reference: string;
  matchLevel: DuplicateMatchLevel;
  matchedFields: string[];
  maskedSummary: string;
  existingRecordStatus: AnnulmentRegistration["status"];
};

const ACTIVE_ANNULMENT_STATUSES = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "DECISION_VERIFICATION",
  "LEGAL_EFFECT_REVIEW",
  "FOREIGN_DECISION_REVIEW",
  "EXCEPTION_REVIEW",
  "APPROVED",
  "REGISTERED",
]);

const ACTIVE_DIVORCE_STATUSES = new Set(["REGISTERED"]);

export type AnnulmentDuplicateCandidateInput = {
  marriageApplicationId?: string;
  courtCaseNumber?: string;
  decisionNumber?: string;
};

/** Near-identical-registration detection: same underlying marriage plus a
 * matching court case number or decision number — either alone is enough to
 * flag POTENTIAL, both together is EXACT (spec §21/§31 "no duplicate
 * annulment", "court-reference duplication", "decision-number
 * duplication"). */
export function findAnnulmentDuplicateCandidates(
  input: AnnulmentDuplicateCandidateInput,
  existingRegistrations: AnnulmentRegistration[],
  excludeRegistrationId?: string
): AnnulmentDuplicateCandidate[] {
  return existingRegistrations
    .filter((reg) => reg.id !== excludeRegistrationId && ACTIVE_ANNULMENT_STATUSES.has(reg.status))
    .map((existing) => {
      const marriageMatch =
        !!input.marriageApplicationId &&
        !!existing.existingMarriage.selected?.marriageApplicationId &&
        input.marriageApplicationId === existing.existingMarriage.selected.marriageApplicationId;
      const caseNumberMatch =
        !!input.courtCaseNumber && normalize(input.courtCaseNumber) === normalize(existing.decision.courtCaseNumber);
      const decisionNumberMatch =
        !!input.decisionNumber && normalize(input.decisionNumber) === normalize(existing.decision.decisionNumber);

      const score = [marriageMatch, caseNumberMatch, decisionNumberMatch].filter(Boolean).length;
      let matchLevel: DuplicateMatchLevel = "NONE";
      if (caseNumberMatch && decisionNumberMatch) matchLevel = "EXACT";
      else if (score >= 2) matchLevel = "PROBABLE";
      else if (score >= 1) matchLevel = "POTENTIAL";

      const matchedFields: string[] = [];
      if (marriageMatch) matchedFields.push("Underlying marriage record");
      if (caseNumberMatch) matchedFields.push("Court case number");
      if (decisionNumberMatch) matchedFields.push("Decision number");

      return {
        registrationId: existing.id,
        reference: existing.reference,
        matchLevel,
        matchedFields,
        maskedSummary: `${maskName(existing.affectedParty1.firstName, existing.affectedParty1.lastName)} & ${maskName(existing.affectedParty2.firstName, existing.affectedParty2.lastName)} — ${existing.decision.courtCaseNumber || "no case number"}`,
        existingRecordStatus: existing.status,
      };
    })
    .filter((candidate) => candidate.matchLevel !== "NONE")
    .sort((a, b) => matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel));
}

export function overallAnnulmentMatchLevel(candidates: AnnulmentDuplicateCandidate[]): DuplicateMatchLevel {
  return candidates.reduce<DuplicateMatchLevel>((max, c) => (matchLevelRank(c.matchLevel) > matchLevelRank(max) ? c.matchLevel : max), "NONE");
}

/** "Is this exact marriage already the subject of another active annulment
 * registration?" — called once per case rather than once per party, since
 * both affected parties share the same underlying marriage. */
export function findExistingAnnulmentConflicts(
  marriageApplicationId: string | undefined,
  existingRegistrations: AnnulmentRegistration[],
  excludeRegistrationId?: string
): AnnulmentDuplicateCandidate[] {
  if (!marriageApplicationId) return [];
  return existingRegistrations
    .filter(
      (reg) =>
        reg.id !== excludeRegistrationId &&
        ACTIVE_ANNULMENT_STATUSES.has(reg.status) &&
        reg.existingMarriage.selected?.marriageApplicationId === marriageApplicationId
    )
    .map((existing) => ({
      registrationId: existing.id,
      reference: existing.reference,
      matchLevel: "EXACT" as DuplicateMatchLevel,
      matchedFields: ["Underlying marriage record"],
      maskedSummary: `${maskName(existing.affectedParty1.firstName, existing.affectedParty1.lastName)} & ${maskName(existing.affectedParty2.firstName, existing.affectedParty2.lastName)}`,
      existingRecordStatus: existing.status,
    }));
}

export type AnnulmentDivorceConflictCandidate = {
  registrationId: string;
  reference: string;
  registeredAt?: string;
};

/** Reciprocal check (spec §2/§10) — annulment has no authority to treat an
 * already-dissolved marriage as still capable of being annulled; this is
 * surfaced as EXISTING_DIVORCE_CONFLICT and routed to exception review, not
 * silently ignored or silently allowed. Only REGISTERED divorces count —
 * divorce itself is untouched by this file. */
export function findExistingDivorceConflictForMarriage(
  marriageApplicationId: string | undefined,
  divorceRegistrations: DivorceRegistration[]
): AnnulmentDivorceConflictCandidate[] {
  if (!marriageApplicationId) return [];
  return divorceRegistrations
    .filter(
      (reg) => ACTIVE_DIVORCE_STATUSES.has(reg.status) && reg.existingMarriage.selected?.marriageApplicationId === marriageApplicationId
    )
    .map((reg) => ({ registrationId: reg.id, reference: reg.reference, registeredAt: reg.registeredAt }));
}

/** Reads the demo-only judicial-separation/marriage-correction markers on
 * the marriage record itself (see the scope-boundary note in
 * annulmentPolicyConfig.ts) — never a live cross-module workflow check. */
export function findJudicialSeparationOrCorrectionFlags(marriage?: MarriageApplication): {
  judicialSeparation: boolean;
  correctionPending: boolean;
} {
  return {
    judicialSeparation: !!marriage?.judicialSeparation,
    correctionPending: !!marriage?.correctionPending,
  };
}
