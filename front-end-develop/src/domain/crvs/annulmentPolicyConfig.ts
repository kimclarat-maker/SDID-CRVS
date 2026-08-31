// Centralized policy config for the marriage-annulment-notification /
// marriage-annulment-registration workflow — sibling to divorcePolicyConfig.ts,
// same rule: every user-facing number, deadline, requirement, classification
// or eligibility rule must read from here, never be hardcoded in a component
// or service (spec §7). This module only ever registers an annulment
// decision a competent court or legally recognized authority has already
// made — nothing here starts proceedings, evaluates grounds, or decides
// whether a marriage was void/voidable itself (spec §1). Values below are
// demo-plausible defaults, not a legally authoritative rules engine.
//
// Documented scope boundary (see marriageCivilStatus.ts and
// annulmentDuplicateDetection.ts): this application does not implement
// Judicial Separation or post-registration Marriage Correction as
// workflows. `MarriageApplication.judicialSeparation` /
// `.correctionPending` are demo-only markers that exist solely so the
// EXISTING_JUDICIAL_SEPARATION_CONFLICT and MARRIAGE_CORRECTION_IN_PROGRESS
// exception detectors have something real to find, per the brief's
// instruction not to build those modules yet.
import { AnnulmentExceptionType, AnnulmentLegalEffectClassification, AnnulmentProposedIdentityStatus } from "./types";

