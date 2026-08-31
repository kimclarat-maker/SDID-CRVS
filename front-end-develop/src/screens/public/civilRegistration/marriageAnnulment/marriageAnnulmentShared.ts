// Small helpers + label maps shared across every PUBLIC marriage-annulment
// screen (src/screens/public/civilRegistration/marriageAnnulment/**),
// mirroring divorceShared.ts's role for the divorce module. Deliberately
// scoped to the public tree so the staff annulment screens can own their own
// shared module without a file collision.
//
// Legal framing note (spec §1): this module registers an annulment decision
// a competent court or legally recognized authority has ALREADY made.
// Nothing here — and nothing in any screen that imports it — may describe
// filing a case, hearings, grounds, allegations, testimony or evidence about
// why the marriage should be annulled. Those are court matters, never civil
// -registration ones. It also never lets a public applicant choose or see a
// "legal-effect classification" — only the raw wording captured off the
// decision (see AnnulmentDecision.legalEffectWording / describesMarriageAs).
import {
  AffectedParty,
  AnnulmentApplicant,
  AnnulmentApplicantRelationship,
  AnnulmentDecisionType,
  AnnulmentExistingMarriageMatchStatus,
  AnnulmentSubmissionSource,
  MarriageCivilStatus,
  VerificationState,
} from "@/domain/crvs/types";
import { annulmentPolicyConfig, isRestrictedAnnulmentDocumentCategory, requiredDocumentsFor } from "@/domain/crvs/annulmentPolicyConfig";

export { formatDate, formatDateTime, maskDocumentNumber, DOCUMENT_TYPE_LABELS } from "@/screens/dashboard/crvs/marriageShared";

/** Court/authority notifications are pushed in by a court or staff
 * integration, never chosen by a member of the public — so the public wizard
 * offers every accepted source EXCEPT COURT_NOTIFICATION (spec §5A, mirrors
 * divorce's PublicDivorceSubmissionSource). */
export type PublicAnnulmentSubmissionSource = Exclude<AnnulmentSubmissionSource, "COURT_NOTIFICATION">;

export const PUBLIC_ANNULMENT_SOURCES: PublicAnnulmentSubmissionSource[] = (
  Object.keys(annulmentPolicyConfig.acceptedSources) as AnnulmentSubmissionSource[]
).filter((source): source is PublicAnnulmentSubmissionSource => source !== "COURT_NOTIFICATION" && annulmentPolicyConfig.acceptedSources[source]);

export const ANNULMENT_SOURCE_LABELS: Record<PublicAnnulmentSubmissionSource, string> = {
  APPLICANT: "I am one of the two people whose marriage was annulled",
  BOTH_AFFECTED_PARTIES: "Both people are submitting together",
  INTERESTED_PERSON: "I am another interested person acting for one of the parties",
  STAFF_ASSISTED: "I am being helped by a registration officer at a service centre",
  FOREIGN_DECISION: "The annulment was decided by a court or authority outside this country",
};

export const ANNULMENT_SOURCE_DESCRIPTIONS: Record<PublicAnnulmentSubmissionSource, string> = {
  APPLICANT:
    "A court or other legally recognized authority has already annulled your marriage. You will register that decision in your own name.",
  BOTH_AFFECTED_PARTIES:
    "Both people whose marriage was annulled agree to register the decision together. Either of you can complete this form on behalf of both.",
  INTERESTED_PERSON:
    "You are acting for one of the two people — for example under a power of attorney or a court authorisation. You will be asked to declare that authority.",
  STAFF_ASSISTED:
    "A registration officer is entering this request with you at a service centre. The officer records the same information you would enter yourself.",
  FOREIGN_DECISION:
    "The annulment decision was issued abroad. Extra documents (translation, authentication and a recognition decision) are required before it can be registered here.",
};

export const ANNULMENT_RELATIONSHIP_LABELS: Record<AnnulmentApplicantRelationship, string> = {
  AFFECTED_PARTY_1: "First affected person",
  AFFECTED_PARTY_2: "Second affected person",
  BOTH_AFFECTED_PARTIES: "Both affected persons",
  INTERESTED_PERSON: "Other interested person",
  STAFF: "Registration officer acting on request",
};

export const ANNULMENT_DECISION_TYPE_LABELS: Record<AnnulmentDecisionType, string> = {
  COURT_ORDER: "Court order",
  TRIBUNAL_DECISION: "Tribunal decision",
  RELIGIOUS_AUTHORITY_DECISION: "Religious authority decision",
  ADMINISTRATIVE_DECISION: "Administrative decision",
  OTHER: "Other decision type",
};

/** Spec §11 Step 6 — raw fact taken from the decision document, never a
 * classification the applicant chooses. */
export const ANNULMENT_DESCRIBES_MARRIAGE_LABELS: Record<"VOID" | "VOIDABLE" | "UNSPECIFIED", string> = {
  VOID: "The decision describes the marriage as void",
  VOIDABLE: "The decision describes the marriage as voidable",
  UNSPECIFIED: "The decision does not state this",
};

export const ANNULMENT_IDENTITY_CONFIDENCE_LABELS: Record<AffectedParty["identityMatchConfidence"], string> = {
  NO_MATCH: "No identity match yet",
  LOW_CONFIDENCE: "Low-confidence match — needs a registrar to confirm",
  PROBABLE: "Probable match — needs a registrar to confirm",
  CONFIRMED: "Confirmed match",
};

export const ANNULMENT_VERIFICATION_LABELS: Record<VerificationState, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified against identity records",
  UNVERIFIED_PROVIDED: "Provided, not yet verified",
  MANUAL_REVIEW_REQUIRED: "Needs manual review",
};

