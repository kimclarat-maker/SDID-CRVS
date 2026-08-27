// Centralized policy config for the divorce-notification / divorce-
// registration workflow — sibling to marriagePolicyConfig.ts, same rule:
// every user-facing number, deadline, requirement or eligibility rule must
// read from here, never be hardcoded in a component (spec §6). This module
// only ever registers a divorce a court has already granted — nothing here
// configures grounds, custody, maintenance or property division, because
// this application never touches those (spec §1). Values below are
// demo-plausible defaults, not a legally authoritative rules engine.
import { DivorceExceptionType } from "./types";

export const divorcePolicyConfig = {
  acceptedSources: {
    COURT_NOTIFICATION: true,
    APPLICANT: true,
    BOTH_FORMER_SPOUSES: true,
    INTERESTED_PERSON: true,
    STAFF_ASSISTED: true,
    FOREIGN_DECISION: true,
  } as const,

  requiredJudgmentFields: [
    "country",
    "courtOrAuthorityName",
    "courtCaseNumber",
    "judgmentNumber",
    "judgmentDate",
    "finalityDate",
    "decisionType",
  ] as const,

  finality: {
    // The decision must be reported as final before a registration can be
    // approved — a not-yet-final judgment always routes to exception review
    // rather than being silently accepted (spec §17 checklist "judgment is
    // final").
    requireFinalityDateBeforeApproval: true,
    // finalityDate can never precede judgmentDate (spec §29).
    finalityCannotPrecedeJudgment: true,
    // Days after which a judgment is treated as final even without an
    // explicit finality date on record, for demo eligibility display only —
    // never used to silently bypass the checklist requirement above.
    presumedFinalAfterDays: 30,
  },

  jurisdiction: {
    rule: "OFFICE_WHERE_MARRIAGE_REGISTERED_OR_APPLICANT_DOMICILE" as const,
    permittedOfficeTypes: ["DISTRICT_SECTOR_OFFICE", "EMBASSY_CONSULATE"] as const,
    alternativeOfficeRequiresReason: true,
  },

  // Who may submit a registration request, and whether they must declare an
  // authorization basis (spec §2, §5B).
  permittedDeclarants: {
    FORMER_SPOUSE_1: { requiresAuthorizationBasis: false },
    FORMER_SPOUSE_2: { requiresAuthorizationBasis: false },
    BOTH_FORMER_SPOUSES: { requiresAuthorizationBasis: false },
    INTERESTED_PERSON: { requiresAuthorizationBasis: true },
    STAFF: { requiresAuthorizationBasis: true },
  } as const,

  requiredDocuments: {
    STANDARD: ["FINAL_COURT_JUDGMENT", "MARRIAGE_CERTIFICATE_OR_RECORD", "APPLICANT_IDENTITY", "PROOF_JUDGMENT_FINAL"],
    APPLICANT_NOT_A_SPOUSE: ["AUTHORIZATION_DOCUMENT"],
    FOREIGN: ["CERTIFIED_TRANSLATION", "AUTHENTICATION_LEGALIZATION", "EXEQUATUR_OR_RECOGNITION_JUDGMENT"],
  },

  foreignJudgment: {
    translationRequiredByDefault: true,
    authenticationRequiredByDefault: true,
    exequaturOrRecognitionRequiredByDefault: true,
    alwaysRequiresSupervisorLegalReview: true,
  },

  supervisorReviewTriggers: {
    foreignJudgment: true,
    judgmentNotYetFinal: true,
    marriageRecordNotFound: true,
    identityMismatch: true,
    duplicateDivorceSuspected: true,
    conflictingActiveMarriage: true,
    lateRegistration: true,
  },

  duplicateDetection: {
    // Score thresholds mirroring marriage/death's NONE/POTENTIAL/PROBABLE/
    // EXACT match-level scale — see divorceDuplicateDetection.ts.
    potentialThreshold: 0.4,
    probableThreshold: 0.7,
    exactThreshold: 0.95,
  },

  lateRegistration: {
    // Days after the decision became final beyond which the case is flagged
    // as a late registration (spec §5/§20/§28) and routed for supervisor
    // review rather than silently accepted.
    thresholdDays: 90,
    requiresSupervisorReview: true,
  },

  fees: {
    required: false,
    currency: "RWF",
    standardFeeAmount: 0,
    lateRegistrationFeeAmount: 3000,
  },

  certificateEligibility: {
    // A divorce becomes eligible for record/certificate services only once
    // REGISTERED and every open correction/exception is resolved — mirrors
    // marriageCertificateEligibility.ts's rule set exactly, scoped to
    // divorce (spec §22).
    requiresRegistered: true,
    blocksOnOpenCorrection: true,
    blocksOnOpenException: true,
    blocksOnSyncManualReview: true,
  },

  sdidSync: {
    // Marital status value written to each former spouse's identity on a
    // successful sync (spec §23).
    maritalStatusOnSuccess: "DIVORCED" as const,
    // Simulated success rate per spouse — see crvsDivorceSdidSync.ts.
    successRatePerSpouse: 0.82,
  },

  notificationTemplates: {
    APPLICATION_SUBMITTED: "Your divorce registration request {{reference}} has been received.",
    COURT_NOTIFICATION_RECEIVED: "A court notification {{reference}} has been received and is pending validation.",
    CASE_ASSIGNED: "Case {{reference}} has been assigned to {{officerName}}.",
    CORRECTION_REQUESTED: "Additional information is required on {{reference}}. Please respond by {{deadline}}.",
    ADDITIONAL_EVIDENCE_REQUESTED: "Additional evidence is required on {{reference}}.",
    CASE_RESUBMITTED: "{{reference}} has been resubmitted after correction.",
    JUDGMENT_VERIFICATION_COMPLETED: "Judgment verification for {{reference}} is complete.",
    APPLICATION_APPROVED: "Your divorce registration request {{reference}} has been approved.",
    APPLICATION_REJECTED: "Your divorce registration request {{reference}} has been rejected.",
    DIVORCE_REGISTERED: "Divorce {{registrationNumber}} has been registered.",
    SDID_SYNC_SUCCEEDED: "Identity records for {{reference}} have been updated.",
    SDID_SYNC_PARTIAL_FAILURE: "One identity update for {{reference}} could not be completed automatically.",
    CERTIFICATE_ELIGIBLE: "A divorce certificate can now be requested for {{registrationNumber}}.",
  },

  sla: {
    validationHours: 48,
    reviewDays: 10,
    judgmentVerificationDays: 5,
    foreignReviewDays: 15,
    correctionResponseDays: 14,
  },
};

