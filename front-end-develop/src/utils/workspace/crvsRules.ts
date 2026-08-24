import { BirthRegistrationCase, BirthCertificateRequest, DeathRegistrationCase } from "@/domain/crvs/types";
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

/**
 * Conflict-of-interest reasons for reviewing a certificate request (spec
 * §23 "Conflict of Interest" modal / spec §3 "must not approve a request
 * involving a conflict of interest"): a reviewer must not approve a request
 * they themselves submitted (staff-assisted, self-conflict) or one where
 * they are the verified requester.
 */
export function certificateReviewConflictReasons(
  accountId: string | undefined,
  request: Pick<BirthCertificateRequest, "createdBy" | "requester">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === request.createdBy.id) reasons.push("You created this certificate request.");
  if (request.requester.matchedIdentityId === accountId) {
    reasons.push("You are the verified requester on this certificate request.");
  }
  return reasons;
}

/**
 * Full approval gate for certificate requests, mirroring canApproveCase()
 * above. SUPERADMIN never bypasses this for the same reason it never
 * bypasses canApproveCase — the bypass in hasWorkspacePermission() is
 * explicitly scoped away from every crvs.* permission.
 */
export function canApproveCertificateRequest(
  accountId: string | undefined,
  request: Pick<BirthCertificateRequest, "createdBy" | "requester">
): { allowed: boolean; reasons: string[] } {
  const reasons = certificateReviewConflictReasons(accountId, request);
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Conflict-of-interest reasons for a death-registration case, mirroring
 * conflictOfInterestReasons() above: a Civil Registrar must not approve a
 * case they created, or one where they are the declarant, a next of kin, or
 * a witness (spec §2 "conflicts of interest must block approval").
 */
export function deathConflictOfInterestReasons(
  accountId: string | undefined,
  deathCase: Pick<DeathRegistrationCase, "officerId" | "declarant" | "nextOfKin" | "witnesses">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === deathCase.officerId) reasons.push("You created this case.");
  if (deathCase.declarant.sdidIdentityId === accountId) reasons.push("You are the declarant on this case.");
  if (deathCase.nextOfKin.some((k) => k.sdidIdentityId === accountId)) {
    reasons.push("You are listed as next of kin on this case.");
  }
  if (deathCase.witnesses.some((w) => w.sdidIdentityId === accountId)) {
    reasons.push("You are a witness on this case.");
  }
  return reasons;
}

/** Same jurisdiction-gate shape as canAccessCaseJurisdiction(), scoped to death cases. */
export function canAccessDeathCaseJurisdiction(caseJurisdiction: string | undefined): boolean {
  return canAccessCaseJurisdiction(caseJurisdiction);
}

/**
 * Full approval gate for death-registration cases: creator + conflict-of-
 * interest + jurisdiction + open-correction checks, exactly mirroring
 * canApproveCase() for birth. The Civil Registrar's explicit "I did not
 * prepare this case" confirmation checkbox (spec §2) is enforced separately
 * by the approval modal/service — this function is the automatic half of
 * the maker-checker gate, not a replacement for that confirmation.
 */
export function canApproveDeathCase(
  accountId: string | undefined,
  deathCase: Pick<
    DeathRegistrationCase,
    "officerId" | "declarant" | "nextOfKin" | "witnesses" | "jurisdiction" | "correctionRequests"
  >
): { allowed: boolean; reasons: string[] } {
  const reasons = deathConflictOfInterestReasons(accountId, deathCase);
  if (!canAccessDeathCaseJurisdiction(deathCase.jurisdiction)) {
    reasons.push("This case is outside your assigned jurisdiction.");
  }
  const openCorrection = deathCase.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) reasons.push("There is a pending correction request on this case.");
  return { allowed: reasons.length === 0, reasons };
}
