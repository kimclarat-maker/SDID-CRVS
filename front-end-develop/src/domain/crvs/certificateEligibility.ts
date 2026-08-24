// Centralized birth-certificate eligibility engine (spec §19). Framework- and
// service-agnostic — takes plain data in, returns a plain verdict out, so it
// can be unit tested on its own and is never duplicated inside a page
// component. Only decides record/requester/relationship eligibility; payment
// completion is checked separately by the service once eligibility has
// already routed the request to PAYMENT_PENDING (spec §20's step order runs
// eligibility before payment).
import {
  BirthCertificateRequest,
  BirthRegistrationCase,
  CertificateEligibilityStatus,
  DemoBirthCertificate,
  FoundationalIdentity,
} from "./types";

export type CertificateEligibilityInput = {
  request: BirthCertificateRequest;
  registrationCase?: BirthRegistrationCase;
  foundationalIdentity?: FoundationalIdentity;
  existingActiveCertificates: DemoBirthCertificate[];
};

export type CertificateEligibilityVerdict = {
  status: CertificateEligibilityStatus;
  reasons: string[];
};

export function assessCertificateEligibility(
  input: CertificateEligibilityInput
): CertificateEligibilityVerdict {
  const { request, registrationCase, foundationalIdentity, existingActiveCertificates } = input;
  const blocking: string[] = [];
  const review: string[] = [];

  if (!registrationCase) {
    blocking.push("No registered birth record matches this request.");
    return { status: "INELIGIBLE", reasons: blocking };
  }

  if (registrationCase.status !== "REGISTERED") {
    blocking.push("The matched birth record is not in a registered, active state.");
  }

  if (registrationCase.id !== request.subject.birthRecordId) {
    blocking.push("The request is not linked to a matched birth record.");
  }

  if (request.requester.verificationStatus === "MISMATCH") {
    blocking.push("Requester identity could not be verified against the supplied documents.");
  } else if (request.requester.verificationStatus !== "VERIFIED") {
    review.push("Requester identity verification is not yet complete.");
  }

  const relationshipPermitted =
    request.requester.requesterType === "SELF" ||
    Boolean(request.requester.relationshipToSubject);
  if (!relationshipPermitted) {
    review.push("The requester's relationship to the subject has not been confirmed.");
  }
  if (request.requester.verificationStatus === "MANUAL_REVIEW") {
    review.push("Requester identity was flagged for manual review.");
  }

  const openCorrection = registrationCase.correctionRequests.some((c) => !c.resolvedAt);
  if (openCorrection) {
    review.push("The underlying birth record has a pending correction request.");
  }

  if (registrationCase.exception && registrationCase.exception.status === "OPEN") {
    review.push(`The underlying birth record has an open exception: ${registrationCase.exception.type}.`);
  }

  const duplicateLevel = registrationCase.duplicateCheck?.overallLevel;
  const duplicateUnresolved =
    duplicateLevel &&
    duplicateLevel !== "NONE" &&
    !registrationCase.duplicateCheck?.resolution;
  if (duplicateUnresolved) {
    review.push("The underlying birth record has an unresolved duplicate flag.");
  }

  if (!foundationalIdentity && registrationCase.sdid?.status !== "IDENTITY_CREATED") {
    review.push("No foundational SDID identity has been created for this record yet.");
  }

  if (!request.replacementIndicator) {
    const conflictingActive = existingActiveCertificates.some(
      (c) => c.birthRecordId === registrationCase.id && c.status === "ACTIVE"
    );
    if (conflictingActive) {
      review.push("An active certificate already exists for this birth record.");
    }
  }

  if (blocking.length > 0) {
    return { status: "INELIGIBLE", reasons: blocking };
  }
  if (review.length > 0) {
    return { status: "MANUAL_REVIEW", reasons: review };
  }
  return { status: "ELIGIBLE", reasons: [] };
}

/** Final gate before an ELIGIBLE, paid-or-waived request can auto-advance
 * PAID -> APPROVED without a human review step (spec §20). */
export function isReadyForAutomaticApproval(request: BirthCertificateRequest): boolean {
  return (
    request.eligibility.status === "ELIGIBLE" &&
    (request.payment.status === "PAID" || request.payment.status === "WAIVED" || request.payment.status === "NOT_REQUIRED")
  );
}