export type DivorcePolicyConfig = typeof divorcePolicyConfig;

export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/** finalityDate must exist and must not precede judgmentDate (spec §29). */
export function isJudgmentFinalityValid(judgmentDate: string, finalityDate?: string): boolean {
  if (!finalityDate) return false;
  return daysBetween(judgmentDate, finalityDate) >= 0;
}

export function isLateDivorceRegistration(finalityDate: string, submittedAt: string): boolean {
  return daysBetween(finalityDate, submittedAt) > divorcePolicyConfig.lateRegistration.thresholdDays;
}

export function requiredDocumentsFor(input: { applicantIsSpouse: boolean; isForeign: boolean }): string[] {
  const docs = [...divorcePolicyConfig.requiredDocuments.STANDARD];
  if (!input.applicantIsSpouse) docs.push(...divorcePolicyConfig.requiredDocuments.APPLICANT_NOT_A_SPOUSE);
  if (input.isForeign) docs.push(...divorcePolicyConfig.requiredDocuments.FOREIGN);
  return docs;
}

export function feeFor(isLate: boolean): number {
  if (!divorcePolicyConfig.fees.required) return 0;
  return isLate ? divorcePolicyConfig.fees.lateRegistrationFeeAmount : divorcePolicyConfig.fees.standardFeeAmount;
}

export function requiresAuthorizationBasis(relationship: keyof typeof divorcePolicyConfig.permittedDeclarants): boolean {
  return divorcePolicyConfig.permittedDeclarants[relationship].requiresAuthorizationBasis;
}

export const DIVORCE_EXCEPTION_TRIGGER_LABELS: Record<DivorceExceptionType, string> = {
  MARRIAGE_RECORD_NOT_FOUND: "Marriage record not found",
  IDENTITY_NOT_FOUND_ONE: "One identity not found",
  IDENTITY_NOT_FOUND_BOTH: "Both identities not found",
  MARRIAGE_IDENTITY_MISMATCH: "Marriage identity mismatch",
  DUPLICATE_DIVORCE: "Duplicate divorce registration",
  JUDGMENT_NUMBER_DUPLICATE: "Judgment number duplicate",
  JUDGMENT_NOT_FINAL: "Judgment not final",
  COURT_DETAILS_CANNOT_BE_VERIFIED: "Court details cannot be verified",
  CONFLICTING_MARITAL_STATUS: "Conflicting marital status",
  EXISTING_ANNULMENT: "Existing annulment",
  EXISTING_JUDICIAL_SEPARATION: "Existing judicial separation",
  FOREIGN_DOCUMENT_ISSUE: "Foreign-document issue",
  WRONG_PROCESSING_OFFICE: "Wrong processing office",
  LATE_REGISTRATION: "Late registration",
  APPLICANT_AUTHORITY_UNCLEAR: "Applicant authority unclear",
  SDID_RELATIONSHIP_MISSING: "SDID relationship missing",
  OTHER: "Other",
};