export const annulmentPolicyConfig = {
  acceptedSources: {
    COURT_NOTIFICATION: true,
    APPLICANT: true,
    BOTH_AFFECTED_PARTIES: true,
    INTERESTED_PERSON: true,
    STAFF_ASSISTED: true,
    FOREIGN_DECISION: true,
  } as const,

  requiredDecisionFields: [
    "country",
    "courtOrAuthorityName",
    "jurisdiction",
    "courtCaseNumber",
    "decisionNumber",
    "decisionDate",
    "finalityDate",
    "decisionType",
    "describesMarriageAs",
  ] as const,

  finality: {
    // The decision must be reported as final before a registration can be
    // approved — a not-yet-final decision always routes to exception review
    // rather than being silently accepted (spec §18 checklist "decision is
    // final").
    requireFinalityDateBeforeApproval: true,
    // finalityDate can never precede decisionDate (spec §31).
    finalityCannotPrecedeDecision: true,
    // Days after which a decision is treated as final even without an
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
  // authorization basis (spec §2, §6B).
  permittedApplicants: {
    AFFECTED_PARTY_1: { requiresAuthorizationBasis: false },
    AFFECTED_PARTY_2: { requiresAuthorizationBasis: false },
    BOTH_AFFECTED_PARTIES: { requiresAuthorizationBasis: false },
    INTERESTED_PERSON: { requiresAuthorizationBasis: true },
    STAFF: { requiresAuthorizationBasis: true },
  } as const,

  requiredDocuments: {
    STANDARD: [
      "FINAL_ANNULMENT_DECISION",
      "MARRIAGE_CERTIFICATE_OR_RECORD",
      "APPLICANT_IDENTITY",
      "AFFECTED_PARTY_IDENTITY",
      "PROOF_DECISION_FINAL",
    ],
    APPLICANT_NOT_A_PARTY: ["AUTHORIZATION_DOCUMENT"],
    FOREIGN: ["CERTIFIED_TRANSLATION", "AUTHENTICATION_LEGALIZATION", "EXEQUATUR_OR_RECOGNITION_DECISION"],
  },

  foreignDecision: {
    translationRequiredByDefault: true,
    authenticationRequiredByDefault: true,
    exequaturOrRecognitionRequiredByDefault: true,
    alwaysRequiresSupervisorLegalReview: true,
  },

  // Document categories never shown to the public applicant/tracking view —
  // staff-only, gated by annulment.restricted_documents.view (spec §12/§26).
  restrictedDocuments: {
    categories: ["FINAL_ANNULMENT_DECISION", "COURT_REGISTRY_EXTRACT", "FOREIGN_DECISION_CERTIFIED_COPY"] as const,
  },

  supervisorReviewTriggers: {
    foreignDecision: true,
    decisionNotYetFinal: true,
    marriageRecordNotFound: true,
    identityMismatch: true,
    duplicateAnnulmentSuspected: true,
    existingDivorceConflict: true,
    existingJudicialSeparationConflict: true,
    legalEffectRequiresManualReview: true,
    lateRegistration: true,
  },

  duplicateDetection: {
    // Score thresholds mirroring divorce/marriage/death's NONE/POTENTIAL/
    // PROBABLE/EXACT match-level scale — see annulmentDuplicateDetection.ts.
    potentialThreshold: 0.4,
    probableThreshold: 0.7,
    exactThreshold: 0.95,
  },

  lateRegistration: {
    // Days after the decision became final beyond which the case is flagged
    // as a late registration (spec §7/§21/§30) and routed for supervisor
    // review rather than silently accepted.
    thresholdDays: 90,
    requiresSupervisorReview: true,
  },

  // Spec §2/§17 — the six configured legal-effect classifications the
  // application may never determine itself. `requiresSupervisorReview`
  // marks classifications where the consequence is most consequential
  // (voiding a marriage from inception) or genuinely uncertain.
  legalEffectClassifications: {
    VOID_FROM_INCEPTION: { label: "Void from inception", requiresSupervisorReview: true },
    VOIDABLE_AND_ANNULLED: { label: "Voidable and annulled", requiresSupervisorReview: true },
    ANNULLED_FROM_DECISION_DATE: { label: "Annulled from decision date", requiresSupervisorReview: false },
    ANNULLED_FROM_EFFECTIVE_DATE: { label: "Annulled from effective date", requiresSupervisorReview: false },
    EFFECT_REQUIRES_MANUAL_REVIEW: { label: "Effect requires manual review", requiresSupervisorReview: true },
    OTHER_AUTHORIZED_EFFECT: { label: "Other authorized effect", requiresSupervisorReview: true },
  } as const satisfies Record<AnnulmentLegalEffectClassification, { label: string; requiresSupervisorReview: boolean }>,

  certificateEligibility: {
    // A registered annulment becomes eligible for record/certificate
    // services only once REGISTERED and every open correction/exception is
    // resolved — mirrors divorceCertificateEligibility.ts's rule set
    // exactly, scoped to annulment (spec §23/§25). certificatesIssued lets a
    // jurisdiction configuration disable annulment *certificates* entirely
    // while still allowing the (always-available) annulment *record*.
    certificatesIssued: true,
    requiresRegistered: true,
    blocksOnOpenCorrection: true,
    blocksOnOpenException: true,
    blocksOnSyncManualReview: true,
    // Applied to the existing marriage's own certificate status once the
    // annulment is REGISTERED (spec §25) — never auto-revokes unless this
    // flag explicitly authorizes it.
    existingMarriageCertificate: {
      restrictOnRegistration: true,
      autoRevoke: false,
    },
  },

  // Spec §24 — "do not automatically assume the resulting civil status is
  // SINGLE." The mapping below is the ONLY place that decision is made, and
  // it is explicitly configuration, read by crvsAnnulmentSdidSync.ts, never
  // inferred in code. Uncertain/other-authorized classifications route to
  // MANUAL_REVIEW rather than guessing.
  sdidSync: {
    civilStatusMapping: {
      VOID_FROM_INCEPTION: { proposedCivilStatus: "SINGLE", rationale: "Decision states the marriage was void from inception." },
      VOIDABLE_AND_ANNULLED: { proposedCivilStatus: "SINGLE", rationale: "Marriage was voidable and has now been annulled." },
      ANNULLED_FROM_DECISION_DATE: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
      ANNULLED_FROM_EFFECTIVE_DATE: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the date stated in the decision." },
      EFFECT_REQUIRES_MANUAL_REVIEW: {
        proposedCivilStatus: "MANUAL_REVIEW",
        rationale: "The decision's legal effect requires manual review before an identity update is applied.",
      },
      OTHER_AUTHORIZED_EFFECT: {
        proposedCivilStatus: "MANUAL_REVIEW",
        rationale: "The decision's effect does not match a standard classification and requires manual review.",
      },
    } as const satisfies Record<AnnulmentLegalEffectClassification, { proposedCivilStatus: AnnulmentProposedIdentityStatus; rationale: string }>,
    // Simulated success rate per party — see crvsAnnulmentSdidSync.ts.
    successRatePerParty: 0.82,
  },

  notificationTemplates: {
    APPLICATION_SUBMITTED: "Your marriage-annulment registration request {{reference}} has been received.",
    COURT_NOTIFICATION_RECEIVED: "A court notification {{reference}} has been received and is pending validation.",
    CASE_ASSIGNED: "Case {{reference}} has been assigned to {{officerName}}.",
    CORRECTION_REQUESTED: "Additional information is required on {{reference}}. Please respond by {{deadline}}.",
    ADDITIONAL_EVIDENCE_REQUESTED: "Additional evidence is required on {{reference}}.",
    CASE_RESUBMITTED: "{{reference}} has been resubmitted after correction.",
    DECISION_VERIFICATION_COMPLETED: "Decision verification for {{reference}} is complete.",
    LEGAL_EFFECT_REVIEW_REQUIRED: "{{reference}} requires legal-effect classification review.",
    APPLICATION_APPROVED: "Your marriage-annulment registration request {{reference}} has been approved.",
    APPLICATION_REJECTED: "Your marriage-annulment registration request {{reference}} has been rejected.",
    ANNULMENT_REGISTERED: "Marriage annulment {{registrationNumber}} has been registered.",
    SDID_SYNC_SUCCEEDED: "Identity records for {{reference}} have been updated.",
    SDID_SYNC_PARTIAL_FAILURE: "One identity update for {{reference}} could not be completed automatically.",
    RECORD_ELIGIBLE: "An annulment record can now be requested for {{registrationNumber}}.",
    CERTIFICATE_ELIGIBLE: "An annulment certificate can now be requested for {{registrationNumber}}.",
  },

  sla: {
    validationHours: 48,
    reviewDays: 10,
    decisionVerificationDays: 5,
    legalEffectReviewDays: 5,
    foreignReviewDays: 15,
    correctionResponseDays: 14,
  },
};

export type AnnulmentPolicyConfig = typeof annulmentPolicyConfig;

export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/** finalityDate must exist and must not precede decisionDate (spec §31). */
export function isDecisionFinalityValid(decisionDate: string, finalityDate?: string): boolean {
  if (!finalityDate) return false;
  return daysBetween(decisionDate, finalityDate) >= 0;
}

export function isLateAnnulmentRegistration(finalityDate: string, submittedAt: string): boolean {
  return daysBetween(finalityDate, submittedAt) > annulmentPolicyConfig.lateRegistration.thresholdDays;
}

export function requiredDocumentsFor(input: { applicantIsParty: boolean; isForeign: boolean }): string[] {
  const docs = [...annulmentPolicyConfig.requiredDocuments.STANDARD];
  if (!input.applicantIsParty) docs.push(...annulmentPolicyConfig.requiredDocuments.APPLICANT_NOT_A_PARTY);
  if (input.isForeign) docs.push(...annulmentPolicyConfig.requiredDocuments.FOREIGN);
  return docs;
}

export function requiresAuthorizationBasis(relationship: keyof typeof annulmentPolicyConfig.permittedApplicants): boolean {
  return annulmentPolicyConfig.permittedApplicants[relationship].requiresAuthorizationBasis;
}

export function isRestrictedAnnulmentDocumentCategory(category: string): boolean {
  return (annulmentPolicyConfig.restrictedDocuments.categories as readonly string[]).includes(category);
}

/** A SUGGESTION only, derived from the raw void/voidable fact captured off
 * the decision — never the confirmed classification. Authorized staff
 * (annulment.legal_effect.classify) always make the final call; an
 * UNSPECIFIED reading proposes manual review rather than guessing. */
export function proposedClassificationFromDecision(describesMarriageAs: "VOID" | "VOIDABLE" | "UNSPECIFIED"): AnnulmentLegalEffectClassification {
  if (describesMarriageAs === "VOID") return "VOID_FROM_INCEPTION";
  if (describesMarriageAs === "VOIDABLE") return "VOIDABLE_AND_ANNULLED";
  return "EFFECT_REQUIRES_MANUAL_REVIEW";
}

export function sdidConsequenceFor(classification: AnnulmentLegalEffectClassification) {
  return annulmentPolicyConfig.sdidSync.civilStatusMapping[classification];
}

export function certificateConsequenceFor(
  classification: AnnulmentLegalEffectClassification
): "RESTRICT_EXISTING_CERTIFICATE" | "NO_RESTRICTION" | "MANUAL_REVIEW" {
  if (classification === "EFFECT_REQUIRES_MANUAL_REVIEW" || classification === "OTHER_AUTHORIZED_EFFECT") return "MANUAL_REVIEW";
  return annulmentPolicyConfig.certificateEligibility.existingMarriageCertificate.restrictOnRegistration
    ? "RESTRICT_EXISTING_CERTIFICATE"
    : "NO_RESTRICTION";
}

export const ANNULMENT_EXCEPTION_TRIGGER_LABELS: Record<AnnulmentExceptionType, string> = {
  MARRIAGE_RECORD_NOT_FOUND: "Marriage record not found",
  IDENTITY_NOT_FOUND_ONE: "One identity not found",
  IDENTITY_NOT_FOUND_BOTH: "Both identities not found",
  MARRIAGE_PARTY_MISMATCH: "Marriage party mismatch",
  DUPLICATE_ANNULMENT: "Duplicate annulment registration",
  DECISION_NUMBER_DUPLICATE: "Decision number duplicate",
  DECISION_NOT_FINAL: "Decision not final",
  COURT_CANNOT_BE_VERIFIED: "Court cannot be verified",
  EFFECTIVE_DATE_UNCLEAR: "Effective date unclear",
  LEGAL_EFFECT_UNCLEAR: "Legal effect unclear",
  EXISTING_DIVORCE_CONFLICT: "Existing divorce conflict",
  EXISTING_ANNULMENT_CONFLICT: "Existing annulment conflict",
  EXISTING_JUDICIAL_SEPARATION_CONFLICT: "Existing judicial-separation conflict",
  MARRIAGE_CORRECTION_IN_PROGRESS: "Marriage correction in progress",
  CONFLICTING_CIVIL_STATUS: "Conflicting civil status",
  FOREIGN_DOCUMENT_ISSUE: "Foreign-document issue",
  WRONG_PROCESSING_OFFICE: "Wrong processing office",
  LATE_REGISTRATION: "Late registration",
  APPLICANT_AUTHORITY_UNCLEAR: "Applicant authority unclear",
  SDID_RELATIONSHIP_MISSING: "SDID relationship missing",
  CERTIFICATE_STATUS_CONFLICT: "Certificate status conflict",
  OTHER: "Other",
};
