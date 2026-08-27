// Framework-agnostic domain types for the birth-notification / birth-registration
// workflow. Nothing here imports React or rsuite — these are the shapes that flow
// through src/demo/services/crvs*.ts and are persisted inside DemoDatabase.

export type BirthNotificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "ACCEPTED"
  | "CANCELLED";

export type BirthRegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "LATE_REGISTRATION_REVIEW"
  | "EXCEPTION_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REGISTERED"
  | "CANCELLED";

export type SdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "IDENTITY_CREATED"
  | "FAILED"
  | "MANUAL_REVIEW";

export type Sex = "MALE" | "FEMALE" | "UNKNOWN";

export type OccurrenceType = "FACILITY" | "HOME" | "TRANSIT" | "OTHER";

export type IdentityDocumentType =
  | "NATIONAL_ID"
  | "PASSPORT"
  | "REFUGEE_ID"
  | "DRIVER_LICENSE"
  | "OTHER"
  | "NONE";

export type VerificationState =
  | "NOT_VERIFIED"
  | "VERIFIED"
  | "UNVERIFIED_PROVIDED"
  | "MANUAL_REVIEW_REQUIRED";

export type MultipleBirthInfo = {
  isMultiple: boolean;
  birthOrder?: number;
  totalBirths?: number;
};

export type ChildDetails = {
  firstName?: string;
  middleName?: string;
  lastName: string;
  sex: Sex;
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  country?: string;
  adminPlaceOfBirth?: string;
  multipleBirth: MultipleBirthInfo;
};

export type MotherDetails = {
  firstName: string;
  lastName: string;
  documentType: IdentityDocumentType;
  documentNumber?: string;
  nationality: string;
  phone?: string;
  email?: string;
  residence?: string;
  dateOfBirth?: string;
  verification: VerificationState;
  sdidIdentityId?: string;
};

export type FatherAvailability =
  | "PROVIDED_VERIFIED"
  | "PROVIDED_UNVERIFIED"
  | "NOT_DECLARED"
  | "UNKNOWN"
  | "LEGALLY_UNAVAILABLE";

export type FatherDetails = {
  availability: FatherAvailability;
  firstName?: string;
  lastName?: string;
  documentType?: IdentityDocumentType;
  documentNumber?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  residence?: string;
  dateOfBirth?: string;
  verification?: VerificationState;
  sdidIdentityId?: string;
};

export type NotificationStatusHistoryEntry = {
  status: BirthNotificationStatus;
  at: string;
  by: string;
  note?: string;
};

export type ReturnReason = {
  reason: string;
  fields: string[];
  note?: string;
};

export type BirthNotification = {
  id: string;
  reference: string;
  status: BirthNotificationStatus;
  facilityId: string;
  facilityName: string;
  sourceReference?: string;
  occurrenceType: OccurrenceType;
  child: ChildDetails;
  mother: MotherDetails;
  father: FatherDetails;
  notifierId: string;
  notifierName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  returnedAt?: string;
  returnReason?: ReturnReason;
  cancelledAt?: string;
  cancellationReason?: string;
  convertedToRegistrationId?: string;
  statusHistory: NotificationStatusHistoryEntry[];
  version: number;
};

export type RegistrationSourceType =
  | "FROM_NOTIFICATION"
  | "COMMUNITY"
  | "LATE"
  | "ABROAD"
  | "OTHER";

export type Declarant = {
  relationship: string;
  documentType: IdentityDocumentType;
  documentNumber?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  verification: VerificationState;
  sdidIdentityId?: string;
};

export type Witness = {
  id: string;
  relationship: string;
  documentType: IdentityDocumentType;
  documentNumber?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  verification: VerificationState;
  sdidIdentityId?: string;
};

export type EvidenceItem = {
  id: string;
  documentType: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  documentDate?: string;
  issuingAuthority?: string;
  verification: VerificationState;
  previewDataUri?: string;
  replacedFromId?: string;
  removed?: boolean;
};

export type DuplicateMatchLevel = "NONE" | "POTENTIAL" | "PROBABLE" | "EXACT";

export type DuplicateCandidate = {
  caseId: string;
  reference: string;
  matchLevel: DuplicateMatchLevel;
  matchedFields: string[];
  maskedSummary: string;
  existingRecordStatus: BirthRegistrationStatus;
};

export type DuplicateResolutionType =
  | "NOT_DUPLICATE"
  | "LINKED"
  | "RETURNED_FOR_CORRECTION"
  | "ESCALATED";

export type DuplicateResolution = {
  type: DuplicateResolutionType;
  reason: string;
  resolvedBy: string;
  resolvedAt: string;
  linkedCaseId?: string;
};

export type DuplicateCheckResult = {
  checkedAt: string;
  checkedBy: string;
  candidates: DuplicateCandidate[];
  overallLevel: DuplicateMatchLevel;
  resolution?: DuplicateResolution;
};

export type ReviewSectionKey =
  | "CHILD"
  | "PARENTS"
  | "DECLARANT"
  | "WITNESSES"
  | "EVIDENCE"
  | "DUPLICATE_CHECK"
  | "LATE_OR_EXCEPTION"
  | "OFFICER_DECLARATION";

export type ReviewSectionStatus =
  | "NOT_REVIEWED"
  | "VERIFIED"
  | "CORRECTION_REQUIRED"
  | "EXCEPTION";

export type CorrectionItem = {
  id: string;
  section: ReviewSectionKey;
  fields: string[];
  reason: string;
  note?: string;
  requiredEvidenceReplacement: boolean;
  dueDate?: string;
  addressed: boolean;
  response?: string;
};

export type CorrectionRequest = {
  id: string;
  requestedBy: string;
  requestedAt: string;
  items: CorrectionItem[];
  notifyOfficer: boolean;
  resolvedAt?: string;
};

export type NotificationValueChange = {
  field: string;
  originalValue: string;
  newValue: string;
  reason: string;
  at: string;
  by: string;
};

export type RejectionReason = {
  reason: string;
  explanation: string;
  evidenceRefs: string[];
  applicantNotified: boolean;
};

export type SyncAttempt = {
  at: string;
  outcome: "SUCCESS" | "FAILED";
  failureCode?: string;
  failureMessage?: string;
};

export type ManualReviewAssignment = {
  reason: string;
  assignedTo: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  at: string;
};

export type SdidSyncRecord = {
  status: SdidSyncStatus;
  idempotencyKey?: string;
  attempts: SyncAttempt[];
  lastAttemptAt?: string;
  lastFailureCode?: string;
  foundationalIdentityId?: string;
  fictionalNin?: string;
  manualReview?: ManualReviewAssignment;
  completedAt?: string;
};

export type ExceptionType =
  | "IDENTITY_MISMATCH"
  | "POTENTIAL_DUPLICATE"
  | "MISSING_NOTIFICATION"
  | "JURISDICTION_CONFLICT"
  | "EVIDENCE_EXCEPTION"
  | "SYNCHRONIZATION_FAILURE"
  | "OTHER";

export type ExceptionRecord = {
  type: ExceptionType;
  reason: string;
  assignedTo?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  resolution?: {
    type: string;
    reason: string;
    note?: string;
    nextStatus: BirthRegistrationStatus;
    resolvedBy: string;
    resolvedAt: string;
  };
};

export type RegistrationStatusHistoryEntry = {
  status: BirthRegistrationStatus;
  at: string;
  by: string;
  note?: string;
};

export type BirthRegistrationCase = {
  id: string;
  reference: string;
  status: BirthRegistrationStatus;
  sourceType: RegistrationSourceType;
  notificationId?: string;
  notificationReference?: string;
  occurrenceType: OccurrenceType;
  facilityId?: string;
  facilityName?: string;
  placeOfBirth: string;
  processingOfficeId: string;
  processingOfficeName: string;
  jurisdiction: string;
  dateOfBirth: string;
  dateReported: string;
  daysAfterBirth: number;
  isLate: boolean;
  requiresSupervisorReview: boolean;
  delayReason?: string;
  directRegistrationReason?: string;
  registrationCategory: string;

  child: ChildDetails;
  mother: MotherDetails;
  father: FatherDetails;
  declarant: Declarant;
  witnesses: Witness[];
  evidence: EvidenceItem[];

  duplicateCheck?: DuplicateCheckResult;
  notificationValueChanges: NotificationValueChange[];

  reviewSections: Record<ReviewSectionKey, ReviewSectionStatus>;
  reviewerId?: string;
  reviewerName?: string;
  reviewLockedAt?: string;

  correctionRequests: CorrectionRequest[];

  officerId: string;
  officerName: string;
  declarationConfirmed: boolean;
  declarantConfirmed: boolean;
  privacyAcknowledged: boolean;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  registeredAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: RejectionReason;
  cancelledAt?: string;

  officialBirthRecordNumber?: string;

  sdid: SdidSyncRecord;
  exception?: ExceptionRecord;

  statusHistory: RegistrationStatusHistoryEntry[];
  version: number;
};

