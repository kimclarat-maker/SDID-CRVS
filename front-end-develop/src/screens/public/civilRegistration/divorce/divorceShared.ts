// Small helpers + label maps shared across every PUBLIC divorce-registration
// screen (src/screens/public/civilRegistration/divorce/**), mirroring
// marriageShared.ts's role for the marriage module. Deliberately scoped to
// the public tree so the staff divorce screens can own their own shared
// module without a file collision.
//
// Legal framing note (spec §1): this module registers a divorce a court has
// ALREADY granted. Nothing here — and nothing in any screen that imports it
// — may describe filing a case, hearings, grounds, custody, maintenance or
// property division. Those are court matters, never civil-registration ones.
import {
  DivorceApplicant,
  DivorceApplicantRelationship,
  DivorceDecisionType,
  DivorceSubmissionSource,
  FormerSpouse,
} from "@/domain/crvs/types";
import { divorcePolicyConfig, requiredDocumentsFor } from "@/domain/crvs/divorcePolicyConfig";

export { formatDate, formatDateTime, maskDocumentNumber, DOCUMENT_TYPE_LABELS } from "@/screens/dashboard/crvs/marriageShared";

/** Court notifications are pushed in by a court/staff integration, never
 * chosen by a member of the public — so the public wizard offers every
 * accepted source EXCEPT COURT_NOTIFICATION (spec §5A). */
export type PublicDivorceSubmissionSource = Exclude<DivorceSubmissionSource, "COURT_NOTIFICATION">;

export const PUBLIC_DIVORCE_SOURCES: PublicDivorceSubmissionSource[] = (
  Object.keys(divorcePolicyConfig.acceptedSources) as DivorceSubmissionSource[]
).filter((source): source is PublicDivorceSubmissionSource => source !== "COURT_NOTIFICATION" && divorcePolicyConfig.acceptedSources[source]);

export const DIVORCE_SOURCE_LABELS: Record<PublicDivorceSubmissionSource, string> = {
  APPLICANT: "I am one of the former spouses",
  BOTH_FORMER_SPOUSES: "Both former spouses are submitting together",
  INTERESTED_PERSON: "I am another interested person acting for a former spouse",
  STAFF_ASSISTED: "I am being helped by a registration officer at a service centre",
  FOREIGN_DECISION: "The divorce was granted by a court outside this country",
};

export const DIVORCE_SOURCE_DESCRIPTIONS: Record<PublicDivorceSubmissionSource, string> = {
  APPLICANT: "You were married and the court has already granted your divorce. You will register that decision in your own name.",
  BOTH_FORMER_SPOUSES: "Both former spouses agree to register the granted divorce together. Either of you can complete this form on behalf of both.",
  INTERESTED_PERSON: "You are acting for a former spouse — for example under a power of attorney or a court authorisation. You will be asked to declare that authority.",
  STAFF_ASSISTED: "A registration officer is entering this request with you at a service centre. The officer records the same information you would enter yourself.",
  FOREIGN_DECISION: "The divorce judgment was issued abroad. Extra documents (translation, authentication and a recognition decision) are required before it can be registered here.",
};

export const DIVORCE_RELATIONSHIP_LABELS: Record<DivorceApplicantRelationship, string> = {
  FORMER_SPOUSE_1: "Former spouse 1",
  FORMER_SPOUSE_2: "Former spouse 2",
  BOTH_FORMER_SPOUSES: "Both former spouses",
  INTERESTED_PERSON: "Other interested person",
  STAFF: "Registration officer acting on request",
};

export const DIVORCE_DECISION_TYPE_LABELS: Record<DivorceDecisionType, string> = {
  MUTUAL_CONSENT: "Divorce by mutual consent",
  CONTESTED: "Contested divorce",
  DEFAULT_JUDGMENT: "Default judgment",
  OTHER: "Other decision type",
};

export const DIVORCE_IDENTITY_CONFIDENCE_LABELS: Record<FormerSpouse["identityMatchConfidence"], string> = {
  NO_MATCH: "No identity match yet",
  LOW_CONFIDENCE: "Low-confidence match — needs a registrar to confirm",
  PROBABLE: "Probable match — needs a registrar to confirm",
  CONFIRMED: "Confirmed match",
};

