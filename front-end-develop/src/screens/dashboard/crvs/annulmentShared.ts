// Small helpers shared across every marriage-annulment-notification /
// marriage-annulment-registration screen (src/screens/dashboard/crvs/annulment*/**,
// registeredAnnulments/**, foreignAnnulments/**), mirroring divorceShared.ts's
// role for the divorce module.
import {
  AffectedParty,
  AnnulmentApplicant,
  AnnulmentApplicantRelationship,
  AnnulmentCertificateEligibilityStatus,
  AnnulmentDecisionType,
  AnnulmentEvidence,
  AnnulmentExistingMarriageMatchStatus,
  AnnulmentLegalEffectClassification,
  AnnulmentRecordEligibilityStatus,
  AnnulmentRegistration,
  AnnulmentReviewSectionKey,
  AnnulmentSubmissionSource,
  ForeignAnnulmentRecognitionStatus,
} from "@/domain/crvs/types";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";

export function maskDocumentNumber(value?: string): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${"*".repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function applicantDisplayName(applicant: AnnulmentApplicant): string {
  return [applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(" ") || "Unnamed applicant";
}

export function affectedPartyDisplayName(party: AffectedParty): string {
  return [party.firstName, party.middleName, party.lastName].filter(Boolean).join(" ") || "Unnamed party";
}

/** "Amara Bello & Kwame Toure" — the single label used in every annulment
 * queue's "Affected persons" column and in every sticky case header. */
export function affectedPartiesLabel(registration: Pick<AnnulmentRegistration, "affectedParty1" | "affectedParty2">): string {
  return `${affectedPartyDisplayName(registration.affectedParty1)} & ${affectedPartyDisplayName(registration.affectedParty2)}`;
}

export function marriageReferenceLabel(registration: Pick<AnnulmentRegistration, "existingMarriage">): string {
  return registration.existingMarriage.selected?.registrationNumber || "Not matched";
}

export const emptyAnnulmentApplicant = (relationshipToCase: AnnulmentApplicantRelationship = "AFFECTED_PARTY_1"): AnnulmentApplicant => ({
  documentType: "NONE",
  relationshipToCase,
  identityVerification: "NOT_VERIFIED",
});

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  REFUGEE_ID: "Refugee ID",
  DRIVER_LICENSE: "Driver's license",
  OTHER: "Other",
  NONE: "None provided",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  UNVERIFIED_PROVIDED: "Provided, unverified",
  MANUAL_REVIEW_REQUIRED: "Manual review required",
};

export const ANNULMENT_APPLICANT_RELATIONSHIP_LABELS: Record<AnnulmentApplicantRelationship, string> = {
  AFFECTED_PARTY_1: "Affected party 1",
  AFFECTED_PARTY_2: "Affected party 2",
  BOTH_AFFECTED_PARTIES: "Both affected parties",
  INTERESTED_PERSON: "Interested person",
  STAFF: "Staff (assisted submission)",
};

export const ANNULMENT_SOURCE_LABELS: Record<AnnulmentSubmissionSource, string> = {
  APPLICANT: "Applicant",
  BOTH_AFFECTED_PARTIES: "Both affected parties",
  INTERESTED_PERSON: "Interested person",
  COURT_NOTIFICATION: "Court notification",
  STAFF_ASSISTED: "Staff-assisted",
  FOREIGN_DECISION: "Foreign decision",
};

export const ANNULMENT_DECISION_TYPE_LABELS: Record<AnnulmentDecisionType, string> = {
  COURT_ORDER: "Court order",
  TRIBUNAL_DECISION: "Tribunal decision",
  RELIGIOUS_AUTHORITY_DECISION: "Religious authority decision",
  ADMINISTRATIVE_DECISION: "Administrative decision",
  OTHER: "Other",
};

export const EXISTING_MARRIAGE_MATCH_LABELS: Record<AnnulmentExistingMarriageMatchStatus, string> = {
  NOT_SEARCHED: "Not searched",
  MATCHED: "Matched",
  MULTIPLE_CANDIDATES: "Multiple candidates",
  NOT_FOUND: "Not found",
};

export const FOREIGN_RECOGNITION_STATUS_LABELS: Record<ForeignAnnulmentRecognitionStatus, string> = {
  NOT_APPLICABLE: "Not applicable",
  PENDING: "Pending",
  REQUIREMENTS_SATISFIED: "Requirements satisfied",
  REQUIRES_LEGAL_REVIEW: "Requires legal review",
  REJECTED: "Rejected",
};

export const ANNULMENT_REVIEW_SECTION_LABELS: Record<AnnulmentReviewSectionKey, string> = {
  APPLICANT: "Applicant",
  EXISTING_MARRIAGE: "Existing marriage",
  AFFECTED_PARTY_1: "Affected party 1",
  AFFECTED_PARTY_2: "Affected party 2",
  DECISION: "Decision",
  EVIDENCE: "Evidence",
  IDENTITY_CHECKS: "Identity checks",
  LEGAL_EFFECT: "Legal effect",
  PROCESSING_OFFICE: "Processing office",
  OFFICER_DECLARATION: "Officer declaration",
};

export const ANNULMENT_REVIEW_SECTION_ORDER = Object.keys(ANNULMENT_REVIEW_SECTION_LABELS) as AnnulmentReviewSectionKey[];

export const IDENTITY_MATCH_CONFIDENCE_LABELS: Record<AffectedParty["identityMatchConfidence"], string> = {
  NO_MATCH: "No match",
  LOW_CONFIDENCE: "Low confidence",
  PROBABLE: "Probable",
  CONFIRMED: "Confirmed",
};

export const DECISION_VERIFICATION_RULE_LABELS: Record<string, string> = {
  COURT_REFERENCE: "Court reference",
  DECISION_AUTHENTICITY_PLACEHOLDER: "Decision authenticity (demo placeholder)",
  DECISION_FINALITY: "Decision finality",
  MARRIAGE_MATCH: "Marriage match",
  PARTY_1_IDENTITY: "First affected party identity",
  PARTY_2_IDENTITY: "Second affected party identity",
  EXISTING_CIVIL_STATUS: "Existing civil status",
  DUPLICATE_ANNULMENT: "Duplicate annulment",
  COURT_REFERENCE_DUPLICATE: "Court reference duplicate",
  DECISION_NUMBER_DUPLICATE: "Decision number duplicate",
  EXISTING_DIVORCE_CONFLICT: "Existing divorce conflict",
  EXISTING_JUDICIAL_SEPARATION_CONFLICT: "Existing judicial-separation conflict",
  MARRIAGE_CORRECTION_IN_PROGRESS: "Marriage correction in progress",
  FOREIGN_DECISION_REVIEW_REQUIRED: "Foreign decision review required",
  JURISDICTION: "Jurisdiction",
  APPLICANT_AUTHORITY: "Applicant authority",
  MAKER_CHECKER: "Maker-checker",
  CONFLICT_OF_INTEREST: "Conflict of interest",
};

export const LEGAL_EFFECT_CLASSIFICATION_LABELS: Record<AnnulmentLegalEffectClassification, string> = Object.fromEntries(
  Object.entries(annulmentPolicyConfig.legalEffectClassifications).map(([key, value]) => [key, value.label])
) as Record<AnnulmentLegalEffectClassification, string>;

export const RECORD_ELIGIBILITY_LABELS: Record<AnnulmentRecordEligibilityStatus, string> = {
  NOT_CHECKED: "Not checked",
  ELIGIBLE: "Eligible",
  INELIGIBLE: "Ineligible",
  MANUAL_REVIEW: "Manual review",
};

export const CERTIFICATE_ELIGIBILITY_LABELS: Record<AnnulmentCertificateEligibilityStatus, string> = {
  NOT_CHECKED: "Not checked",
  ELIGIBLE: "Eligible",
  INELIGIBLE: "Ineligible",
  MANUAL_REVIEW: "Manual review",
  NOT_ISSUED_BY_POLICY: "Not issued (by policy)",
};

export function activeEvidence(evidence: AnnulmentEvidence[]): AnnulmentEvidence[] {
  return evidence.filter((e) => !e.removed);
}

/** Whether this case still has an unresolved correction/evidence request —
 * used by the corrections queue and by every "blocked" explanation in review. */
export function hasOpenCorrection(registration: Pick<AnnulmentRegistration, "correctionRequests">): boolean {
  return registration.correctionRequests.some((c) => !c.resolvedAt);
}

export function latestOpenCorrection(registration: Pick<AnnulmentRegistration, "correctionRequests">) {
  const open = registration.correctionRequests.filter((c) => !c.resolvedAt);
  return open[open.length - 1] || registration.correctionRequests[registration.correctionRequests.length - 1];
}

export function daysSince(isoDate?: string): number | undefined {
  if (!isoDate) return undefined;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return undefined;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

export type AnnulmentSlaState = { label: string; tone: "neutral" | "info" | "warning" | "danger"; breached: boolean };

/**
 * SLA display for an annulment case. Every threshold is read from
 * annulmentPolicyConfig.sla — never hardcoded here. Cases in a specialised
 * branch (decision verification / legal-effect review / foreign review /
 * correction) are measured against that branch's own configured allowance.
 */
export function annulmentSlaState(
  registration: Pick<AnnulmentRegistration, "status" | "submittedAt" | "correctionRequests" | "updatedAt">
): AnnulmentSlaState {
  const sla = annulmentPolicyConfig.sla;
  let allowanceDays = sla.reviewDays;
  let since = registration.submittedAt;

  if (registration.status === "DECISION_VERIFICATION") {
    allowanceDays = sla.decisionVerificationDays;
    since = registration.updatedAt;
  } else if (registration.status === "LEGAL_EFFECT_REVIEW") {
    allowanceDays = sla.legalEffectReviewDays;
    since = registration.updatedAt;
  } else if (registration.status === "FOREIGN_DECISION_REVIEW") {
    allowanceDays = sla.foreignReviewDays;
    since = registration.updatedAt;
  } else if (registration.status === "CORRECTION_REQUIRED") {
    allowanceDays = sla.correctionResponseDays;
    since = latestOpenCorrection(registration)?.requestedAt || registration.updatedAt;
  }

  const elapsed = daysSince(since);
  if (elapsed === undefined) return { label: "Not started", tone: "neutral", breached: false };

  const remaining = allowanceDays - elapsed;
  if (remaining < 0) return { label: `${Math.abs(remaining)}d overdue`, tone: "danger", breached: true };
  if (remaining <= 2) return { label: `${remaining}d left`, tone: "warning", breached: false };
  return { label: `${remaining}d left`, tone: "info", breached: false };
}

/** Notification-side SLA, measured against the configured validation window. */
export function annulmentNotificationSlaState(notifiedAt?: string): AnnulmentSlaState {
  const elapsedDays = daysSince(notifiedAt);
  if (elapsedDays === undefined) return { label: "—", tone: "neutral", breached: false };
  const allowanceDays = annulmentPolicyConfig.sla.validationHours / 24;
  const remaining = Math.floor(allowanceDays - elapsedDays);
  if (remaining < 0) return { label: `${Math.abs(remaining)}d overdue`, tone: "danger", breached: true };
  if (remaining <= 1) return { label: "Due now", tone: "warning", breached: false };
  return { label: `${remaining}d left`, tone: "info", breached: false };
}
