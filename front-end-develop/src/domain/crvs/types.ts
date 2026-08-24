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