export type FoundationalIdentity = {
  id: string;
  fictionalNin: string;
  childFirstName?: string;
  childMiddleName?: string;
  childLastName: string;
  sex: Sex;
  dateOfBirth: string;
  placeOfBirth: string;
  birthRecordReference: string;
  motherLink?: string;
  fatherLink?: string;
  // "DECEASED" is set only by the death-registration SDID sync (never by
  // deleting/recreating the identity — see demo/services/crvsDeathSdidSync.ts).
  identityStatus: "MINOR_ACTIVE" | "ACTIVE" | "DECEASED";
  biometrics: "NOT_REQUIRED_FOR_NEWBORN";
  credential: "NOT_ISSUED";
  source: "CRVS_BIRTH_RECORD";
  createdAt: string;
  idempotencyKey: string;
  deceasedAt?: string;
  deceasedByDeathRegistrationReference?: string;
  // Marriage-SDID-sync fields (spec §8). Never used to merge two identities
  // together — see demo/services/crvsMarriageSdidSync.ts: only this
  // identity's own marital-status field and relationship list are mutated,
  // in place, never its name/NIN/nationality/address.
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  maritalStatusUpdatedAt?: string;
  maritalStatusUpdatedByMarriageReference?: string;
  // Doubles as this identity's visible "SDID history" entry for each
  // marriage event (spec §8.6 "display the event in each identity's SDID
  // history") — rendered directly, not a separate history log.
  relationships?: MarriageRelationship[];
};

// ---------------------------------------------------------------------------
// Birth-certificate request/issuance/delivery/verification lifecycle. Kept in
// this file rather than a separate certificates/types.ts so it shares the
// same "framework-agnostic, flows through demo/services/crvs*.ts" contract
// every other type here already has.

export type ActorReference = {
  id: string;
  name: string;
};

export type CertificateRequestChannel =
  | "PUBLIC_ONLINE"
  | "STAFF_ASSISTED"
  | "SYSTEM_REISSUE";

export type BirthCertificateRequestStatus =
  | "DRAFT"
  | "IDENTITY_VERIFICATION_REQUIRED"
  | "RECORD_LOOKUP_REQUIRED"
  | "RECORD_NOT_FOUND"
  | "ELIGIBILITY_CHECK"
  | "MANUAL_REVIEW"
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "PAID"
  | "APPROVED"
  | "REJECTED"
  | "ISSUING"
  | "ISSUED"
  | "DELIVERY_PENDING"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "CANCELLED";

export type BirthCertificateStatus = "ACTIVE" | "REVOKED" | "SUPERSEDED";

export type DemoPaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "WAIVED"
  | "REFUNDED";

export type CertificateDeliveryMethod =
  | "SECURE_DOWNLOAD"
  | "EMAIL"
  | "SMS_LINK"
  | "ASSISTED_CENTRE_COLLECTION";

export type CertificateDeliveryStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "EMAIL_SENT"
  | "SMS_LINK_SENT"
  | "AVAILABLE_FOR_DOWNLOAD"
  | "FAILED";

export type CertificateRequesterType =
  | "SELF"
  | "PARENT"
  | "GUARDIAN"
  | "AUTHORIZED_REPRESENTATIVE";

export type CertificateRequesterVerificationStatus =
  | "NOT_STARTED"
  | "OTP_REQUIRED"
  | "VERIFIED"
  | "MISMATCH"
  | "MANUAL_REVIEW";

export type CertificateRequester = {
  requesterType: CertificateRequesterType;
  firstName: string;
  lastName: string;
  documentType: IdentityDocumentType;
  documentNumberMasked: string;
  matchedIdentityId?: string;
  relationshipToSubject?: string;
  phoneNumberMasked?: string;
  emailMasked?: string;
  verificationStatus: CertificateRequesterVerificationStatus;
};

export type CertificateSubject = {
  birthRecordId: string;
  birthRecordNumber: string;
  foundationalIdentityId?: string;
  ninMasked?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth: string;
  placeOfBirthSummary: string;
};

export type CertificatePurpose =
  | "GENERAL_PROOF"
  | "EDUCATION"
  | "HEALTH_SERVICE"
  | "TRAVEL"
  | "LEGAL_PROCESS"
  | "REPLACEMENT"
  | "OTHER";

export type CertificateProcessingOffice = {
  centerId?: string;
  facilityId?: string;
  jurisdictionId?: string;
  jurisdictionLevel?: string;
};

export type CertificateEligibilityStatus =
  | "NOT_CHECKED"
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "MANUAL_REVIEW";

export type CertificateEligibility = {
  status: CertificateEligibilityStatus;
  checkedAt?: string;
  reasons: string[];
};

export type DemoPayment = {
  status: DemoPaymentStatus;
  amount: number;
  currency: string;
  billingReference?: string;
  receiptReference?: string;
  method?: string;
  paidAt?: string;
  failureReason?: string;
  waivedReason?: string;
  waivedCategory?: string;
  waivedBy?: ActorReference;
  waivedAt?: string;
  refundedAt?: string;
};

export type CertificateDeliveryAttempt = {
  at: string;
  outcome: "SUCCESS" | "FAILED";
  failureReason?: string;
};

export type CertificateDelivery = {
  method: CertificateDeliveryMethod;
  status: CertificateDeliveryStatus;
  destinationMasked?: string;
  attempts: CertificateDeliveryAttempt[];
  lastAttemptAt?: string;
  requiresReverification?: boolean;
};

export type CertificateRequestStatusHistoryEntry = {
  status: BirthCertificateRequestStatus;
  at: string;
  by: string;
  note?: string;
};

export type BirthCertificateRequest = {
  id: string;
  applicationReference: string;
  channel: CertificateRequestChannel;
  status: BirthCertificateRequestStatus;

  requester: CertificateRequester;
  subject: CertificateSubject;

  purpose: CertificatePurpose;
  purposeDescription?: string;
  replacementIndicator?: boolean;
  replacedCertificateNumber?: string;

  processingOffice?: CertificateProcessingOffice;

  eligibility: CertificateEligibility;

  payment: DemoPayment;
  delivery: CertificateDelivery;
  certificateId?: string;

  assignedOfficer?: ActorReference;
  assignedRegistrar?: ActorReference;
  assignedSupervisor?: ActorReference;

  holdReason?: string;
  holdReviewDate?: string;
  holdNote?: string;
  informationRequested?: { note: string; evidence?: string; dueDate?: string; at: string; by: string };
  rejectionReason?: { reason: string; explanation: string; applicantNotified: boolean };

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  issuedAt?: string;
  deliveredAt?: string;

  createdBy: ActorReference;
  updatedBy: ActorReference;
  statusHistory: CertificateRequestStatusHistoryEntry[];
  version: number;
};

export type CertificateVerificationMeta = {
  publicVerificationToken: string;
  verificationCode: string;
  qrPayload: string;
};

export type CertificateSignatureMeta = {
  mode: "DEMO_SIMULATED";
  signedAt: string;
  signerName: string;
  signerRole: string;
  digest: string;
  notice: string;
};

export type CertificateDocumentMeta = {
  fileName: string;
  mimeType: "application/pdf";
  generatedAt: string;
  templateVersion: string;
  demoWatermark: true;
};

export type CertificateDownloadAccess = {
  accessToken: string;
  accessTokenExpiresAt: string;
};

export type DemoBirthCertificate = {
  id: string;
  certificateNumber: string;
  requestId: string;

  birthRecordId: string;
  birthRecordNumber: string;
  foundationalIdentityId?: string;
  ninMasked?: string;

  status: BirthCertificateStatus;

  issuedAt: string;
  issuedBy: ActorReference;
  issuingAuthority: string;

  subject: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    sex: Sex;
    dateOfBirth: string;
    placeOfBirth: string;
  };

  parentSummary: {
    motherName: string;
    fatherName?: string;
  };

  verification: CertificateVerificationMeta;
  signature: CertificateSignatureMeta;
  document: CertificateDocumentMeta;
  download: CertificateDownloadAccess;

  downloadCount: number;
  lastDownloadedAt?: string;

  revokedAt?: string;
  revokedBy?: ActorReference;
  revocationReason?: string;
  revocationNote?: string;

  supersededByCertificateId?: string;
  previousCertificateId?: string;

  createdAt: string;
  version: number;
};

export type CertificateConfig = {
  issuingAuthorityLabel: string;
  certificateTitle: string;
  templateVersion: string;
  footerText: string;
  fee: number;
  currency: string;
  downloadLinkExpiryHours: number;
  deliveryChannelsEnabled: CertificateDeliveryMethod[];
  automaticIssuanceEnabled: boolean;
  demoWatermarkText: string;
};

export const emptyReviewSections = (): Record<ReviewSectionKey, ReviewSectionStatus> => ({
  CHILD: "NOT_REVIEWED",
  PARENTS: "NOT_REVIEWED",
  DECLARANT: "NOT_REVIEWED",
  WITNESSES: "NOT_REVIEWED",
  EVIDENCE: "NOT_REVIEWED",
  DUPLICATE_CHECK: "NOT_REVIEWED",
  LATE_OR_EXCEPTION: "NOT_REVIEWED",
  OFFICER_DECLARATION: "NOT_REVIEWED",
});

// ---------------------------------------------------------------------------
// Death-notification / death-registration workflow types. Mirrors the birth
// types above field-for-field wherever the domain concept is the same
// (identity documents, verification states, evidence, correction requests,
// sync records) and only diverges where death genuinely differs (deceased
// person instead of child, medical certification, next of kin, and the
// late/medico-legal/unidentified-person review branches).

