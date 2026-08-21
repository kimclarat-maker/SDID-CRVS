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
  identityStatus: "MINOR_ACTIVE";
  biometrics: "NOT_REQUIRED_FOR_NEWBORN";
  credential: "NOT_ISSUED";
  source: "CRVS_BIRTH_RECORD";
  createdAt: string;
  idempotencyKey: string;
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
