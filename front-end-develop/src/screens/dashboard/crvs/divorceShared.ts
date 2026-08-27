// Small helpers shared across every divorce-notification / divorce-
// registration screen (src/screens/dashboard/crvs/divorce*/**,
// registeredDivorces/**, foreignDivorces/**), mirroring marriageShared.ts's
// role for the marriage module and deathShared.ts's for death.
import {
  DivorceApplicant,
  DivorceApplicantRelationship,
  DivorceDecisionType,
  DivorceEvidence,
  DivorceRegistration,
  DivorceReviewSectionKey,
  DivorceSubmissionSource,
  ExistingMarriageMatchStatus,
  FormerSpouse,
  ForeignDivorceRecognitionStatus,
} from "@/domain/crvs/types";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";

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

export function applicantDisplayName(applicant: DivorceApplicant): string {
  return [applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(" ") || "Unnamed applicant";
}

export function formerSpouseDisplayName(spouse: FormerSpouse): string {
  return [spouse.firstName, spouse.middleName, spouse.lastName].filter(Boolean).join(" ") || "Unnamed former spouse";
}

/** "Amara Bello & Kwame Toure" — the single label used in every divorce
 * queue's "Former spouses" column and in every sticky case header. */
export function formerSpousesLabel(registration: Pick<DivorceRegistration, "formerSpouse1" | "formerSpouse2">): string {
  return `${formerSpouseDisplayName(registration.formerSpouse1)} & ${formerSpouseDisplayName(registration.formerSpouse2)}`;
}

export function marriageReferenceLabel(registration: Pick<DivorceRegistration, "existingMarriage">): string {
  return registration.existingMarriage.selected?.registrationNumber || "Not matched";
}

export const emptyDivorceApplicant = (relationshipToCase: DivorceApplicantRelationship = "FORMER_SPOUSE_1"): DivorceApplicant => ({
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

export const DIVORCE_APPLICANT_RELATIONSHIP_LABELS: Record<DivorceApplicantRelationship, string> = {
  FORMER_SPOUSE_1: "Former spouse 1",
  FORMER_SPOUSE_2: "Former spouse 2",
  BOTH_FORMER_SPOUSES: "Both former spouses",
  INTERESTED_PERSON: "Interested person",
  STAFF: "Staff (assisted submission)",
};

export const DIVORCE_SOURCE_LABELS: Record<DivorceSubmissionSource, string> = {
  APPLICANT: "Applicant",
  BOTH_FORMER_SPOUSES: "Both former spouses",
  INTERESTED_PERSON: "Interested person",
  COURT_NOTIFICATION: "Court notification",
  STAFF_ASSISTED: "Staff-assisted",
  FOREIGN_DECISION: "Foreign decision",
};

export const DIVORCE_DECISION_TYPE_LABELS: Record<DivorceDecisionType, string> = {
  MUTUAL_CONSENT: "Mutual consent",
  CONTESTED: "Contested",
  DEFAULT_JUDGMENT: "Default judgment",
  OTHER: "Other",
};

export const EXISTING_MARRIAGE_MATCH_LABELS: Record<ExistingMarriageMatchStatus, string> = {
  NOT_SEARCHED: "Not searched",
  MATCHED: "Matched",
  MULTIPLE_CANDIDATES: "Multiple candidates",
  NOT_FOUND: "Not found",
};

export const FOREIGN_RECOGNITION_STATUS_LABELS: Record<ForeignDivorceRecognitionStatus, string> = {
  NOT_APPLICABLE: "Not applicable",
  PENDING: "Pending",
  REQUIREMENTS_SATISFIED: "Requirements satisfied",
  REQUIRES_LEGAL_REVIEW: "Requires legal review",
  REJECTED: "Rejected",
};

export const DIVORCE_REVIEW_SECTION_LABELS: Record<DivorceReviewSectionKey, string> = {
  APPLICANT: "Applicant",
  EXISTING_MARRIAGE: "Existing marriage",
  FORMER_SPOUSE_1: "Former spouse 1",
  FORMER_SPOUSE_2: "Former spouse 2",
  COURT_DECISION: "Court decision",
  EVIDENCE: "Evidence",
  IDENTITY_CHECKS: "Identity checks",
  PROCESSING_OFFICE: "Processing office",
  OFFICER_DECLARATION: "Officer declaration",
};

export const DIVORCE_REVIEW_SECTION_ORDER = Object.keys(DIVORCE_REVIEW_SECTION_LABELS) as DivorceReviewSectionKey[];

export const IDENTITY_MATCH_CONFIDENCE_LABELS: Record<FormerSpouse["identityMatchConfidence"], string> = {
  NO_MATCH: "No match",
  LOW_CONFIDENCE: "Low confidence",
  PROBABLE: "Probable",
  CONFIRMED: "Confirmed",
};

export const JUDGMENT_VERIFICATION_RULE_LABELS: Record<string, string> = {
  COURT_REFERENCE: "Court reference",
  JUDGMENT_AUTHENTICITY_PLACEHOLDER: "Judgment authenticity (demo placeholder)",
  JUDGMENT_FINALITY: "Judgment finality",
  MARRIAGE_MATCH: "Marriage match",
  FORMER_SPOUSE_1_IDENTITY: "Former spouse 1 identity",
  FORMER_SPOUSE_2_IDENTITY: "Former spouse 2 identity",
  EXISTING_CIVIL_STATUS: "Existing civil status",
  DUPLICATE_DIVORCE: "Duplicate divorce",
  COURT_REFERENCE_DUPLICATE: "Court reference duplicate",
  JUDGMENT_NUMBER_DUPLICATE: "Judgment number duplicate",
  CONFLICTING_ACTIVE_MARRIAGE: "Conflicting active marriage",
  POSSIBLE_ANNULMENT: "Possible annulment",
  POSSIBLE_JUDICIAL_SEPARATION: "Possible judicial separation",
  FOREIGN_JUDGMENT_REVIEW_REQUIRED: "Foreign judgment review required",
  JURISDICTION: "Jurisdiction",
  MAKER_CHECKER: "Maker-checker",
  CONFLICT_OF_INTEREST: "Conflict of interest",
};

export const CERTIFICATE_ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_CHECKED: "Not checked",
  ELIGIBLE: "Eligible",
  INELIGIBLE: "Ineligible",
  MANUAL_REVIEW: "Manual review",
};

export function activeEvidence(evidence: DivorceEvidence[]): DivorceEvidence[] {
  return evidence.filter((e) => !e.removed);
}

/** Whether this case still has an unresolved correction request — used by
 * the corrections queue and by every "blocked" explanation in review. */
export function hasOpenCorrection(registration: Pick<DivorceRegistration, "correctionRequests">): boolean {
  return registration.correctionRequests.some((c) => !c.resolvedAt);
}

export function latestOpenCorrection(registration: Pick<DivorceRegistration, "correctionRequests">) {
  const open = registration.correctionRequests.filter((c) => !c.resolvedAt);
  return open[open.length - 1] || registration.correctionRequests[registration.correctionRequests.length - 1];
}

export function daysSince(isoDate?: string): number | undefined {
  if (!isoDate) return undefined;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return undefined;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

export type DivorceSlaState = { label: string; tone: "neutral" | "info" | "warning" | "danger"; breached: boolean };

/**
 * SLA display for a divorce case. Every threshold is read from
 * divorcePolicyConfig.sla — never hardcoded here (spec §6). Cases in a
 * specialised branch (judgment verification / foreign review / correction)
 * are measured against that branch's own configured allowance.
 */
export function divorceSlaState(registration: Pick<DivorceRegistration, "status" | "submittedAt" | "correctionRequests" | "updatedAt">): DivorceSlaState {
  const sla = divorcePolicyConfig.sla;
  let allowanceDays = sla.reviewDays;
  let since = registration.submittedAt;

  if (registration.status === "JUDGMENT_VERIFICATION") {
    allowanceDays = sla.judgmentVerificationDays;
    since = registration.updatedAt;
  } else if (registration.status === "FOREIGN_JUDGMENT_REVIEW") {
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
export function divorceNotificationSlaState(notifiedAt?: string): DivorceSlaState {
  const elapsedDays = daysSince(notifiedAt);
  if (elapsedDays === undefined) return { label: "—", tone: "neutral", breached: false };
  const allowanceDays = divorcePolicyConfig.sla.validationHours / 24;
  const remaining = Math.floor(allowanceDays - elapsedDays);
  if (remaining < 0) return { label: `${Math.abs(remaining)}d overdue`, tone: "danger", breached: true };
  if (remaining <= 1) return { label: "Due now", tone: "warning", breached: false };
  return { label: `${remaining}d left`, tone: "info", breached: false };
}