export type DeathNotificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "ACCEPTED"
  | "CANCELLED";

export type DeathReportingPathway =
  | "HEALTH_FACILITY"
  | "COMMUNITY"
  | "LATE"
  | "MEDICO_LEGAL"
  | "UNIDENTIFIED";

export type DeathRegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "LATE_REGISTRATION_REVIEW"
  | "MEDICO_LEGAL_REVIEW"
  | "UNIDENTIFIED_PERSON_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REGISTERED"
  | "CANCELLED";

export type DeathSdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "IDENTITY_MARKED_DECEASED"
  | "FAILED"
  | "MANUAL_REVIEW";

export type DeathPlaceCategory = "HEALTH_FACILITY" | "HOME" | "PUBLIC_PLACE" | "TRANSIT" | "OTHER";

export type DeathCircumstanceCategory =
  | "NATURAL_ILLNESS"
  | "ACCIDENT"
  | "SUSPECTED_UNNATURAL"
  | "UNKNOWN"
  | "OTHER";

export type DeceasedIdentityStatus = "KNOWN" | "IDENTITY_UNKNOWN";

export type DeceasedPerson = {
  identityStatus: DeceasedIdentityStatus;
  nin?: string;
  sdidIdentityId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  sex: Sex;
  dateOfBirth?: string;
  estimatedAge?: number;
  nationality?: string;
  residence?: string;
  documentType?: IdentityDocumentType;
  documentNumber?: string;
  // Used only when identityStatus === "IDENTITY_UNKNOWN" (spec §4.5) — a
  // temporary descriptive record, never a fabricated identity.
  descriptivePhysicalSummary?: string;
  verification: VerificationState;
};

export type DeathOccurrence = {
  dateOfDeath: string;
  timeOfDeath?: string;
  placeCategory: DeathPlaceCategory;
  facilityId?: string;
  facilityName?: string;
  location: string;
  adminLocation: string;
  jurisdiction: string;
  circumstanceCategory: DeathCircumstanceCategory;
  circumstanceNote?: string;
};

export type CauseOfDeathClassification = {
  immediateCause?: string;
  antecedentCause?: string;
  underlyingCause?: string;
  otherContributingConditions?: string;
  mannerOfDeath?: "NATURAL" | "ACCIDENT" | "SUICIDE" | "HOMICIDE" | "UNDETERMINED" | "PENDING_INVESTIGATION";
};

/** Restricted (spec §2/§9): only rendered to users with
 * CRVS_PERMISSIONS.DEATH_CAUSE_VIEW — see RestrictedCauseOfDeathNotice. */
export type MedicalDeathCertification = {
  isCertified: boolean;
  certifyingFacilityId?: string;
  certifyingFacilityName?: string;
  certifierName?: string;
  certifierRole?: string;
  certificateReferenceNumber?: string;
  dateCertified?: string;
  cause: CauseOfDeathClassification;
  supportingDocumentId?: string;
};

export type NextOfKin = {
  relationship: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  residence?: string;
  documentType?: IdentityDocumentType;
  documentNumber?: string;
  preferredNotificationMethod?: "SMS" | "EMAIL" | "PHONE_CALL" | "IN_PERSON";
  verification: VerificationState;
  sdidIdentityId?: string;
};

export type DeathWitness = Witness & {
  basisOfKnowledge?: string;
};

export type DeathEvidence = EvidenceItem;

export type DeathIdentityMatchLevel = "NO_MATCH" | "LOW_CONFIDENCE" | "PROBABLE" | "CONFIRMED";

export type IdentityMatch = {
  checkedAt: string;
  checkedBy: string;
  matchLevel: DeathIdentityMatchLevel;
  confidenceScore?: number;
  matchedSdidIdentityId?: string;
  matchedFields: string[];
  maskedSummary?: string;
  requiresManualReview: boolean;
  resolution?: {
    type: "CONFIRMED_MATCH" | "NO_MATCH_CONTINUE" | "MANUAL_REVIEW";
    resolvedBy: string;
    resolvedAt: string;
    note?: string;
  };
};

export type DeathReviewSectionKey =
  | "DECEASED"
  | "OCCURRENCE"
  | "MEDICAL_CERTIFICATION"
  | "DECLARANT"
  | "NEXT_OF_KIN"
  | "WITNESSES"
  | "EVIDENCE"
  | "IDENTITY_CHECK"
  | "DUPLICATE_CHECK"
  | "OFFICER_DECLARATION";

export type DeathCorrectionItem = {
  id: string;
  section: DeathReviewSectionKey;
  fields: string[];
  reason: string;
  note?: string;
  requiredEvidenceReplacement: boolean;
  dueDate?: string;
  addressed: boolean;
  response?: string;
};

export type DeathCorrectionRequest = {
  id: string;
  requestedBy: string;
  requestedAt: string;
  items: DeathCorrectionItem[];
  notifyOfficer: boolean;
  resolvedAt?: string;
  // Public /civil-registration/death/respond/:token route looks the case up
  // by this token rather than requiring a staff sign-in.
  responseToken: string;
};

export type DeathReviewDecisionType =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CORRECTION"
  | "ROUTE_LATE"
  | "ROUTE_MEDICO_LEGAL"
  | "ROUTE_UNIDENTIFIED";

export type DeathReviewDecision = {
  type: DeathReviewDecisionType;
  decidedBy: string;
  decidedAt: string;
  reason?: string;
  note?: string;
  // Set true only on APPROVE — the Civil Registrar's explicit "I did not
  // prepare this case" confirmation (spec §2 maker-checker requirement),
  // recorded alongside the automatic conflict-of-interest check.
  confirmedNoConflict?: boolean;
};

export type DeathRejectionReason = {
  reason: string;
  explanation: string;
  evidenceRefs: string[];
  declarantNotified: boolean;
};

export type DeathSyncAttempt = {
  at: string;
  outcome: "SUCCESS" | "FAILED";
  failureCode?: string;
  failureMessage?: string;
};

export type DeathManualReviewAssignment = {
  reason: string;
  assignedTo: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  at: string;
};

export type SdidDeathSyncRecord = {
  status: DeathSdidSyncStatus;
  idempotencyKey?: string;
  attempts: DeathSyncAttempt[];
  lastAttemptAt?: string;
  lastFailureCode?: string;
  linkedFoundationalIdentityId?: string;
  linkedNin?: string;
  manualReview?: DeathManualReviewAssignment;
  completedAt?: string;
  // The death-registration reference that caused the deceased-status update
  // (spec §7.8), shown in both the CRVS timeline and the SDID identity
  // history.
  crvsReference?: string;
};

export type DeathExceptionType =
  | "LATE_FILING"
  | "MEDICO_LEGAL"
  | "UNIDENTIFIED_PERSON"
  | "POTENTIAL_DUPLICATE"
  | "IDENTITY_MISMATCH"
  | "SYNCHRONIZATION_FAILURE"
  | "OTHER";

export type DeathExceptionRecord = {
  type: DeathExceptionType;
  reason: string;
  triggeringRule?: string;
  assignedTo?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  resolution?: {
    type: string;
    reason: string;
    note?: string;
    nextStatus: DeathRegistrationStatus;
    resolvedBy: string;
    resolvedAt: string;
  };
};

export type DeathRegistrationStatusHistoryEntry = {
  status: DeathRegistrationStatus;
  at: string;
  by: string;
  note?: string;
};

export type DeathNotificationStatusHistoryEntry = {
  status: DeathNotificationStatus;
  at: string;
  by: string;
  note?: string;
};

export type DeathReturnReason = {
  reason: string;
  fields: string[];
  note?: string;
};

export type DeathNotification = {
  id: string;
  reference: string;
  status: DeathNotificationStatus;
  pathway: DeathReportingPathway;
  facilityId?: string;
  facilityName?: string;
  deceased: DeceasedPerson;
  occurrence: DeathOccurrence;
  medicalCertification?: MedicalDeathCertification;
  notifierId: string;
  notifierName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  returnedAt?: string;
  returnReason?: DeathReturnReason;
  cancelledAt?: string;
  cancellationReason?: string;
  convertedToRegistrationId?: string;
  statusHistory: DeathNotificationStatusHistoryEntry[];
  version: number;
};

/** Immutable snapshot written the moment a case transitions to REGISTERED
 * (spec §6 "the registered record is read-only") — later legal changes go
 * through the corrections workflow, never a direct edit of this event or the
 * case's registered fields. */
export type DeathRegistrationEvent = {
  id: string;
  registrationReference: string;
  officialDeathRecordNumber: string;
  registeredAt: string;
  registeredBy: string;
  registeredByName: string;
  processingOfficeId: string;
  processingOfficeName: string;
  deceasedSummary: {
    firstName?: string;
    lastName?: string;
    sex: Sex;
    dateOfDeath: string;
  };
};

export type DeathCertificateEligibilityStatus = "NOT_CHECKED" | "ELIGIBLE" | "INELIGIBLE" | "MANUAL_REVIEW";

export type DeathCertificateEligibility = {
  status: DeathCertificateEligibilityStatus;
  checkedAt?: string;
  reasons: string[];
};

/** Presentation-shape mirror of DemoAuditEvent (demo/types.ts), scoped to the
 * death workflow — the actual store is the same shared db.auditEvents
 * collection written by logCrvsAudit(), this type just documents the shape
 * death screens read back out of it. */
