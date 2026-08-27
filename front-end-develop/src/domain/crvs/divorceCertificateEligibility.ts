// Centralized divorce-certificate/divorce-record eligibility engine —
// mirrors marriageCertificateEligibility.ts's blocking-vs-review reason
// array pattern exactly, scoped to divorce (spec §10/§22).
import { DivorceRegistration, DivorceCertificateEligibilityStatus } from "./types";

export type DivorceCertificateEligibilityInput = {
  registration?: DivorceRegistration;
};

export type DivorceCertificateEligibilityVerdict = {
  status: DivorceCertificateEligibilityStatus;
  reasons: string[];
};

/** A divorce only becomes certificate-eligible once it is REGISTERED and
 * both former spouses' SDID synchronization has resolved — a
 * PARTIAL_FAILURE still keeps the divorce legally registered (spec §23) but
 * routes certificate eligibility to MANUAL_REVIEW until the failed spouse's
 * identity update succeeds on retry. */
export function assessDivorceCertificateEligibility(input: DivorceCertificateEligibilityInput): DivorceCertificateEligibilityVerdict {
  const { registration } = input;
  const blocking: string[] = [];
  const review: string[] = [];

  if (!registration) {
    blocking.push("No registered divorce matches this request.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (registration.status !== "REGISTERED") {
    blocking.push("The divorce registration is not in a registered state.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (!registration.registrationEvent) {
    blocking.push("No registration event was recorded for this divorce.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (registration.sdid.status === "FAILED") {
    review.push("SDID synchronization failed for both former spouses and has not yet succeeded on retry.");
  } else if (registration.sdid.status === "PARTIAL_FAILURE") {
    const failedSpouse = registration.sdid.spouse1.status === "FAILED" ? "former spouse 1" : "former spouse 2";
    review.push(`SDID synchronization succeeded for one former spouse only — ${failedSpouse}'s identity update has not yet succeeded on retry.`);
  } else if (registration.sdid.status === "MANUAL_REVIEW") {
    review.push("SDID identity linkage requires manual review before this divorce can be treated as fully synchronized.");
  } else if (registration.sdid.status !== "BOTH_IDENTITIES_UPDATED") {
    review.push("SDID synchronization has not yet completed for both former spouses.");
  }

  const openCorrection = registration.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) {
    review.push("This divorce registration has a pending correction request.");
  }

  if (registration.exception && registration.exception.status === "OPEN") {
    review.push("An open exception on this divorce registration has not yet been resolved.");
  }

  if (blocking.length > 0) {
    return { status: "INELIGIBLE", reasons: blocking };
  }
  if (review.length > 0) {
    return { status: "MANUAL_REVIEW", reasons: review };
  }
  return { status: "ELIGIBLE", reasons: [] };
}