export const EXISTING_MARRIAGE_MATCH_STATUS_LABELS: Record<AnnulmentExistingMarriageMatchStatus, string> = {
  NOT_SEARCHED: "Not searched yet",
  MATCHED: "Marriage record selected",
  MULTIPLE_CANDIDATES: "Several possible marriage records",
  NOT_FOUND: "Marriage record not found in the registry",
};

export const EXISTING_MARRIAGE_CIVIL_STATUS_LABELS: Record<MarriageCivilStatus, string> = {
  ACTIVE: "Active",
  DISSOLVED_BY_DIVORCE: "Dissolved by divorce",
  ANNULLED: "Annulled",
  ANNULMENT_PENDING: "Annulment pending",
  JUDICIALLY_SEPARATED: "Judicially separated",
  CORRECTION_PENDING: "Correction pending",
  STATUS_REQUIRES_REVIEW: "Status requires review",
};

/** Human labels for the document keys annulmentPolicyConfig.requiredDocumentsFor
 * returns. Keys — not prose — remain the single source of truth; this map
 * only makes them readable. */
export const ANNULMENT_DOCUMENT_LABELS: Record<string, string> = {
  FINAL_ANNULMENT_DECISION: "Final annulment decision",
  MARRIAGE_CERTIFICATE_OR_RECORD: "Marriage certificate or marriage record",
  APPLICANT_IDENTITY: "Applicant identity document",
  AFFECTED_PARTY_IDENTITY: "Identity document for each affected person",
  PROOF_DECISION_FINAL: "Proof that the decision is final",
  AUTHORIZATION_DOCUMENT: "Authorisation document (power of attorney or court authorisation)",
  CERTIFIED_TRANSLATION: "Certified translation of the foreign decision",
  AUTHENTICATION_LEGALIZATION: "Authentication or legalisation of the foreign decision",
  EXEQUATUR_OR_RECOGNITION_DECISION: "Exequatur or recognition decision",
};

export const annulmentDocumentLabel = (documentType: string): string =>
  ANNULMENT_DOCUMENT_LABELS[documentType] || documentType.replace(/_/g, " ").toLowerCase();

/** Re-exported under a public-tree-friendly name — the underlying rule is
 * owned entirely by annulmentPolicyConfig, never duplicated here (spec §7). */
export const isRestrictedAnnulmentDocument = isRestrictedAnnulmentDocumentCategory;

export const applicantIsParty = (relationship: AnnulmentApplicantRelationship): boolean =>
  relationship === "AFFECTED_PARTY_1" || relationship === "AFFECTED_PARTY_2" || relationship === "BOTH_AFFECTED_PARTIES";

/** Default relationship implied by the chosen submission source — the
 * applicant can still change it on the Applicant step. */
export const relationshipForSource = (source: PublicAnnulmentSubmissionSource): AnnulmentApplicantRelationship => {
  switch (source) {
    case "BOTH_AFFECTED_PARTIES":
      return "BOTH_AFFECTED_PARTIES";
    case "INTERESTED_PERSON":
      return "INTERESTED_PERSON";
    case "STAFF_ASSISTED":
      return "STAFF";
    case "APPLICANT":
    case "FOREIGN_DECISION":
    default:
      return "AFFECTED_PARTY_1";
  }
};

export const requiredAnnulmentDocuments = (applicant: AnnulmentApplicant, isForeign: boolean): string[] =>
  requiredDocumentsFor({ applicantIsParty: applicantIsParty(applicant.relationshipToCase), isForeign });

export const applicantDisplayName = (applicant: AnnulmentApplicant): string =>
  [applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(" ") || "Not provided yet";

export const affectedPartyDisplayName = (party: AffectedParty): string =>
  [party.firstName, party.middleName, party.lastName].filter(Boolean).join(" ") || "Not provided yet";

/** The two affected parties can never be the same person. Compares the
 * strongest identifier available on each side rather than names, which
 * legitimately overlap — mirrors divorce's formerSpousesConflict() (spec §3
 * Step 5 equivalent). */
export const affectedPartiesConflict = (party1: AffectedParty, party2: AffectedParty): boolean => {
  const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
  return same(party1.sdidIdentityId, party2.sdidIdentityId) || same(party1.nin, party2.nin) || same(party1.documentNumber, party2.documentNumber);
};

/** StatusBadge (src/screens/dashboard/crvs/components/StatusBadge.tsx) is a
 * finalized contract file with no "annulmentRegistration" kind, so the
 * public annulment tree renders its own status pill using the same
 * `crvs-status-pill` classes StatusBadge itself uses, rather than modifying
 * that shared component. */
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export const ANNULMENT_STATUS_TONE: Record<string, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warning",
  RESUBMITTED: "info",
  DECISION_VERIFICATION: "info",
  LEGAL_EFFECT_REVIEW: "info",
  FOREIGN_DECISION_REVIEW: "warning",
  EXCEPTION_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REGISTERED: "success",
  CANCELLED: "neutral",
};

export const ANNULMENT_STATUS_ICON: Record<string, string> = {
  DRAFT: "edit_note",
  SUBMITTED: "outgoing_mail",
  UNDER_REVIEW: "search",
  CORRECTION_REQUIRED: "edit",
  RESUBMITTED: "outgoing_mail",
  DECISION_VERIFICATION: "gavel",
  LEGAL_EFFECT_REVIEW: "fact_check",
  FOREIGN_DECISION_REVIEW: "public",
  EXCEPTION_REVIEW: "report",
  APPROVED: "check_circle",
  REJECTED: "cancel",
  REGISTERED: "verified",
  CANCELLED: "block",
};