export type DeathAuditEntry = {
  id: string;
  actor: string;
  action: string;
  module: string;
  targetRef: string;
  at: string;
  details?: string;
};

export const emptyDeathReviewSections = (): Record<DeathReviewSectionKey, ReviewSectionStatus> => ({
  DECEASED: "NOT_REVIEWED",
  OCCURRENCE: "NOT_REVIEWED",
  MEDICAL_CERTIFICATION: "NOT_REVIEWED",
  DECLARANT: "NOT_REVIEWED",
  NEXT_OF_KIN: "NOT_REVIEWED",
  WITNESSES: "NOT_REVIEWED",
  EVIDENCE: "NOT_REVIEWED",
  IDENTITY_CHECK: "NOT_REVIEWED",
  DUPLICATE_CHECK: "NOT_REVIEWED",
  OFFICER_DECLARATION: "NOT_REVIEWED",
});

export type DeathDuplicateCandidate = {
  caseId: string;
  reference: string;
  matchLevel: DuplicateMatchLevel;
  matchedFields: string[];
  maskedSummary: string;
  existingRecordStatus: DeathRegistrationStatus;
};

export type DeathDuplicateCheckResult = {
  checkedAt: string;
  checkedBy: string;
  candidates: DeathDuplicateCandidate[];
  overallLevel: DuplicateMatchLevel;
  resolution?: DuplicateResolution;
};

export type DeathRegistrationCase = {
  id: string;
  reference: string;
  status: DeathRegistrationStatus;
  pathway: DeathReportingPathway;
  notificationId?: string;
  notificationReference?: string;

  facilityId?: string;
  facilityName?: string;
  processingOfficeId: string;
  processingOfficeName: string;
  jurisdiction: string;

  dateOfDeath: string;
  dateReported: string;
  daysAfterDeath: number;
  isLate: boolean;
  requiresSupervisorReview: boolean;
  delayReason?: string;

  deceased: DeceasedPerson;
  occurrence: DeathOccurrence;
  medicalCertification?: MedicalDeathCertification;
  declarant: Declarant;
  nextOfKin: NextOfKin[];
  witnesses: DeathWitness[];
  evidence: DeathEvidence[];

  identityMatch?: IdentityMatch;
  duplicateCheck?: DeathDuplicateCheckResult;

  reviewSections: Record<DeathReviewSectionKey, ReviewSectionStatus>;
  reviewerId?: string;
  reviewerName?: string;
  reviewLockedAt?: string;
  reviewDecisions: DeathReviewDecision[];

  correctionRequests: DeathCorrectionRequest[];

  officerId: string;
  officerName: string;
  declarationConfirmed: boolean;
  declarantConfirmed: boolean;
  privacyAcknowledged: boolean;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  registeredAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: DeathRejectionReason;
  cancelledAt?: string;
  cancellationReason?: string;

  officialDeathRecordNumber?: string;
  registrationEvent?: DeathRegistrationEvent;

  sdid: SdidDeathSyncRecord;
  exception?: DeathExceptionRecord;
  certificateEligibility?: DeathCertificateEligibility;

  statusHistory: DeathRegistrationStatusHistoryEntry[];
  version: number;
};

// ---------------------------------------------------------------------------
// Marriage-declaration / marriage-registration workflow types. Reuses shared
// shapes (Witness, EvidenceItem, VerificationState, IdentityDocumentType,
// DuplicateMatchLevel) the same way birth/death do, but is genuinely
// two-party throughout — every identity, verification, witness list and SDID
// sync result exists once per spouse, not once per case. Appointment and
// ceremony are modeled as their own sub-entities with their own small status
// machines (see statusMachines.ts) rather than folded into the application
// status, mirroring how SdidSyncStatus is kept separate from the birth/death
// registration status.

export type MarriageApplicationStatus =
  | "DRAFT"
  | "PARTNER_VERIFICATION_REQUIRED"
  | "SUBMITTED"
  | "ELIGIBILITY_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "APPROVED"
  | "REJECTED"
  | "APPOINTMENT_SCHEDULED"
  | "READY_FOR_CEREMONY"
  | "CEREMONY_COMPLETED"
  | "NO_SHOW"
  | "POSTPONED"
  | "CANCELLED"
  | "REGISTERED";

export type MarriageAppointmentStatus =
  | "SCHEDULED"
  | "RESCHEDULE_REQUESTED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type MarriageCeremonyOutcome =
  | "NOT_STARTED"
  | "COMPLETED"
  | "POSTPONED"
  | "NO_SHOW"
  | "CONSENT_DECLINED"
  | "CANCELLED";

/** Per-spouse SDID sync sub-status. Shape mirrors DeathSdidSyncStatus exactly
 * — only the success terminal differs (IDENTITY_UPDATED, since marital
 * status is updated rather than the person marked deceased). */
export type MarriageSpouseSdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "IDENTITY_UPDATED"
  | "FAILED"
  | "MANUAL_REVIEW";

/** Case-level aggregate, derived from both spouses' sub-statuses via
 * aggregateMarriageSyncStatus() — never assigned directly, always computed
 * then routed through assertTransitionMarriageSync(). */
export type MarriageSdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "BOTH_IDENTITIES_UPDATED"
  | "PARTIAL_FAILURE"
  | "FAILED"
  | "MANUAL_REVIEW";

export type MarriageObjectionStatus = "NONE" | "PENDING" | "UPHELD" | "DISMISSED" | "WITHDRAWN";

export type CivilStatusCategory = "SINGLE" | "DIVORCED" | "WIDOWED";

export type PropertyRegime =
  | "COMMUNITY_OF_PROPERTY"
  | "SEPARATION_OF_PROPERTY"
  | "LIMITED_COMMUNITY_OF_PROPERTY";

export type NationalityCategory = "CITIZEN" | "FOREIGN_NATIONAL";

export type SpouseRole = "APPLICANT1" | "APPLICANT2";

export type MarriageOfficeType = "DISTRICT_SECTOR_OFFICE" | "EMBASSY_CONSULATE";

/** Discrete identity-verification result for one applicant — deliberately
 * never collapsed into a single pass/fail (spec §12: "must not claim legally
 * eligible merely because a mock identity lookup succeeded"). */
export type ApplicantIdentityVerification = {
  checkedAt: string;
  checkedBy: string;
  matchLevel: "NO_MATCH" | "LOW_CONFIDENCE" | "PROBABLE" | "CONFIRMED";
  confidenceScore?: number;
  matchedSdidIdentityId?: string;
  matchedFields: string[];
  requiresManualReview: boolean;
  resolution?: {
    type: "CONFIRMED_MATCH" | "NO_MATCH_CONTINUE" | "MANUAL_REVIEW";
    resolvedBy: string;
    resolvedAt: string;
    note?: string;
  };
};

/** Verifies the applicant's declared current civil status against SDID/CRVS
 * records — distinct from ApplicantIdentityVerification, which only confirms
 * who the person is, not whether they are free to marry. */
export type CivilStatusVerification = {
  declaredStatus: CivilStatusCategory;
  verifiedAgainstSdid: boolean;
  consistent: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  sourceReference?: string;
  notes?: string;
};

export type MarriageApplicant = {
  spouseRole: SpouseRole;
  nationalityCategory: NationalityCategory;
  documentType: IdentityDocumentType;
  documentNumber?: string;
  nin?: string;
  sdidIdentityId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  sex: Sex;
  dateOfBirth?: string;
  nationality?: string;
  residence?: string;
  phone?: string;
  email?: string;
  civilStatus: CivilStatusCategory;
  civilStatusVerification?: CivilStatusVerification;
  identityVerification?: ApplicantIdentityVerification;
  verification: VerificationState;
  // Only meaningful for the second applicant — whether they have confirmed
  // participation via their own /respond/:token session (spec §6).
  partnerConfirmationStatus: "NOT_REQUIRED" | "PENDING" | "CONFIRMED" | "DECLINED";
  partnerConfirmedAt?: string;
  partnerDeclinedAt?: string;
  partnerDeclineReason?: string;
};

/** Minimal partner-summary projection — used only where the OTHER applicant
 * needs to see who they are responding about, never the partner's full
 * record (spec §6 applicant-response page, §7.2 public tracking redaction). */
export type MarriagePartner = {
  spouseRole: SpouseRole;
  firstName?: string;
  lastName?: string;
  proposedMarriageDate?: string;
  officeName?: string;
};

export type MarriageWitness = Witness & {
  spouseRole: SpouseRole;
  dateOfBirth: string;
  replaced?: boolean;
  replacedAt?: string;
  replacedReason?: string;
};

export type MarriageEvidence = EvidenceItem;

export type MarriageEligibilityRuleKey =
  | "AGE"
  | "ADVANCE_NOTICE"
  | "EXISTING_MARRIAGE_CONFLICT"
  | "CIVIL_STATUS_CONSISTENCY"
  | "JURISDICTION"
  | "RESIDENCE_DOMICILE"
  | "REQUIRED_DOCUMENTS"
  | "WITNESS_REQUIREMENTS"
  | "IDENTITY_MATCH_CONFIDENCE"
  | "RELATIONSHIP_PROHIBITED_CHECK"
  | "DUPLICATE_DECLARATION";