export const DIVORCE_VERIFICATION_LABELS: Record<DivorceApplicant["identityVerification"], string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified against identity records",
  UNVERIFIED_PROVIDED: "Provided, not yet verified",
  MANUAL_REVIEW_REQUIRED: "Needs manual review",
};

export const EXISTING_MARRIAGE_STATUS_LABELS: Record<string, string> = {
  NOT_SEARCHED: "Not searched yet",
  MATCHED: "Marriage record selected",
  MULTIPLE_CANDIDATES: "Several possible marriage records",
  NOT_FOUND: "Marriage record not found in the registry",
};

/** Human labels for the document keys divorcePolicyConfig.requiredDocuments
 * returns. Keys — not prose — remain the single source of truth; this map
 * only makes them readable. */
export const DIVORCE_DOCUMENT_LABELS: Record<string, string> = {
  FINAL_COURT_JUDGMENT: "Final court judgment or divorce decree",
  MARRIAGE_CERTIFICATE_OR_RECORD: "Marriage certificate or marriage record",
  APPLICANT_IDENTITY: "Applicant identity document",
  PROOF_JUDGMENT_FINAL: "Proof that the decision is final (certificate of non-appeal)",
  AUTHORIZATION_DOCUMENT: "Authorisation document (power of attorney or court authorisation)",
  CERTIFIED_TRANSLATION: "Certified translation of the foreign decision",
  AUTHENTICATION_LEGALIZATION: "Authentication or legalisation of the foreign decision",
  EXEQUATUR_OR_RECOGNITION_JUDGMENT: "Exequatur or recognition decision",
};

export const divorceDocumentLabel = (documentType: string): string => DIVORCE_DOCUMENT_LABELS[documentType] || documentType.replace(/_/g, " ").toLowerCase();

/** Court-issued documents carry the private content of a judgment, so they
 * are flagged restricted in the UI (spec §7/§11): visible to the person who
 * uploaded them and to reviewing staff, never on any public page. */
const RESTRICTED_DOCUMENT_TYPES = new Set([
  "FINAL_COURT_JUDGMENT",
  "PROOF_JUDGMENT_FINAL",
  "EXEQUATUR_OR_RECOGNITION_JUDGMENT",
  "AUTHENTICATION_LEGALIZATION",
]);

export const isRestrictedDivorceDocument = (documentType: string): boolean => RESTRICTED_DOCUMENT_TYPES.has(documentType);

export const applicantIsFormerSpouse = (relationship: DivorceApplicantRelationship): boolean =>
  relationship === "FORMER_SPOUSE_1" || relationship === "FORMER_SPOUSE_2" || relationship === "BOTH_FORMER_SPOUSES";

/** Default relationship implied by the chosen submission source — the
 * applicant can still change it on the Applicant step. */
export const relationshipForSource = (source: PublicDivorceSubmissionSource): DivorceApplicantRelationship => {
  switch (source) {
    case "BOTH_FORMER_SPOUSES":
      return "BOTH_FORMER_SPOUSES";
    case "INTERESTED_PERSON":
      return "INTERESTED_PERSON";
    case "STAFF_ASSISTED":
      return "STAFF";
    case "APPLICANT":
    case "FOREIGN_DECISION":
    default:
      return "FORMER_SPOUSE_1";
  }
};

export const requiredDivorceDocuments = (applicant: DivorceApplicant, isForeign: boolean): string[] =>
  requiredDocumentsFor({ applicantIsSpouse: applicantIsFormerSpouse(applicant.relationshipToCase), isForeign });

export const applicantDisplayName = (applicant: DivorceApplicant): string =>
  [applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(" ") || "Not provided yet";

export const formerSpouseDisplayName = (spouse: FormerSpouse): string =>
  [spouse.firstName, spouse.middleName, spouse.lastName].filter(Boolean).join(" ") || "Not provided yet";

/** Two former spouses can never be the same person. Compares the strongest
 * identifier available on each side rather than names, which legitimately
 * overlap (spec §3 Step 5). */
export const formerSpousesConflict = (spouse1: FormerSpouse, spouse2: FormerSpouse): boolean => {
  const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
  return (
    same(spouse1.sdidIdentityId, spouse2.sdidIdentityId) ||
    same(spouse1.nin, spouse2.nin) ||
    same(spouse1.documentNumber, spouse2.documentNumber)
  );
};
