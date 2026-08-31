import {
  BirthRegistrationCase,
  BirthCertificateRequest,
  DeathRegistrationCase,
  MarriageApplication,
  DivorceRegistration,
  AnnulmentRegistration,
} from "@/domain/crvs/types";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
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

/**
 * Conflict-of-interest reasons for a marriage application — genuinely
 * two-party, unlike every check above: checks the approver against BOTH
 * spouses and every witness across BOTH spouses' witness lists, not one
 * subject (spec §3 "the staff member who prepared the application must not
 * perform its final legal approval").
 */
export function marriageConflictOfInterestReasons(
  accountId: string | undefined,
  application: Pick<MarriageApplication, "officerId" | "applicant1" | "applicant2" | "witnesses">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === application.officerId) reasons.push("You prepared this application.");
  if (application.applicant1.sdidIdentityId === accountId) reasons.push("You are applicant 1 on this application.");
  if (application.applicant2.sdidIdentityId === accountId) reasons.push("You are applicant 2 on this application.");
  if (application.witnesses.some((w) => w.sdidIdentityId === accountId)) {
    reasons.push("You are a witness on this application.");
  }
  return reasons;
}

/** Same jurisdiction-gate shape as canAccessCaseJurisdiction(), scoped to marriage applications. */
export function canAccessMarriageCaseJurisdiction(caseJurisdiction: string | undefined): boolean {
  return canAccessCaseJurisdiction(caseJurisdiction);
}

/**
 * Full approval gate for marriage applications: conflict-of-interest +
 * jurisdiction + open-correction + open-objection checks, plus a
 * marriage-only third dimension not present in birth/death — when
 * marriagePolicyConfig.ceremony.separationOfDutiesRequired is set, the
 * approver must also not be the ceremony's recorded officiant, enforcing a
 * genuine three-party maker-checker chain (preparing officer, conducting
 * officiant, approving registrar) rather than birth/death's two-party one.
 */
export function canApproveMarriageCase(
  accountId: string | undefined,
  application: Pick<
    MarriageApplication,
    "officerId" | "applicant1" | "applicant2" | "witnesses" | "jurisdiction" | "correctionRequests" | "objection"
  >,
  ceremonyOfficiantId?: string
): { allowed: boolean; reasons: string[] } {
  const reasons = marriageConflictOfInterestReasons(accountId, application);
  if (!canAccessMarriageCaseJurisdiction(application.jurisdiction)) {
    reasons.push("This application is outside your assigned jurisdiction.");
  }
  const openCorrection = application.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) reasons.push("There is a pending correction request on this application.");
  if (application.objection && application.objection.status === "PENDING") {
    reasons.push("There is a pending objection on this application.");
  }
  if (
    marriagePolicyConfig.ceremony.separationOfDutiesRequired &&
    accountId &&
    ceremonyOfficiantId &&
    accountId === ceremonyOfficiantId
  ) {
    reasons.push("You conducted the ceremony for this application and cannot also approve its registration.");
  }
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Conflict-of-interest reasons for a divorce registration (spec §4 "A user
 * who prepared or submitted a case cannot perform its final approval... must
 * block a Registrar from processing a case involving themselves"): checks
 * the approver against the officer who prepared the case, the applicant, and
 * both former spouses.
 */
export function divorceConflictOfInterestReasons(
  accountId: string | undefined,
  registration: Pick<DivorceRegistration, "officerId" | "applicant" | "formerSpouse1" | "formerSpouse2">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === registration.officerId) reasons.push("You prepared this divorce registration.");
  if (registration.applicant.sdidIdentityId === accountId) reasons.push("You are the applicant on this registration.");
  if (registration.formerSpouse1.sdidIdentityId === accountId) reasons.push("You are former spouse 1 on this registration.");
  if (registration.formerSpouse2.sdidIdentityId === accountId) reasons.push("You are former spouse 2 on this registration.");
  return reasons;
}

/** Same jurisdiction-gate shape as canAccessCaseJurisdiction(), scoped to divorce registrations. */
export function canAccessDivorceCaseJurisdiction(caseJurisdiction: string | undefined): boolean {
  return canAccessCaseJurisdiction(caseJurisdiction);
}