/** One discrete rule outcome — the eligibility screen always renders the
 * full array, never a collapsed verdict (spec §12). */
export type MarriageEligibilityRuleResult = {
  rule: MarriageEligibilityRuleKey;
  passed: boolean;
  severity: "BLOCKING" | "REVIEW" | "INFO";
  message: string;
  affectedSpouse?: SpouseRole | "BOTH";
};

export type MarriageExistingConflictCandidate = {
  applicationId?: string;
  registrationId?: string;
  reference: string;
  matchedSpouseRole: SpouseRole;
  status: string;
  maskedSummary: string;
};

export type MarriageEligibilityCheck = {
  checkedAt: string;
  checkedBy: string;
  results: MarriageEligibilityRuleResult[];
  existingMarriageConflicts: { spouseRole: SpouseRole; candidate: MarriageExistingConflictCandidate }[];
  overallOutcome: "ELIGIBLE" | "REQUIRES_CORRECTION" | "REQUIRES_EXCEPTION" | "INELIGIBLE";
};

export type MarriageDuplicateCandidate = {
  applicationId: string;
  reference: string;
  matchLevel: DuplicateMatchLevel;
  matchedFields: string[];
  maskedSummary: string;
  existingRecordStatus: MarriageApplicationStatus;
};

export type MarriageDuplicateCheckResult = {
  checkedAt: string;
  checkedBy: string;
  candidates: MarriageDuplicateCandidate[];
  overallLevel: DuplicateMatchLevel;
  resolution?: DuplicateResolution;
};

export type MarriageRescheduleEntry = {
  requestedBy: "APPLICANT" | "STAFF";
  requestedAt: string;
  previousDate: string;
  previousTimeSlot: string;
  reason: string;
  approvedBy?: string;
  approvedAt?: string;
};

export type MarriageCancellationEntry = {
  requestedBy: "APPLICANT" | "STAFF";
  reason: string;
  at: string;
  by: string;
};

export type MarriageAppointment = {
  id: string;
  reference: string;
  applicationId: string;
  applicationReference: string;
  status: MarriageAppointmentStatus;
  officeId: string;
  officeName: string;
  date: string;
  timeSlot: string;
  isSpecialDay: boolean;
  officiantId?: string;
  officiantName?: string;
  room?: string;
  scheduledBy: string;
  scheduledByName: string;
  scheduledAt: string;
  rescheduleHistory: MarriageRescheduleEntry[];
  cancellationHistory: MarriageCancellationEntry[];
  pendingRescheduleRequest?: { requestedBy: "APPLICANT" | "STAFF"; requestedAt: string; reason: string; preferredDate?: string };
  pendingCancelRequest?: { requestedBy: "APPLICANT" | "STAFF"; requestedAt: string; reason: string };
  notes?: string;
};

export type MarriagePaymentAttempt = {
  at: string;
  outcome: "SUCCESS" | "FAILED" | "CANCELLED";
  failureReason?: string;
};

export type MarriagePayment = {
  status: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "WAIVED";
  amount: number;
  currency: string;
  isSpecialDayFee: boolean;
  method?: "DEMO_MOBILE_MONEY" | "DEMO_CARD" | "DEMO_BANK_TRANSFER";
  reference?: string;
  paidAt?: string;
  attempts: MarriagePaymentAttempt[];
  waivedBy?: string;
  waivedReason?: string;
};

export type MarriageReviewSectionKey =
  | "APPLICANT1"
  | "APPLICANT2"
  | "PROPOSED_MARRIAGE"
  | "ELIGIBILITY"
  | "EVIDENCE"
  | "WITNESSES"
  | "PAYMENT"
  | "OFFICER_DECLARATION";

export const emptyMarriageReviewSections = (): Record<MarriageReviewSectionKey, ReviewSectionStatus> => ({
  APPLICANT1: "NOT_REVIEWED",
  APPLICANT2: "NOT_REVIEWED",
  PROPOSED_MARRIAGE: "NOT_REVIEWED",
  ELIGIBILITY: "NOT_REVIEWED",
  EVIDENCE: "NOT_REVIEWED",
  WITNESSES: "NOT_REVIEWED",
  PAYMENT: "NOT_REVIEWED",
  OFFICER_DECLARATION: "NOT_REVIEWED",
});

export type MarriageReviewDecisionType = "APPROVE" | "REJECT" | "REQUEST_CORRECTION" | "ROUTE_EXCEPTION" | "OPEN_OBJECTION";

export type MarriageReviewDecision = {
  type: MarriageReviewDecisionType;
  decidedBy: string;
  decidedAt: string;
  reason?: string;
  note?: string;
  // Set true only on APPROVE — mirrors DeathReviewDecision's maker-checker
  // confirmation (spec §3 "must not perform its final legal approval").
  confirmedNoConflict?: boolean;
};

export type MarriageCorrectionItem = {
  id: string;
  section: MarriageReviewSectionKey;
  fields: string[];
  affectedSpouse?: SpouseRole | "BOTH";
  reason: string;
  note?: string;
  requiredEvidenceReplacement: boolean;
  dueDate?: string;
  addressed: boolean;
  response?: string;
};

export type MarriageCorrectionRequest = {
  id: string;
  requestedBy: string;
  requestedAt: string;
  items: MarriageCorrectionItem[];
  notifyApplicants: boolean;
  resolvedAt?: string;
  // Public /civil-registration/marriage/respond/:token route looks the
  // application up by this token rather than requiring a staff sign-in.
  responseToken: string;
};

