// Runs the discrete marriage-eligibility rule checklist (spec §5 step 5 /
// §7 eligibility-review workspace) and stores a MarriageEligibilityCheck
// with one explicit result per rule — never a single collapsed pass/fail
// (spec §12: "must not claim legally eligible merely because a mock
// identity lookup succeeded").
import { updateDemoData } from "../storage/demoStore";
import {
  MarriageApplication,
  MarriageEligibilityRuleResult,
  MarriageExistingConflictCandidate,
} from "@/domain/crvs/types";
import {
  marriagePolicyConfig,
  isAdvanceNoticeSatisfied,
  meetsMinimumAge,
  requiredDocumentsFor,
  witnessRequirementForSpouse,
} from "@/domain/crvs/marriagePolicyConfig";
import { findExistingMarriageConflicts } from "@/domain/crvs/marriageDuplicateDetection";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

function evaluateRules(app: MarriageApplication, existingApplications: MarriageApplication[]): {
  results: MarriageEligibilityRuleResult[];
  conflicts: { spouseRole: "APPLICANT1" | "APPLICANT2"; candidate: MarriageExistingConflictCandidate }[];
} {
  const results: MarriageEligibilityRuleResult[] = [];
  const ceremonyDate = app.proposedMarriageDate || new Date().toISOString();
  const referenceDate = app.submittedAt || app.createdAt;

  const age1Ok = meetsMinimumAge(app.applicant1.dateOfBirth, ceremonyDate);
  const age2Ok = meetsMinimumAge(app.applicant2.dateOfBirth, ceremonyDate);
  results.push({
    rule: "AGE",
    passed: age1Ok && age2Ok,
    severity: age1Ok && age2Ok ? "INFO" : marriagePolicyConfig.age.exceptionAllowed ? "REVIEW" : "BLOCKING",
    message:
      age1Ok && age2Ok
        ? `Both applicants meet the minimum marriage age of ${marriagePolicyConfig.age.minimumAge}.`
        : `At least one applicant does not meet the minimum marriage age of ${marriagePolicyConfig.age.minimumAge}${marriagePolicyConfig.age.exceptionAllowed ? " — requires a supervisor-reviewed exception." : "."}`,
    affectedSpouse: !age1Ok && !age2Ok ? "BOTH" : !age1Ok ? "APPLICANT1" : !age2Ok ? "APPLICANT2" : undefined,
  });

  const noticeOk = app.proposedMarriageDate ? isAdvanceNoticeSatisfied(referenceDate, ceremonyDate) : false;
  results.push({
    rule: "ADVANCE_NOTICE",
    passed: noticeOk,
    severity: noticeOk ? "INFO" : "REVIEW",
    message: noticeOk
      ? `Proposed date satisfies the ${marriagePolicyConfig.notice.minAdvanceNoticeDays}-day minimum advance-notice period.`
      : `Proposed date does not satisfy the ${marriagePolicyConfig.notice.minAdvanceNoticeDays}-day minimum advance-notice period.`,
  });

  const conflicts1 = findExistingMarriageConflicts(app.applicant1, "APPLICANT1", existingApplications, app.id);
  const conflicts2 = findExistingMarriageConflicts(app.applicant2, "APPLICANT2", existingApplications, app.id);
  const allConflicts = [
    ...conflicts1.map((candidate) => ({ spouseRole: "APPLICANT1" as const, candidate })),
    ...conflicts2.map((candidate) => ({ spouseRole: "APPLICANT2" as const, candidate })),
  ];
  results.push({
    rule: "EXISTING_MARRIAGE_CONFLICT",
    passed: allConflicts.length === 0,
    severity: allConflicts.length === 0 ? "INFO" : "BLOCKING",
    message:
      allConflicts.length === 0
        ? "Neither applicant appears to be party to another active marriage application or registration."
        : `${allConflicts.length} potential existing-marriage conflict${allConflicts.length === 1 ? "" : "s"} found — must be resolved before approval.`,
  });

  const civilStatusOk =
    (!app.applicant1.civilStatusVerification || app.applicant1.civilStatusVerification.consistent) &&
    (!app.applicant2.civilStatusVerification || app.applicant2.civilStatusVerification.consistent);
  results.push({
    rule: "CIVIL_STATUS_CONSISTENCY",
    passed: civilStatusOk,
    severity: civilStatusOk ? "INFO" : "BLOCKING",
    message: civilStatusOk
      ? "Declared civil status is consistent with SDID/CRVS records for both applicants."
      : "Declared civil status does not match SDID/CRVS records for at least one applicant.",
  });

  const jurisdictionOk = marriagePolicyConfig.jurisdiction.permittedOfficeTypes.includes(app.officeType);
  results.push({
    rule: "JURISDICTION",
    passed: jurisdictionOk,
    severity: jurisdictionOk ? "INFO" : "BLOCKING",
    message: jurisdictionOk ? "Processing office type is permitted for marriage declarations." : "Processing office type is not permitted for marriage declarations.",
  });

  const docs1 = requiredDocumentsFor(app.applicant1.nationalityCategory, app.applicant1.civilStatus);
  const docs2 = requiredDocumentsFor(app.applicant2.nationalityCategory, app.applicant2.civilStatus);
  const attachedTypes = new Set(app.evidence.filter((e) => !e.removed).map((e) => e.documentType));
  const missing1 = docs1.filter((d) => !attachedTypes.has(d));
  const missing2 = docs2.filter((d) => !attachedTypes.has(d));
  const docsOk = missing1.length === 0 && missing2.length === 0;
  results.push({
    rule: "REQUIRED_DOCUMENTS",
    passed: docsOk,
    severity: docsOk ? "INFO" : "BLOCKING",
    message: docsOk
      ? "All required supporting documents are attached for both applicants' nationality and civil-status category."
      : `Missing required documents — applicant 1: ${missing1.join(", ") || "none"}; applicant 2: ${missing2.join(", ") || "none"}.`,
    affectedSpouse: missing1.length && missing2.length ? "BOTH" : missing1.length ? "APPLICANT1" : missing2.length ? "APPLICANT2" : undefined,
  });

  const witnessRule = witnessRequirementForSpouse();
  const witnesses1 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced).length;
  const witnesses2 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced).length;
  const witnessesOk = witnesses1 >= witnessRule.minimum && witnesses2 >= witnessRule.minimum;
  results.push({
    rule: "WITNESS_REQUIREMENTS",
    passed: witnessesOk,
    severity: witnessesOk ? "INFO" : "REVIEW",
    message: witnessesOk
      ? `Both applicants meet the minimum of ${witnessRule.minimum} witness(es).`
      : `At least one applicant has fewer than the required ${witnessRule.minimum} witness(es) — may be scheduled for final verification before the ceremony.`,
  });

  const identity1Ok = app.applicant1.identityVerification?.matchLevel === "CONFIRMED";
  const identity2Ok = app.applicant2.identityVerification?.matchLevel === "CONFIRMED";
  results.push({
    rule: "IDENTITY_MATCH_CONFIDENCE",
    passed: identity1Ok && identity2Ok,
    severity: identity1Ok && identity2Ok ? "INFO" : "REVIEW",
    message:
      identity1Ok && identity2Ok
        ? "Both applicants' identities were confirmed with high confidence."
        : "At least one applicant's identity match confidence is below the auto-confirm threshold and needs human confirmation.",
  });

  results.push({
    rule: "DUPLICATE_DECLARATION",
    passed: !app.duplicateCheck || app.duplicateCheck.overallLevel === "NONE" || !!app.duplicateCheck.resolution,
    severity: app.duplicateCheck && app.duplicateCheck.overallLevel !== "NONE" && !app.duplicateCheck.resolution ? "BLOCKING" : "INFO",
    message:
      !app.duplicateCheck || app.duplicateCheck.overallLevel === "NONE"
        ? "No near-duplicate declaration detected."
        : app.duplicateCheck.resolution
        ? `Duplicate flag (${app.duplicateCheck.overallLevel}) resolved: ${app.duplicateCheck.resolution.type}.`
        : `Unresolved duplicate flag: ${app.duplicateCheck.overallLevel}.`,
  });

  return { results, conflicts: allConflicts };
}

export const demoRunMarriageEligibilityCheck = (applicationId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");

    const { results, conflicts } = evaluateRules(app, db.crvsMarriageApplications);
    const blocking = results.some((r) => !r.passed && r.severity === "BLOCKING");
    const needsException = results.some((r) => !r.passed && r.severity === "REVIEW");

    app.eligibility = {
      checkedAt: new Date().toISOString(),
      checkedBy: actorName,
      results,
      existingMarriageConflicts: conflicts,
      overallOutcome: blocking ? "INELIGIBLE" : needsException ? "REQUIRES_EXCEPTION" : "ELIGIBLE",
    };
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran eligibility check",
      "crvs.marriage_eligibility",
      app.reference,
      `Outcome: ${app.eligibility.overallOutcome} (${results.filter((r) => !r.passed).length} rule(s) not passed).`
    );
    result = app;
    return db;
  });
  return result!;
};
