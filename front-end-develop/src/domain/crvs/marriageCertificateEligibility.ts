// Centralized marriage-certificate eligibility engine, following birth's
// certificateEligibility.ts pattern (blocking vs review reason arrays)
// rather than death's types-only approach — marriage certificates are a
// first-class part of this milestone (spec §10), not a future placeholder.
import { MarriageApplication, MarriageCertificateEligibilityStatus } from "./types";

export type MarriageCertificateEligibilityInput = {
  registration?: MarriageApplication;
};

export type MarriageCertificateEligibilityVerdict = {
  status: MarriageCertificateEligibilityStatus;
  reasons: string[];
};

/** A registered marriage only becomes certificate-eligible once it is
 * REGISTERED and both spouses' SDID synchronization has resolved — a
 * PARTIAL_FAILURE still keeps the marriage legally registered (spec §8) but
 * routes certificate eligibility to MANUAL_REVIEW until the failed spouse's
 * identity update is retried successfully. */
export function assessMarriageCertificateEligibility(
  input: MarriageCertificateEligibilityInput
): MarriageCertificateEligibilityVerdict {
  const { registration } = input;
  const blocking: string[] = [];
  const review: string[] = [];

  if (!registration) {
    blocking.push("No registered marriage matches this request.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (registration.status !== "REGISTERED") {
    blocking.push("The marriage application is not in a registered state.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (!registration.registrationEvent) {
    blocking.push("No registration event was recorded for this marriage.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (registration.sdid.status === "FAILED") {
    review.push("SDID synchronization failed for both spouses and has not yet succeeded on retry.");
  } else if (registration.sdid.status === "PARTIAL_FAILURE") {
    const failedSpouse = registration.sdid.applicant1.status === "FAILED" ? "applicant 1" : "applicant 2";
    review.push(`SDID synchronization succeeded for one spouse only — ${failedSpouse}'s identity update has not yet succeeded on retry.`);
  } else if (registration.sdid.status === "MANUAL_REVIEW") {
    review.push("SDID identity linkage requires manual review before this marriage can be treated as fully synchronized.");
  } else if (registration.sdid.status !== "BOTH_IDENTITIES_UPDATED") {
    review.push("SDID synchronization has not yet completed for both spouses.");
  }

  const openCorrection = registration.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) {
    review.push("The underlying marriage record has a pending correction request.");
  }

  if (registration.objection && registration.objection.status === "PENDING") {
    review.push("An objection to this marriage is still pending review.");
  }

  if (blocking.length > 0) {
    return { status: "INELIGIBLE", reasons: blocking };
  }
  if (review.length > 0) {
    return { status: "MANUAL_REVIEW", reasons: review };
  }
  return { status: "ELIGIBLE", reasons: [] };
}