/**
 * Full approval gate for divorce registrations: conflict-of-interest +
 * jurisdiction + open-correction + open-exception checks, plus the
 * Registrar's explicit "I did not prepare this case" / conflict-of-interest
 * declaration (spec §4/§17/§21) enforced separately by the approval
 * modal/service — this function is the automatic half of the maker-checker
 * gate, not a replacement for that confirmation.
 */
export function canApproveDivorceCase(
  accountId: string | undefined,
  registration: Pick<
    DivorceRegistration,
    "officerId" | "applicant" | "formerSpouse1" | "formerSpouse2" | "jurisdiction" | "correctionRequests" | "exception"
  >
): { allowed: boolean; reasons: string[] } {
  const reasons = divorceConflictOfInterestReasons(accountId, registration);
  if (!canAccessDivorceCaseJurisdiction(registration.jurisdiction)) {
    reasons.push("This divorce registration is outside your assigned jurisdiction.");
  }
  const openCorrection = registration.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) reasons.push("There is a pending correction request on this registration.");
  if (registration.exception && registration.exception.status === "OPEN") {
    reasons.push("There is an open exception on this registration.");
  }
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Conflict-of-interest reasons for a marriage-annulment registration (spec
 * §5 "A user who created, prepared, or submitted a case cannot provide final
 * approval... must block a Registrar from processing an annulment involving
 * themselves"): checks the approver against the officer who prepared the
 * case, the applicant, and both affected parties.
 */
export function annulmentConflictOfInterestReasons(
  accountId: string | undefined,
  registration: Pick<AnnulmentRegistration, "officerId" | "applicant" | "affectedParty1" | "affectedParty2">
): string[] {
  if (!accountId) return [];
  const reasons: string[] = [];
  if (accountId === registration.officerId) reasons.push("You prepared this annulment registration.");
  if (registration.applicant.sdidIdentityId === accountId) reasons.push("You are the applicant on this registration.");
  if (registration.affectedParty1.sdidIdentityId === accountId) reasons.push("You are the first affected party on this registration.");
  if (registration.affectedParty2.sdidIdentityId === accountId) reasons.push("You are the second affected party on this registration.");
  return reasons;
}

/** Same jurisdiction-gate shape as canAccessCaseJurisdiction(), scoped to annulment registrations. */
export function canAccessAnnulmentCaseJurisdiction(caseJurisdiction: string | undefined): boolean {
  return canAccessCaseJurisdiction(caseJurisdiction);
}

/**
 * Full approval gate for marriage-annulment registrations:
 * conflict-of-interest + jurisdiction + open-correction/evidence-request +
 * open-exception + unresolved-legal-effect-classification checks, plus the
 * Registrar's explicit "I did not prepare this case" / conflict-of-interest
 * declaration (spec §5/§18/§22) enforced separately by the approval
 * modal/service — this function is the automatic half of the maker-checker
 * gate, not a replacement for that confirmation. Approval is blocked while
 * the legal-effect classification is unresolved (spec §22 "approval cannot
 * occur while material verification or exception checks remain
 * unresolved") — legal-effect confirmation must happen first.
 */
export function canApproveAnnulmentCase(
  accountId: string | undefined,
  registration: Pick<
    AnnulmentRegistration,
    "officerId" | "applicant" | "affectedParty1" | "affectedParty2" | "jurisdiction" | "correctionRequests" | "exception" | "legalEffect"
  >
): { allowed: boolean; reasons: string[] } {
  const reasons = annulmentConflictOfInterestReasons(accountId, registration);
  if (!canAccessAnnulmentCaseJurisdiction(registration.jurisdiction)) {
    reasons.push("This annulment registration is outside your assigned jurisdiction.");
  }
  const openCorrection = registration.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) reasons.push("There is a pending correction or evidence request on this registration.");
  if (registration.exception && registration.exception.status === "OPEN") {
    reasons.push("There is an open exception on this registration.");
  }
  if (!registration.legalEffect.confirmedClassification) {
    reasons.push("The legal-effect classification has not yet been confirmed.");
  }
  return { allowed: reasons.length === 0, reasons };
}
