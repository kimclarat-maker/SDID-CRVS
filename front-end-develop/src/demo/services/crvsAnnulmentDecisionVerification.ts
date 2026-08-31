// Runs the discrete annulment decision-verification rule checklist (spec
// §17/§31 "must never claim an annulment is legally valid merely because a
// mock lookup succeeded; display each verification result separately") and
// stores an AnnulmentDecisionVerification with one explicit result per rule
// — never a single collapsed "verified" result. Mirrors
// crvsDivorceJudgmentVerification.ts's shape, with three extra checks
// divorce doesn't need: EXISTING_DIVORCE_CONFLICT (an already-divorced
// marriage cannot also be annulled — spec §2/§10) and
// EXISTING_JUDICIAL_SEPARATION_CONFLICT / MARRIAGE_CORRECTION_IN_PROGRESS
// (reading the demo-only markers via findJudicialSeparationOrCorrectionFlags
// — see the scope-boundary note in annulmentPolicyConfig.ts).
import { getCurrentAccountId } from "@/utils/workspace";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { AnnulmentRegistration, AnnulmentDecisionVerificationRuleResult } from "@/domain/crvs/types";
import { isDecisionFinalityValid, requiresAuthorizationBasis } from "@/domain/crvs/annulmentPolicyConfig";
import { assertTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import {
  findAnnulmentDuplicateCandidates,
  overallAnnulmentMatchLevel,
  findExistingDivorceConflictForMarriage,
  findJudicialSeparationOrCorrectionFlags,
} from "@/domain/crvs/annulmentDuplicateDetection";
import { canApproveAnnulmentCase, canAccessAnnulmentCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

function evaluateRules(reg: AnnulmentRegistration, db: ReturnType<typeof getDemoData>): AnnulmentDecisionVerificationRuleResult[] {
  const results: AnnulmentDecisionVerificationRuleResult[] = [];

  const courtRefOk = !!reg.decision.courtCaseNumber && !!reg.decision.courtOrAuthorityName;
  results.push({
    rule: "COURT_REFERENCE",
    passed: courtRefOk,
    severity: courtRefOk ? "INFO" : "BLOCKING",
    message: courtRefOk ? "Court/authority name and case number are recorded." : "Court/authority name or case number is missing.",
  });

  // Demo-only stand-in for a real decision-authenticity check against a
  // court records system — never claims a binding legal determination (spec
  // §17 "decision authenticity placeholder").
  const hasSignedDocument = reg.evidence.some((e) => !e.removed && e.documentType === "FINAL_ANNULMENT_DECISION");
  results.push({
    rule: "DECISION_AUTHENTICITY_PLACEHOLDER",
    passed: hasSignedDocument,
    severity: hasSignedDocument ? "INFO" : "REVIEW",
    message: hasSignedDocument
      ? "A final annulment decision document is on file (demo placeholder — not a real court-authenticity verification)."
      : "No final annulment decision document is on file to support authenticity review.",
  });

  const finalityOk = isDecisionFinalityValid(reg.decision.decisionDate, reg.decision.finalityDate);
  results.push({
    rule: "DECISION_FINALITY",
    passed: finalityOk,
    severity: finalityOk ? "INFO" : "BLOCKING",
    message: finalityOk
      ? "The decision is recorded as final and the finality date does not precede the decision date."
      : "The decision is not yet recorded as final, or the finality date precedes the decision date.",
  });

  const marriageOk = reg.existingMarriage.status === "MATCHED" && !!reg.existingMarriage.selected;
  results.push({
    rule: "MARRIAGE_MATCH",
    passed: marriageOk,
    severity: marriageOk ? "INFO" : "BLOCKING",
    message: marriageOk ? `Matched to marriage ${reg.existingMarriage.selected?.registrationNumber}.` : "No verified existing marriage has been matched to this registration.",
  });

  const party1Ok = reg.affectedParty1.identityMatchConfidence === "CONFIRMED";
  results.push({
    rule: "PARTY_1_IDENTITY",
    passed: party1Ok,
    severity: party1Ok ? "INFO" : "REVIEW",
    message: party1Ok ? "The first affected party's identity is confirmed." : "The first affected party's identity match confidence is below the confirmed threshold.",
  });

  const party2Ok = reg.affectedParty2.identityMatchConfidence === "CONFIRMED";
  results.push({
    rule: "PARTY_2_IDENTITY",
    passed: party2Ok,
    severity: party2Ok ? "INFO" : "REVIEW",
    message: party2Ok ? "The second affected party's identity is confirmed." : "The second affected party's identity match confidence is below the confirmed threshold.",
  });

  const civilStatusOk = reg.affectedParty1.currentCivilStatus !== "DIVORCED" && reg.affectedParty2.currentCivilStatus !== "DIVORCED";
  results.push({
    rule: "EXISTING_CIVIL_STATUS",
    passed: civilStatusOk,
    severity: civilStatusOk ? "INFO" : "BLOCKING",
    message: civilStatusOk
      ? "Neither affected party's SDID civil status already shows divorced from this marriage."
      : "At least one affected party's SDID civil status already shows divorced — possible conflict.",
  });

  const candidates = findAnnulmentDuplicateCandidates(
    {
      marriageApplicationId: reg.existingMarriage.selected?.marriageApplicationId,
      courtCaseNumber: reg.decision.courtCaseNumber,
      decisionNumber: reg.decision.decisionNumber,
    },
    db.crvsAnnulmentRegistrations,
    reg.id
  );
  const overallMatchLevel = overallAnnulmentMatchLevel(candidates);
  const caseRefDuplicate = candidates.some((c) => c.matchedFields.includes("Court case number"));
  results.push({
    rule: "DUPLICATE_ANNULMENT",
    passed: overallMatchLevel === "NONE",
    severity: overallMatchLevel === "EXACT" ? "BLOCKING" : overallMatchLevel === "NONE" ? "INFO" : "REVIEW",
    message: overallMatchLevel === "NONE" ? "No duplicate annulment registration detected." : `${candidates.length} potential duplicate annulment registration(s) found (${overallMatchLevel}).`,
  });

  results.push({
    rule: "COURT_REFERENCE_DUPLICATE",
    passed: !caseRefDuplicate,
    severity: caseRefDuplicate ? "BLOCKING" : "INFO",
    message: caseRefDuplicate ? "This court case number matches another registration on file." : "No other registration shares this court case number.",
  });

  const decisionNumberDuplicate = candidates.some((c) => c.matchedFields.includes("Decision number"));
  results.push({
    rule: "DECISION_NUMBER_DUPLICATE",
    passed: !decisionNumberDuplicate,
    severity: decisionNumberDuplicate ? "BLOCKING" : "INFO",
    message: decisionNumberDuplicate ? "This decision number matches another registration on file." : "No other registration shares this decision number.",
  });

  const marriageApplicationId = reg.existingMarriage.selected?.marriageApplicationId;
  const divorceConflicts = findExistingDivorceConflictForMarriage(marriageApplicationId, db.crvsDivorceRegistrations);
  results.push({
    rule: "EXISTING_DIVORCE_CONFLICT",
    passed: divorceConflicts.length === 0,
    severity: divorceConflicts.length === 0 ? "INFO" : "BLOCKING",
    message: divorceConflicts.length === 0 ? "No existing divorce registration was found for this marriage." : `This marriage already has a registered divorce (${divorceConflicts.map((c) => c.reference).join(", ")}).`,
  });

  const marriage = marriageApplicationId ? db.crvsMarriageApplications.find((m) => m.id === marriageApplicationId) : undefined;
  const { judicialSeparation, correctionPending } = findJudicialSeparationOrCorrectionFlags(marriage);
  results.push({
    rule: "EXISTING_JUDICIAL_SEPARATION_CONFLICT",
    passed: !judicialSeparation,
    severity: judicialSeparation ? "REVIEW" : "INFO",
    message: judicialSeparation ? "This marriage has an existing judicial-separation record on file." : "No existing judicial-separation record was found for this marriage.",
  });

  results.push({
    rule: "MARRIAGE_CORRECTION_IN_PROGRESS",
    passed: !correctionPending,
    severity: correctionPending ? "REVIEW" : "INFO",
    message: correctionPending ? "A correction to this marriage record is in progress." : "No correction to this marriage record is in progress.",
  });

  const foreignReviewNeeded = reg.decision.isForeign;
  results.push({
    rule: "FOREIGN_DECISION_REVIEW_REQUIRED",
    passed: !foreignReviewNeeded || reg.foreignRecognition.status === "REQUIREMENTS_SATISFIED",
    severity: foreignReviewNeeded && reg.foreignRecognition.status !== "REQUIREMENTS_SATISFIED" ? "REVIEW" : "INFO",
    message: !foreignReviewNeeded
      ? "This is not a foreign decision."
      : reg.foreignRecognition.status === "REQUIREMENTS_SATISFIED"
      ? "Foreign-decision recognition requirements are satisfied."
      : "This is a foreign decision and recognition requirements are not yet satisfied.",
  });

  const jurisdictionOk = canAccessAnnulmentCaseJurisdiction(reg.jurisdiction);
  results.push({
    rule: "JURISDICTION",
    passed: jurisdictionOk,
    severity: jurisdictionOk ? "INFO" : "BLOCKING",
    message: jurisdictionOk ? "Processing office is within the reviewing officer's jurisdiction." : "Processing office is outside the reviewing officer's jurisdiction.",
  });

  const authorityOk = !requiresAuthorizationBasis(reg.applicant.relationshipToCase) || !!reg.applicant.authorizationBasis;
  results.push({
    rule: "APPLICANT_AUTHORITY",
    passed: authorityOk,
    severity: authorityOk ? "INFO" : "REVIEW",
    message: authorityOk ? "The applicant's authority to submit this request is recorded." : "This applicant's relationship to the case requires a declared authorization basis, which is missing.",
  });

  const accountId = getCurrentAccountId();
  const { allowed: makerCheckerOk, reasons: makerCheckerReasons } = canApproveAnnulmentCase(accountId, reg);
  const conflictReasons = makerCheckerReasons.filter(
    (r) => !r.includes("jurisdiction") && !r.includes("correction") && !r.includes("exception") && !r.includes("legal-effect")
  );
  results.push({
    rule: "MAKER_CHECKER",
    passed: makerCheckerOk,
    severity: makerCheckerOk ? "INFO" : "BLOCKING",
    message: makerCheckerOk ? "No maker-checker conflict for the current reviewer." : makerCheckerReasons.join(" "),
  });

  results.push({
    rule: "CONFLICT_OF_INTEREST",
    passed: conflictReasons.length === 0,
    severity: conflictReasons.length === 0 ? "INFO" : "BLOCKING",
    message: conflictReasons.length === 0 ? "No declared conflict of interest for the current reviewer." : conflictReasons.join(" "),
  });

  return results;
}

export const demoRunAnnulmentDecisionVerification = async (registrationId: string, actorName: string): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");

    const results = evaluateRules(reg, db);
    const blocking = results.some((r) => !r.passed && r.severity === "BLOCKING");
    const needsReview = results.some((r) => !r.passed && r.severity === "REVIEW");

    reg.decisionVerification = {
      status: blocking ? "CONFLICT_FOUND" : needsReview ? "MANUAL_REVIEW" : "VERIFIED",
      checkedAt: new Date().toISOString(),
      checkedBy: actorName,
      results,
      overallOutcome: blocking ? "REQUIRES_CORRECTION" : needsReview ? "REQUIRES_EXCEPTION" : "VERIFIED",
    };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran decision verification",
      "crvs.annulment_decision_verification",
      reg.reference,
      `Outcome: ${reg.decisionVerification.status} (${results.filter((r) => !r.passed).length} rule(s) not passed).`
    );
    result = reg;
    return db;
  });
  return result!;
};

export const demoCompleteAnnulmentDecisionVerification = async (
  registrationId: string,
  nextStatus: AnnulmentRegistration["status"],
  actorName: string
): Promise<AnnulmentRegistration> => {
  let result: AnnulmentRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    assertTransitionAnnulmentRegistration(reg.status, nextStatus);
    const now = new Date().toISOString();
    reg.status = nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: nextStatus, at: now, by: actorName, note: "Decision verification complete." });
    logCrvsAudit(db, actorName, "completed decision verification", "crvs.annulment_decision_verification", reg.reference, `Now ${nextStatus}.`);
    result = reg;
    return db;
  });
  return result!;
};
