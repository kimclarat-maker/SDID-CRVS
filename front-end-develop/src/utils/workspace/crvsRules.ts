import { BirthRegistrationCase } from "@/domain/crvs/types";
import { getAssignmentForWorkspace } from ".";

/**
 * A Civil Registrar must not approve a registration case they created
 * themselves. Kept as a standalone predicate so it's independently testable
 * and reusable once the real registration-review workflow ships.
 */
export function canApproveRegistration(
  currentAccountId: string | undefined,
  caseOfficerId: string | undefined
): boolean {
  if (!currentAccountId || !caseOfficerId) return false;
  return currentAccountId !== caseOfficerId;
}

/**
 * Every identity a registrar is disqualified from approving because they're
 * personally involved in the case, distinct from the "creator" check above
 * (spec §2/§14 "Conflict of Interest"): parent, declarant, witness.
 */
export function conflictOfInterestReasons(
  accountId: string | undefined,
  registrationCase: Pick<BirthRegistrationCase, "officerId" | "mother" | "father" | "declarant" | "witnesses">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === registrationCase.officerId) reasons.push("You created this case.");
  if (registrationCase.mother.sdidIdentityId === accountId) reasons.push("You are the mother on this case.");
  if (registrationCase.father.sdidIdentityId === accountId) reasons.push("You are the father on this case.");
  if (registrationCase.declarant.sdidIdentityId === accountId) reasons.push("You are the declarant on this case.");
  if (registrationCase.witnesses.some((w) => w.sdidIdentityId === accountId)) {
    reasons.push("You are a witness on this case.");
  }
  return reasons;
}

/**
 * Jurisdiction gate for CRVS case actions. A NATIONAL-level assignment
 * covers everything; otherwise the assignment's named jurisdiction must
 * match the case's jurisdiction string exactly. CRVS case records store
 * jurisdiction as a plain display string (see demo/seed/crvsRegistrations.ts)
 * rather than the {level,id} shape utils/workspace's canAccessJurisdiction()
 * expects for SDID's jurisdiction tree, so this is a small, CRVS-scoped
 * sibling of that helper rather than a reuse of it.
 */
export function canAccessCaseJurisdiction(caseJurisdiction: string | undefined): boolean {
  const assignment = getAssignmentForWorkspace("CRVS");
  const jurisdiction = assignment?.jurisdiction;
  if (!jurisdiction) return true; // no jurisdiction restriction configured for this demo account
  if (jurisdiction.level === "NATIONAL") return true;
  return (jurisdiction.name || jurisdiction.id) === caseJurisdiction;
}

/**
 * Full approval gate combining creator, conflict-of-interest, and
 * jurisdiction checks — SUPERADMIN never bypasses this (spec §2: "May not
 * receive approval authority only because they are SUPERADMIN" — SUPERADMIN
 * is an SDID-only role and never carries a CRVS assignment in the first
 * place, so it simply has no path into this function at all).
 */
export function canApproveCase(
  accountId: string | undefined,
  registrationCase: Pick<
    BirthRegistrationCase,
    "officerId" | "mother" | "father" | "declarant" | "witnesses" | "jurisdiction" | "correctionRequests"
  >
): { allowed: boolean; reasons: string[] } {
  const reasons = conflictOfInterestReasons(accountId, registrationCase);
  if (!canAccessCaseJurisdiction(registrationCase.jurisdiction)) {
    reasons.push("This case is outside your assigned jurisdiction.");
  }
  const openCorrection = registrationCase.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) reasons.push("There is a pending correction request on this case.");
  return { allowed: reasons.length === 0, reasons };
}
