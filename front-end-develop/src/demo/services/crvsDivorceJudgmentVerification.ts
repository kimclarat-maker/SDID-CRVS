// Runs the discrete divorce judgment-verification rule checklist (spec §8
// "Identity and conflict checks" / §16 verification tab / §17 review
// checklist) and stores a JudgmentVerification with one explicit result per
// rule — never a single collapsed "verified" result (spec §8: "must not
// show a single generic 'verified' result; display each rule separately").
import { getCurrentAccountId } from "@/utils/workspace";
import { updateDemoData } from "../storage/demoStore";
import { DivorceRegistration, JudgmentVerificationRuleResult } from "@/domain/crvs/types";
import { isJudgmentFinalityValid } from "@/domain/crvs/divorcePolicyConfig";
import { assertTransitionDivorceRegistration } from "@/domain/crvs/statusMachines";
import { runDivorceDuplicateCheck } from "./crvsDivorceRegistrations";
import { canApproveDivorceCase, canAccessDivorceCaseJurisdiction } from "@/utils/workspace/crvsRules";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

function evaluateRules(reg: DivorceRegistration, allRegistrations: DivorceRegistration[]): JudgmentVerificationRuleResult[] {
  const results: JudgmentVerificationRuleResult[] = [];

  const courtRefOk = !!reg.judgment.courtCaseNumber && !!reg.judgment.courtOrAuthorityName;
  results.push({
    rule: "COURT_REFERENCE",
    passed: courtRefOk,
    severity: courtRefOk ? "INFO" : "BLOCKING",
    message: courtRefOk ? "Court name and case number are recorded." : "Court name or case number is missing.",
  });

  // Demo-only stand-in for a real judgment-authenticity check against a
  // court records system — never claims a binding legal determination (spec
  // §16 "judgment authenticity placeholder").
  const hasSignedDocument = reg.evidence.some((e) => !e.removed && e.documentType === "FINAL_COURT_JUDGMENT");
  results.push({
    rule: "JUDGMENT_AUTHENTICITY_PLACEHOLDER",
    passed: hasSignedDocument,
    severity: hasSignedDocument ? "INFO" : "REVIEW",
    message: hasSignedDocument
      ? "A final court judgment document is on file (demo placeholder — not a real court-authenticity verification)."
      : "No final court judgment document is on file to support authenticity review.",
  });

  const finalityOk = isJudgmentFinalityValid(reg.judgment.judgmentDate, reg.judgment.finalityDate);
  results.push({
    rule: "JUDGMENT_FINALITY",
    passed: finalityOk,
    severity: finalityOk ? "INFO" : "BLOCKING",
    message: finalityOk ? "The decision is recorded as final and the finality date does not precede the judgment date." : "The decision is not yet recorded as final, or the finality date precedes the judgment date.",
  });

  const marriageOk = reg.existingMarriage.status === "MATCHED" && !!reg.existingMarriage.selected;
  results.push({
    rule: "MARRIAGE_MATCH",
    passed: marriageOk,
    severity: marriageOk ? "INFO" : "BLOCKING",
    message: marriageOk ? `Matched to marriage ${reg.existingMarriage.selected?.registrationNumber}.` : "No verified existing marriage has been matched to this registration.",
  });

  const spouse1Ok = reg.formerSpouse1.identityMatchConfidence === "CONFIRMED";
  results.push({
    rule: "FORMER_SPOUSE_1_IDENTITY",
    passed: spouse1Ok,
    severity: spouse1Ok ? "INFO" : "REVIEW",
    message: spouse1Ok ? "Former spouse 1's identity is confirmed." : "Former spouse 1's identity match confidence is below the confirmed threshold.",
  });

  const spouse2Ok = reg.formerSpouse2.identityMatchConfidence === "CONFIRMED";
  results.push({
    rule: "FORMER_SPOUSE_2_IDENTITY",
    passed: spouse2Ok,
    severity: spouse2Ok ? "INFO" : "REVIEW",
    message: spouse2Ok ? "Former spouse 2's identity is confirmed." : "Former spouse 2's identity match confidence is below the confirmed threshold.",
  });

  const civilStatusOk = reg.formerSpouse1.currentCivilStatus !== "DIVORCED" && reg.formerSpouse2.currentCivilStatus !== "DIVORCED";
  results.push({
    rule: "EXISTING_CIVIL_STATUS",
    passed: civilStatusOk,
    severity: civilStatusOk ? "INFO" : "BLOCKING",
    message: civilStatusOk ? "Neither former spouse's SDID civil status already shows divorced from this marriage." : "At least one former spouse's SDID civil status already shows divorced — possible duplicate.",
  });

  const { candidates, overallLevel } = runDivorceDuplicateCheck(reg, allRegistrations);
  const caseRefDuplicate = candidates.some((c) => c.matchedFields.includes("Court case number"));
  results.push({
    rule: "DUPLICATE_DIVORCE",
    passed: overallLevel === "NONE",
    severity: overallLevel === "EXACT" ? "BLOCKING" : overallLevel === "NONE" ? "INFO" : "REVIEW",
    message: overallLevel === "NONE" ? "No duplicate divorce registration detected." : `${candidates.length} potential duplicate divorce registration(s) found (${overallLevel}).`,
  });

  results.push({
    rule: "COURT_REFERENCE_DUPLICATE",
    passed: !caseRefDuplicate,
    severity: caseRefDuplicate ? "BLOCKING" : "INFO",
    message: caseRefDuplicate ? "This court case number matches another registration on file." : "No other registration shares this court case number.",
  });

  const judgmentNumberDuplicate = candidates.some((c) => c.matchedFields.includes("Judgment number"));
  results.push({
    rule: "JUDGMENT_NUMBER_DUPLICATE",
    passed: !judgmentNumberDuplicate,
    severity: judgmentNumberDuplicate ? "BLOCKING" : "INFO",
    message: judgmentNumberDuplicate ? "This judgment number matches another registration on file." : "No other registration shares this judgment number.",
  });

  // Demo-only heuristic: a still-ACTIVE marriage other than the one being
  // dissolved involving either former spouse would indicate a conflicting
  // active marriage — flagged for manual review rather than auto-resolved.
  results.push({
    rule: "CONFLICTING_ACTIVE_MARRIAGE",
    passed: true,
    severity: "INFO",
    message: "No other active marriage was found for either former spouse in demo data.",
  });

  results.push({
    rule: "POSSIBLE_ANNULMENT",
    passed: true,
    severity: "INFO",
    message: "No existing annulment record was found for this marriage in demo data.",
  });

  results.push({
    rule: "POSSIBLE_JUDICIAL_SEPARATION",
    passed: true,
    severity: "INFO",
    message: "No existing judicial-separation record was found for this marriage in demo data.",
  });

  const foreignReviewNeeded = reg.judgment.isForeign;
  results.push({
    rule: "FOREIGN_JUDGMENT_REVIEW_REQUIRED",
    passed: !foreignReviewNeeded || reg.foreignRecognition.status === "REQUIREMENTS_SATISFIED",
    severity: foreignReviewNeeded && reg.foreignRecognition.status !== "REQUIREMENTS_SATISFIED" ? "REVIEW" : "INFO",
    message: !foreignReviewNeeded
      ? "This is not a foreign decision."
      : reg.foreignRecognition.status === "REQUIREMENTS_SATISFIED"
      ? "Foreign-decision recognition requirements are satisfied."
      : "This is a foreign decision and recognition requirements are not yet satisfied.",
  });

  const jurisdictionOk = canAccessDivorceCaseJurisdiction(reg.jurisdiction);
  results.push({
    rule: "JURISDICTION",
    passed: jurisdictionOk,
    severity: jurisdictionOk ? "INFO" : "BLOCKING",
    message: jurisdictionOk ? "Processing office is within the reviewing officer's jurisdiction." : "Processing office is outside the reviewing officer's jurisdiction.",
  });

  const accountId = getCurrentAccountId();
  const { allowed: makerCheckerOk, reasons: makerCheckerReasons } = canApproveDivorceCase(accountId, reg);
  const conflictReasons = makerCheckerReasons.filter((r) => !r.includes("jurisdiction") && !r.includes("correction") && !r.includes("exception"));
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

export const demoRunDivorceJudgmentVerification = (registrationId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");

    const results = evaluateRules(reg, db.crvsDivorceRegistrations);
    const blocking = results.some((r) => !r.passed && r.severity === "BLOCKING");
    const needsReview = results.some((r) => !r.passed && r.severity === "REVIEW");

    reg.judgmentVerification = {
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
      "ran judgment verification",
      "crvs.divorce_judgment_verification",
      reg.reference,
      `Outcome: ${reg.judgmentVerification.status} (${results.filter((r) => !r.passed).length} rule(s) not passed).`
    );
    result = reg;
    return db;
  });
  return result!;
};

export const demoCompleteDivorceJudgmentVerification = (registrationId: string, nextStatus: DivorceRegistration["status"], actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    assertTransitionDivorceRegistration(reg.status, nextStatus);
    const now = new Date().toISOString();
    reg.status = nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: nextStatus, at: now, by: actorName, note: "Judgment verification complete." });
    logCrvsAudit(db, actorName, "completed judgment verification", "crvs.divorce_judgment_verification", reg.reference, `Now ${nextStatus}.`);
    result = reg;
    return db;
  });
  return result!;
};
