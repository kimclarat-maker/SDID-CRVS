// Centralized annulment-record / annulment-certificate / existing-marriage-
// certificate-consequence eligibility engine — mirrors
// divorceCertificateEligibility.ts's blocking-vs-review reason array pattern,
// scoped to annulment (spec §23/§25). Kept as three separate assessments
// (spec explicitly models AnnulmentRecordEligibility and
// AnnulmentCertificateEligibility as distinct concepts, since some
// jurisdictions issue only a record and not a certificate) rather than one
// collapsed verdict.
import {
  AnnulmentCertificateEligibilityStatus,
  AnnulmentRecordEligibilityStatus,
  AnnulmentRegistration,
  ExistingMarriageCertificateConsequence,
} from "./types";
import { annulmentPolicyConfig, certificateConsequenceFor } from "./annulmentPolicyConfig";

export type AnnulmentEligibilityInput = {
  registration?: AnnulmentRegistration;
};

export type AnnulmentRecordEligibilityVerdict = {
  status: AnnulmentRecordEligibilityStatus;
  reasons: string[];
};

export type AnnulmentCertificateEligibilityVerdict = {
  status: AnnulmentCertificateEligibilityStatus;
  reasons: string[];
};

function blockingAndReviewReasons(registration?: AnnulmentRegistration): { blocking: string[]; review: string[] } {
  const blocking: string[] = [];
  const review: string[] = [];

  if (!registration) {
    blocking.push("No registered annulment matches this request.");
    return { blocking, review };
  }
  if (registration.status !== "REGISTERED") {
    blocking.push("The annulment registration is not in a registered state.");
    return { blocking, review };
  }
  if (!registration.registrationEvent) {
    blocking.push("No registration event was recorded for this annulment.");
    return { blocking, review };
  }

  if (registration.sdid.status === "FAILED") {
    review.push("SDID synchronization failed for both affected parties and has not yet succeeded on retry.");
  } else if (registration.sdid.status === "PARTIAL_FAILURE") {
    const failedParty = registration.sdid.party1.status === "FAILED" ? "the first affected party" : "the second affected party";
    review.push(`SDID synchronization succeeded for one affected party only — ${failedParty}'s identity update has not yet succeeded on retry.`);
  } else if (registration.sdid.status === "MANUAL_REVIEW") {
    review.push("SDID identity linkage requires manual review before this annulment can be treated as fully synchronized.");
  } else if (registration.sdid.status !== "BOTH_IDENTITIES_UPDATED") {
    review.push("SDID synchronization has not yet completed for both affected parties.");
  }

  const openCorrection = registration.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) {
    review.push("This annulment registration has a pending correction or evidence request.");
  }
  if (registration.exception && registration.exception.status === "OPEN") {
    review.push("An open exception on this annulment registration has not yet been resolved.");
  }
  if (!registration.legalEffect.confirmedClassification) {
    review.push("A confirmed legal-effect classification has not been recorded.");
  }

  return { blocking, review };
}

export function assessAnnulmentRecordEligibility(input: AnnulmentEligibilityInput): AnnulmentRecordEligibilityVerdict {
  const { blocking, review } = blockingAndReviewReasons(input.registration);
  if (blocking.length > 0) return { status: "INELIGIBLE", reasons: blocking };
  if (review.length > 0) return { status: "MANUAL_REVIEW", reasons: review };
  return { status: "ELIGIBLE", reasons: [] };
}

export function assessAnnulmentCertificateEligibility(input: AnnulmentEligibilityInput): AnnulmentCertificateEligibilityVerdict {
  if (!annulmentPolicyConfig.certificateEligibility.certificatesIssued) {
    return { status: "NOT_ISSUED_BY_POLICY", reasons: ["This jurisdiction does not issue annulment certificates — only the annulment record is available."] };
  }
  const { blocking, review } = blockingAndReviewReasons(input.registration);
  if (blocking.length > 0) return { status: "INELIGIBLE", reasons: blocking };
  if (review.length > 0) return { status: "MANUAL_REVIEW", reasons: review };
  return { status: "ELIGIBLE", reasons: [] };
}

/** Spec §25 — never deletes or auto-revokes the existing marriage
 * certificate; only records what forward-looking restriction applies, and
 * only once the annulment is actually REGISTERED. */
export function assessExistingMarriageCertificateConsequence(input: AnnulmentEligibilityInput): ExistingMarriageCertificateConsequence | undefined {
  const { registration } = input;
  if (!registration || registration.status !== "REGISTERED" || !registration.legalEffect.confirmedClassification) return undefined;

  const consequence = certificateConsequenceFor(registration.legalEffect.confirmedClassification);
  if (consequence === "MANUAL_REVIEW") {
    return {
      status: "MANUAL_REVIEW",
      reason: "The confirmed legal-effect classification requires manual review before the existing marriage certificate's status can be finalized.",
      appliedAt: new Date().toISOString(),
    };
  }
  if (consequence === "RESTRICT_EXISTING_CERTIFICATE") {
    return {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but is marked restricted and no longer presented as evidence of a current marriage.",
      appliedAt: new Date().toISOString(),
    };
  }
  return { status: "NORMAL", reason: "No restriction applies under the configured policy for this classification.", appliedAt: new Date().toISOString() };
}