export type MarriageObjection = {
  id: string;
  raisedBy: string;
  raisedByRelationship?: string;
  raisedAt: string;
  reason: string;
  evidenceRefs?: string[];
  status: MarriageObjectionStatus;
  resolution?: {
    type: "UPHOLD" | "DISMISS";
    reason: string;
    note?: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  withdrawnAt?: string;
};

export type MarriageRejectionReason = {
  reason: string;
  explanation: string;
  evidenceRefs: string[];
  applicantsNotified: boolean;
  // Set when the application was auto-rejected as a consequence of a
  // ceremony-level consent decline (statusMachines.ts keeps the top-level
  // enum at exactly the spec's 17 values by folding this case into REJECTED
  // rather than adding a dedicated status).
  ceremonyConsentDeclined?: boolean;
};

export type MarriageConsent = {
  applicant1Consented: boolean;
  applicant1ConsentedAt?: string;
  applicant2Consented: boolean;
  applicant2ConsentedAt?: string;
  declinedBy?: SpouseRole;
  declineReason?: string;
  declinedAt?: string;
};

export type MarriageWitnessCheckIn = {
  witnessId: string;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
};

/** One ceremony attempt. Postponed/no-show ceremonies are never re-mutated —
 * a fresh MarriageCeremony record is created for the rescheduled attempt,
 * mirroring the immutable-attempt pattern already used for registration
 * events elsewhere in this file. */
export type MarriageCeremony = {
  id: string;
  applicationId: string;
  appointmentId: string;
  attemptNumber: number;
  officiantId?: string;
  officiantName?: string;
  startedAt?: string;
  applicant1CheckedIn: boolean;
  applicant1CheckedInAt?: string;
  applicant2CheckedIn: boolean;
  applicant2CheckedInAt?: string;
  witnessCheckIns: MarriageWitnessCheckIn[];
  requiredDocumentsConfirmed: boolean;
  eligibilityRecheckPassed?: boolean;
  existingMarriageRecheckPassed?: boolean;
  consent: MarriageConsent;
  propertyRegime?: PropertyRegime;
  outcome: MarriageCeremonyOutcome;
  completedAt?: string;
  postponedReason?: string;
  noShowNote?: string;
  cancellationReason?: string;
};

/** Immutable snapshot written the moment an application transitions to
 * REGISTERED (spec §7 "the legal record must be read-only") — later legal
 * changes go through the correction/amendment or dissolution workflow, never
 * a direct edit of this event or the application's registered fields. */
export type MarriageRegistrationEvent = {
  id: string;
  registrationNumber: string;
  registeredAt: string;
  registeredBy: string;
  registeredByName: string;
  officeId: string;
  officeName: string;
  ceremonyId: string;
  appointmentId: string;
  marriageDate: string;
  spouse1Summary: { firstName?: string; lastName?: string; sex: Sex };
  spouse2Summary: { firstName?: string; lastName?: string; sex: Sex };
  propertyRegime?: PropertyRegime;
  officiantName?: string;
};

export type MarriageExceptionType =
  | "UNDERAGE_WITHOUT_APPROVED_EXCEPTION"
  | "FOREIGN_DOCUMENT_REVIEW"
  | "ADVANCE_NOTICE_WAIVED"
  | "EXISTING_MARRIAGE_CONFLICT"
  | "CIVIL_STATUS_MISMATCH"
  | "OTHER";

export type MarriageExceptionRecord = {
  type: MarriageExceptionType;
  reason: string;
  triggeringRule?: string;
  assignedTo?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  resolution?: {
    type: string;
    reason: string;
    note?: string;
    nextStatus: MarriageApplicationStatus;
    resolvedBy: string;
    resolvedAt: string;
  };
};

export type MarriageManualReviewAssignment = {
  reason: string;
  assignedTo: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  at: string;
};

/** The relationship link created between both verified SDID identities on a
 * successful sync (spec §8.2/§8.4) — a link record, never a merge of the two
 * identities. Stored on both linked FoundationalIdentity.relationships[]
 * entries (symmetric) and carries the CRVS registration reference that
 * caused it. */
export type MarriageRelationship = {
  id: string;
  type: "SPOUSE";
  identityAId: string;
  identityBId: string;
  marriageRegistrationReference: string;
  createdAt: string;
  status: "ACTIVE" | "DISSOLVED";
};

/** Per-spouse SDID sync sub-record — shape mirrors SdidDeathSyncRecord. */
export type SdidMarriageSpouseSyncRecord = {
  status: MarriageSpouseSdidSyncStatus;
  idempotencyKey?: string;
  attempts: DeathSyncAttempt[];
  lastAttemptAt?: string;
  lastFailureCode?: string;
  linkedFoundationalIdentityId?: string;
  linkedNin?: string;
  manualReview?: MarriageManualReviewAssignment;
  completedAt?: string;
};

/** Case-level aggregate wrapping both spouses' independent sync sub-records
 * (spec §8: "record separate synchronization results for each identity").
 * `status` is derived via aggregateMarriageSyncStatus() in
 * crvsMarriageSdidSync.ts, never assigned directly. */
export type SdidMarriageSyncRecord = {
  status: MarriageSdidSyncStatus;
  applicant1: SdidMarriageSpouseSyncRecord;
  applicant2: SdidMarriageSpouseSyncRecord;
  // The relationship link created between both verified SDID identities
  // (spec §8.2) — never a merge of the two identities.
  relationshipId?: string;
  manualReview?: MarriageManualReviewAssignment;
};

export type MarriageCertificateEligibilityStatus = "NOT_CHECKED" | "ELIGIBLE" | "INELIGIBLE" | "MANUAL_REVIEW";

export type MarriageCertificateEligibility = {
  status: MarriageCertificateEligibilityStatus;
  checkedAt?: string;
  reasons: string[];
};

/** Presentation-shape mirror of DemoAuditEvent, scoped to the marriage
 * workflow — the actual store is the same shared db.auditEvents collection
 * written by logCrvsAudit(). */
export type MarriageAuditEntry = {
  id: string;
  actor: string;
  action: string;
  module: string;
  targetRef: string;
  at: string;
  details?: string;
};

export type MarriageApplicationStatusHistoryEntry = {
  status: MarriageApplicationStatus;
  at: string;
  by: string;
  note?: string;
};

export type MarriageApplication = {
  id: string;
  reference: string;
  status: MarriageApplicationStatus;

  officeId: string;
  officeName: string;
  officeType: MarriageOfficeType;
  jurisdiction: string;

  applicant1: MarriageApplicant;
  applicant2: MarriageApplicant;
  // Token for the public /civil-registration/marriage/respond/:token page —
  // reused for both the pre-submission partner-verification stage and any
  // later applicant-facing response need. Distinct from a correction
  // request's own responseToken, which is scoped to that one correction.
  partnerResponseToken?: string;

  proposedMarriageDate?: string;
  preferredTimeWindow?: string;
  ceremonyType: "CIVIL" | "CIVIL_WITH_RELIGIOUS_RECOGNITION";
  propertyRegime?: PropertyRegime;
  languageOrAccessibilityNote?: string;
  isSpecialDayRequest: boolean;

  eligibility?: MarriageEligibilityCheck;
  duplicateCheck?: MarriageDuplicateCheckResult;

  evidence: MarriageEvidence[];
  witnesses: MarriageWitness[];

  payment: MarriagePayment;

  reviewSections: Record<MarriageReviewSectionKey, ReviewSectionStatus>;
  reviewerId?: string;
  reviewerName?: string;
  reviewLockedAt?: string;
  reviewDecisions: MarriageReviewDecision[];

  correctionRequests: MarriageCorrectionRequest[];
  objection?: MarriageObjection;
  exception?: MarriageExceptionRecord;

  appointmentId?: string;
  appointmentReference?: string;
  ceremonyId?: string;

  officerId: string;
  officerName: string;
  declarationConfirmed: boolean;
  consentToVerification: boolean;
  privacyAcknowledged: boolean;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  registeredAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: MarriageRejectionReason;
  cancelledAt?: string;
  cancellationReason?: string;

  registrationEvent?: MarriageRegistrationEvent;

  sdid: SdidMarriageSyncRecord;
  certificateEligibility?: MarriageCertificateEligibility;

  // Set by demoRegisterDivorce() (crvsDivorceRegistrations.ts) on a
  // registered divorce — deliberately NOT a new MarriageApplicationStatus
  // value (status stays "REGISTERED" forever: the marriage's own
  // registration is an immutable historical fact — see statusHistory above)
  // but an annotation recording that the marriage is now dissolved, per
  // spec §11/§21 "update the existing marriage record... never delete the
  // original marriage record." UI reads this alongside status ===
  // "REGISTERED" to render a "Dissolved by divorce" state.
  dissolution?: {
    divorceRegistrationId: string;
    divorceRegistrationReference: string;
    effectiveDate: string;
    recordedAt: string;
    recordedBy: string;
  };

  statusHistory: MarriageApplicationStatusHistoryEntry[];
  version: number;
};

/** Redacted projection for the unauthenticated public tracking page (spec
 * §6 "must NOT reveal the partner's protected identity details through an
 * unverified tracking session"). Masks both spouses symmetrically — never
 * the full MarriageApplication. Built by demoGetMarriagePublicTrackingView()
 * in crvsMarriagePublicTracking.ts. */
export type MarriagePublicTrackingView = {
  reference: string;
  status: MarriageApplicationStatus;
  submittedAt?: string;
  officeName: string;
  maskedSpouseSummary: string;
  timeline: { status: MarriageApplicationStatus; label: string; at?: string }[];
  hasOpenCorrection: boolean;
  hasOpenObjection: boolean;
  appointment?: { date: string; timeSlot: string; officeName: string };
  nextAction: string;
  certificateEligible: boolean;
};

/** Scoped projection for the token-based /respond/:token page — the
 * responding applicant's own full editable data, plus only a minimal
 * MarriagePartner summary of the other spouse (never their documents,
 * contact details, or witnesses). */
export type MarriageApplicantResponseView = {
  applicationReference: string;
  respondingSpouseRole: SpouseRole;
  ownData: MarriageApplicant;
  partner: MarriagePartner;
  proposedMarriageDate?: string;
  officeName: string;
  correctionRequest?: MarriageCorrectionRequest;
};

// ---------------------------------------------------------------------------
// Divorce-notification / divorce-registration workflow types. This module
// begins only after a court or other competent authority has already
// granted the divorce — it registers a completed legal decision, never a
// court proceeding, so there is deliberately no "grounds", "custody",
// "maintenance" or "property division" field anywhere below (spec §1).
//
// Two entities, mirroring birth/death's notification-then-registration split
// rather than marriage's single-application model, because divorce
// genuinely has an inbound-notice concept the other two-party workflow
// doesn't (a simulated court integration pushing case data in — spec §5A):
// - DivorceNotification: a court's mock notification, validated then
//   converted into a DivorceRegistration (or returned/marked duplicate).
// - DivorceRegistration: the actual case file, used for every submission
//   source (court-converted, applicant, both-former-spouses, interested
//   person, staff-assisted, foreign) — reuses shared shapes (EvidenceItem,
//   VerificationState, IdentityDocumentType, DuplicateMatchLevel,
//   ReviewSectionStatus, DeathSyncAttempt, MarriageManualReviewAssignment)
//   the same way marriage/death do.
//
// Critical integration point (spec §1, §23): a divorce registration must
// NEVER delete or overwrite the original MarriageApplication — it only (a)
// flips that record's registrationEvent-linked MarriageRelationship.status
// to "DISSOLVED" and (b) flips each former spouse's own
// FoundationalIdentity.maritalStatus to "DIVORCED", exactly mirroring how
// crvsMarriageSdidSync.ts already never merges identities or deletes prior
// history when it sets maritalStatus to "MARRIED".

export type DivorceSubmissionSource =
  | "APPLICANT"
  | "BOTH_FORMER_SPOUSES"
  | "INTERESTED_PERSON"
  | "COURT_NOTIFICATION"
  | "STAFF_ASSISTED"
  | "FOREIGN_DECISION";

export type DivorceNotificationStatus =
  | "RECEIVED"
  | "VALIDATION_PENDING"
  | "VALIDATED"
  | "RETURNED"
  | "CONVERTED_TO_REGISTRATION"
  | "DUPLICATE"
  | "CANCELLED";

export type DivorceRegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "JUDGMENT_VERIFICATION"
  | "FOREIGN_JUDGMENT_REVIEW"
  | "EXCEPTION_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REGISTERED"
  | "CANCELLED";

export type JudgmentVerificationStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "VERIFIED"
  | "UNVERIFIED"
  | "CONFLICT_FOUND"
  | "MANUAL_REVIEW";

/** Per-spouse SDID sync sub-status — same shape as MarriageSpouseSdidSyncStatus,
 * only the success terminal's meaning differs (marital status flips to
 * DIVORCED rather than MARRIED, and the existing relationship is dissolved
 * rather than a new one created). */
export type DivorceSpouseSdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "IDENTITY_UPDATED"
  | "FAILED"
  | "MANUAL_REVIEW";

/** Case-level aggregate, derived from both former spouses' sub-statuses via
 * aggregateDivorceSyncStatus() — never assigned directly. */
export type DivorceSdidSyncStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "BOTH_IDENTITIES_UPDATED"
  | "PARTIAL_FAILURE"
  | "FAILED"
  | "MANUAL_REVIEW";

export type FormerSpouseKey = "SPOUSE1" | "SPOUSE2";

export type DivorceApplicantRelationship =
  | "FORMER_SPOUSE_1"
  | "FORMER_SPOUSE_2"
  | "BOTH_FORMER_SPOUSES"
  | "INTERESTED_PERSON"
  | "STAFF";

export type DivorceApplicant = {
  documentType: IdentityDocumentType;
  documentNumber?: string;
  nin?: string;
  sdidIdentityId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  residence?: string;
  phone?: string;
  email?: string;
  relationshipToCase: DivorceApplicantRelationship;
  // Required whenever relationshipToCase is not one of the two former
  // spouses (spec §2 "authorization basis where the applicant is not one of
  // the spouses").
  authorizationBasis?: string;
  identityVerification: VerificationState;
};

export type ExistingMarriageMatchStatus = "NOT_SEARCHED" | "MATCHED" | "MULTIPLE_CANDIDATES" | "NOT_FOUND";

export type ExistingMarriageSearchCriteria = {
  marriageRegistrationNumber?: string;
  marriageCertificateNumber?: string;
  spouse1Nin?: string;
  spouse2Nin?: string;
  spouse1Name?: string;
  spouse2Name?: string;
  marriageDate?: string;
  marriagePlace?: string;
};

export type ExistingMarriageCandidate = {
  // Links back to a real MarriageApplication.id in demo data whenever the
  // registered marriage exists there — undefined only for hand-authored
  // NOT_FOUND-path evidence.
  marriageApplicationId?: string;
  registrationNumber: string;
  marriageDate: string;
  marriagePlace?: string;
  spouse1Name: string;
  spouse2Name: string;
  officeName?: string;
  matchConfidence: "LOW" | "MEDIUM" | "HIGH";
};

/** Spec §3 Step 3 — the applicant must select a verified ACTIVE marriage
 * before continuing; if it cannot be found, the case routes to a
 * MARRIAGE_RECORD_NOT_FOUND exception rather than fabricating an unverified
 * marriage record. */
export type ExistingMarriageMatch = {
  status: ExistingMarriageMatchStatus;
  searchedAt?: string;
  searchedBy?: string;
  searchCriteria?: ExistingMarriageSearchCriteria;
  candidates: ExistingMarriageCandidate[];
  selected?: ExistingMarriageCandidate;
  notFoundEvidence: DivorceEvidence[];
};

export type FormerSpouse = {
  spouseKey: FormerSpouseKey;
  sdidIdentityId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nin?: string;
  documentType?: IdentityDocumentType;
  documentNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  sex: Sex;
  phone?: string;
  email?: string;
  currentCivilStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  identityMatchConfidence: "NO_MATCH" | "LOW_CONFIDENCE" | "PROBABLE" | "CONFIRMED";
  identityVerification: VerificationState;
  linkedToSelectedMarriage: boolean;
};

export type DivorceDecisionType = "MUTUAL_CONSENT" | "CONTESTED" | "DEFAULT_JUDGMENT" | "OTHER";

/** Deliberately narrow — captures only what's needed to register a decision
 * already made by a court, never grounds, custody, maintenance or property
 * division narrative (spec §1, §6 "do not collect unnecessary narrative
 * concerning allegations or private court testimony"). */
export type DivorceJudgment = {
  country: string;
  courtOrAuthorityName: string;
  courtCaseNumber: string;
  judgmentNumber: string;
  judgmentDate: string;
  finalityDate?: string;
  decisionType: DivorceDecisionType;
  registrationEffectiveDate?: string;
  courtRegistryReference?: string;
  verificationSource?: string;
  notesForStaff?: string;
  isForeign: boolean;
};

export type JudgmentVerificationRuleKey =
  | "COURT_REFERENCE"
  | "JUDGMENT_AUTHENTICITY_PLACEHOLDER"
  | "JUDGMENT_FINALITY"
  | "MARRIAGE_MATCH"
  | "FORMER_SPOUSE_1_IDENTITY"
  | "FORMER_SPOUSE_2_IDENTITY"
  | "EXISTING_CIVIL_STATUS"
  | "DUPLICATE_DIVORCE"
  | "COURT_REFERENCE_DUPLICATE"
  | "JUDGMENT_NUMBER_DUPLICATE"
  | "CONFLICTING_ACTIVE_MARRIAGE"
  | "POSSIBLE_ANNULMENT"
  | "POSSIBLE_JUDICIAL_SEPARATION"
  | "FOREIGN_JUDGMENT_REVIEW_REQUIRED"
  | "JURISDICTION"
  | "MAKER_CHECKER"
  | "CONFLICT_OF_INTEREST";

/** One discrete rule outcome — spec §8 "must not show a single generic
 * 'verified' result; display each rule separately." */
export type JudgmentVerificationRuleResult = {
  rule: JudgmentVerificationRuleKey;
  passed: boolean;
  severity: "BLOCKING" | "REVIEW" | "INFO";
  message: string;
};

export type JudgmentVerification = {
  status: JudgmentVerificationStatus;
  checkedAt?: string;
  checkedBy?: string;
  results: JudgmentVerificationRuleResult[];
  overallOutcome?: "VERIFIED" | "REQUIRES_CORRECTION" | "REQUIRES_EXCEPTION" | "UNVERIFIED";
};

export type ForeignDivorceRecognitionStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "REQUIREMENTS_SATISFIED"
  | "REQUIRES_LEGAL_REVIEW"
  | "REJECTED";

/** Spec §5D/§19 — a frontend policy workflow only; never claims to make a
 * binding legal determination beyond this configured demo process. */
export type ForeignDivorceRecognition = {
  status: ForeignDivorceRecognitionStatus;
  country: string;
  foreignCourtOrAuthority: string;
  spouse1Nationality?: string;
  spouse2Nationality?: string;
  translationRequired: boolean;
  translationProvided: boolean;
  authenticationRequired: boolean;
  authenticationProvided: boolean;
  exequaturOrRecognitionRequired: boolean;
  exequaturOrRecognitionProvided: boolean;
  missingRequirements: string[];
  supervisorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type DivorceEvidence = EvidenceItem;

export type DivorceReviewSectionKey =
  | "APPLICANT"
  | "EXISTING_MARRIAGE"
  | "FORMER_SPOUSE_1"
  | "FORMER_SPOUSE_2"
  | "COURT_DECISION"
  | "EVIDENCE"
  | "IDENTITY_CHECKS"
  | "PROCESSING_OFFICE"
  | "OFFICER_DECLARATION";

export const emptyDivorceReviewSections = (): Record<DivorceReviewSectionKey, ReviewSectionStatus> => ({
  APPLICANT: "NOT_REVIEWED",
  EXISTING_MARRIAGE: "NOT_REVIEWED",
  FORMER_SPOUSE_1: "NOT_REVIEWED",
  FORMER_SPOUSE_2: "NOT_REVIEWED",
  COURT_DECISION: "NOT_REVIEWED",
  EVIDENCE: "NOT_REVIEWED",
  IDENTITY_CHECKS: "NOT_REVIEWED",
  PROCESSING_OFFICE: "NOT_REVIEWED",
  OFFICER_DECLARATION: "NOT_REVIEWED",
});

export type DivorceReviewDecisionType =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CORRECTION"
  | "ROUTE_JUDGMENT_VERIFICATION"
  | "ROUTE_FOREIGN_REVIEW"
  | "ROUTE_EXCEPTION";

export type DivorceReview = {
  type: DivorceReviewDecisionType;
  decidedBy: string;
  decidedAt: string;
  reason?: string;
  note?: string;
  // Both set true only on APPROVE — the Registrar's explicit maker-checker
  // confirmation (spec §4/§17/§21) plus a declared conflict-of-interest
  // check, required in addition to the automatic canApproveDivorceCase()
  // gate, never instead of it.
  confirmedDidNotPrepare?: boolean;
  confirmedNoConflictOfInterest?: boolean;
};

export type DivorceCorrectionItem = {
  id: string;
  section: DivorceReviewSectionKey;
  fields: string[];
  reason: string;
  note?: string;
  documentsRequired: boolean;
  dueDate?: string;
  addressed: boolean;
  response?: string;
};

export type DivorceCorrectionRequest = {
  id: string;
  requestedBy: string;
  requestedAt: string;
  items: DivorceCorrectionItem[];
  responseDeadline?: string;
  notifyApplicants: boolean;
  resolvedAt?: string;
  // Public /civil-registration/divorce/respond/:token route looks the
  // registration up by this token rather than requiring a staff sign-in.
  responseToken: string;
};

export type DivorceExceptionType =
  | "MARRIAGE_RECORD_NOT_FOUND"
  | "IDENTITY_NOT_FOUND_ONE"
  | "IDENTITY_NOT_FOUND_BOTH"
  | "MARRIAGE_IDENTITY_MISMATCH"
  | "DUPLICATE_DIVORCE"
  | "JUDGMENT_NUMBER_DUPLICATE"
  | "JUDGMENT_NOT_FINAL"
  | "COURT_DETAILS_CANNOT_BE_VERIFIED"
  | "CONFLICTING_MARITAL_STATUS"
  | "EXISTING_ANNULMENT"
  | "EXISTING_JUDICIAL_SEPARATION"
  | "FOREIGN_DOCUMENT_ISSUE"
  | "WRONG_PROCESSING_OFFICE"
  | "LATE_REGISTRATION"
  | "APPLICANT_AUTHORITY_UNCLEAR"
  | "SDID_RELATIONSHIP_MISSING"
  | "OTHER";

export type DivorceExceptionRecord = {
  type: DivorceExceptionType;
  reason: string;
  triggeringRule?: string;
  affectedData?: string;
  assignedTo?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  resolution?: {
    type: string;
    reason: string;
    note?: string;
    nextStatus: DivorceRegistrationStatus;
    resolvedBy: string;
    resolvedAt: string;
  };
};

/** Immutable snapshot written the moment a registration transitions to
 * REGISTERED (spec §21/§22 "the registered record must be read-only") —
 * later legal changes go through the general CRVS rectification workflow,
 * never a direct edit of this event. */
export type DivorceRegistrationEvent = {
  id: string;
  registrationNumber: string;
  registeredAt: string;
  registeredBy: string;
  registeredByName: string;
  officeId: string;
  officeName: string;
  effectiveDate: string;
  courtCaseNumber: string;
  judgmentNumber: string;
  marriageRegistrationReference: string;
  formerSpouse1Summary: { firstName?: string; lastName?: string };
  formerSpouse2Summary: { firstName?: string; lastName?: string };
};

/** Records the effect of registration on the existing MarriageApplication —
 * spec §11/§21 "update the existing marriage record... never delete the
 * original". Applied to the marriage record itself (status ->
 * DISSOLVED_BY_DIVORCE) by demoRegisterDivorce(); this is a receipt of that
 * mutation, not a duplicate of the marriage record. */
export type MarriageStatusUpdateResult = {
  applied: boolean;
  marriageApplicationId?: string;
  marriageApplicationReference?: string;
  previousStatus?: string;
  newStatus: "DISSOLVED_BY_DIVORCE";
  updatedAt: string;
  divorceRegistrationReference: string;
};

/** Per-former-spouse SDID sync sub-record — shape mirrors
 * SdidMarriageSpouseSyncRecord/SdidDeathSyncRecord. */
export type SdidDivorceSpouseSyncRecord = {
  status: DivorceSpouseSdidSyncStatus;
  idempotencyKey?: string;
  attempts: DeathSyncAttempt[];
  lastAttemptAt?: string;
  lastFailureCode?: string;
  linkedFoundationalIdentityId?: string;
  linkedNin?: string;
  manualReview?: MarriageManualReviewAssignment;
  completedAt?: string;
};

/** Case-level aggregate wrapping both former spouses' independent sync
 * sub-records (spec §23: "create separate updates for both former
 * spouses"). `status` is derived via aggregateDivorceSyncStatus() in
 * crvsDivorceSdidSync.ts, never assigned directly. */
export type SDIDDivorceSync = {
  status: DivorceSdidSyncStatus;
  spouse1: SdidDivorceSpouseSyncRecord;
  spouse2: SdidDivorceSpouseSyncRecord;
  // Whether the existing MarriageRelationship (on both identities) has been
  // flipped from ACTIVE to DISSOLVED — spec §23 "end the active marriage
  // relationship using the divorce effective date... do not delete the
  // former spouse relationship."
  relationshipDissolved?: boolean;
  manualReview?: MarriageManualReviewAssignment;
};

export type DivorceCertificateEligibilityStatus = "NOT_CHECKED" | "ELIGIBLE" | "INELIGIBLE" | "MANUAL_REVIEW";

export type DivorceCertificateEligibility = {
  status: DivorceCertificateEligibilityStatus;
  checkedAt?: string;
  reasons: string[];
};

/** Presentation-shape mirror of DemoAuditEvent, scoped to the divorce
 * workflow — the actual store is the same shared db.auditEvents collection
 * written by logCrvsAudit(). */
export type DivorceAuditEntry = {
  id: string;
  actor: string;
  action: string;
  module: string;
  targetRef: string;
  at: string;
  details?: string;
};

export type DivorceRejectionReason = {
  reason: string;
  explanation: string;
  evidenceRefs: string[];
  applicantsNotified: boolean;
};

export type DivorceRegistrationStatusHistoryEntry = {
  status: DivorceRegistrationStatus;
  at: string;
  by: string;
  note?: string;
};

export type DivorceProcessingOfficeJurisdictionResult = "CONFIRMED" | "ALTERNATIVE_REQUIRES_REASON" | "UNRESOLVED";

export type DivorceProcessingOffice = {
  marriageRegisteredOfficeName?: string;
  applicantDomicileOfficeName?: string;
  selectedProcessingOfficeId: string;
  selectedProcessingOfficeName: string;
  embassyOrForeignOfficePath: boolean;
  jurisdictionResult: DivorceProcessingOfficeJurisdictionResult;
  alternativeReason?: string;
};

export type DivorceRegistration = {
  id: string;
  reference: string;
  status: DivorceRegistrationStatus;
  source: DivorceSubmissionSource;
  // Set only when source === "COURT_NOTIFICATION" — links back to the
  // DivorceNotification this case was converted from (spec §14 "convert to
  // registration").
  sourceNotificationId?: string;
  sourceNotificationReference?: string;

  applicant: DivorceApplicant;
  existingMarriage: ExistingMarriageMatch;
  formerSpouse1: FormerSpouse;
  formerSpouse2: FormerSpouse;

  judgment: DivorceJudgment;
  judgmentVerification: JudgmentVerification;
  // Present whenever judgment.isForeign is true (spec §5D/§19) — created
  // empty (status NOT_APPLICABLE) otherwise rather than left undefined, so
  // the foreign-review tab always has a stable shape to render.
  foreignRecognition: ForeignDivorceRecognition;

  evidence: DivorceEvidence[];

  processingOffice: DivorceProcessingOffice;
  jurisdiction: string;

  reviewSections: Record<DivorceReviewSectionKey, ReviewSectionStatus>;
  reviewerId?: string;
  reviewerName?: string;
  reviewLockedAt?: string;
  reviewDecisions: DivorceReview[];

  correctionRequests: DivorceCorrectionRequest[];
  exception?: DivorceExceptionRecord;

  officerId: string;
  officerName: string;
  accuracyDeclarationConfirmed: boolean;
  authorityToSubmitConfirmed: boolean;
  judgmentFinalConfirmed: boolean;
  privacyAcknowledged: boolean;
  electronicSubmissionConfirmed: boolean;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  registeredAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: DivorceRejectionReason;
  cancelledAt?: string;
  cancellationReason?: string;

  registrationEvent?: DivorceRegistrationEvent;
  marriageStatusUpdate?: MarriageStatusUpdateResult;

  sdid: SDIDDivorceSync;
  certificateEligibility?: DivorceCertificateEligibility;

  statusHistory: DivorceRegistrationStatusHistoryEntry[];
  version: number;
};

/** A simulated court-integration notice (spec §5A) — never a real court API
 * call, always this typed mock shape. Validated then either converted into
 * a DivorceRegistration, returned to the (simulated) court contact, or
 * marked a duplicate of an existing notification/registration. */
export type DivorceNotification = {
  id: string;
  reference: string;
  status: DivorceNotificationStatus;
  courtName: string;
  courtCaseNumber: string;
  judgmentNumber: string;
  judgmentDate: string;
  finalityDate?: string;
  applicantNamesAsReported: string;
  marriageReferenceAsReported?: string;
  signedJudgmentDocument?: DivorceEvidence;
  notifiedAt: string;
  marriageMatch: ExistingMarriageMatch;
  duplicateWarning: boolean;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  validationNotes?: string;
  returnReason?: { reason: string; note?: string };
  convertedRegistrationId?: string;
  convertedRegistrationReference?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: DivorceNotificationStatus; at: string; by: string; note?: string }[];
  version: number;
};

/** Redacted projection for the unauthenticated public tracking page (spec
 * §11 — must never reveal private judgment narrative, restricted
 * attachments, internal staff notes, audit metadata, or sensitive
 * information about the other former spouse). */
export type DivorcePublicTrackingView = {
  reference: string;
  status: DivorceRegistrationStatus;
  submittedAt?: string;
  processingOfficeName: string;
  timeline: { status: DivorceRegistrationStatus; label: string; at?: string }[];
  hasOpenCorrection: boolean;
  additionalEvidenceRequested: boolean;
  applicantActionRequired: boolean;
  registrationCompleted: boolean;
  certificateEligible: boolean;
  nextAction: string;
};

/** Scoped projection for the token-based /respond/:token page — the
 * requested corrections plus only the originally submitted values needed to
 * respond, never the full case file. */
export type DivorceApplicantResponseView = {
  registrationReference: string;
  correctionRequest?: DivorceCorrectionRequest;
  applicant: DivorceApplicant;
  evidence: DivorceEvidence[];
};
