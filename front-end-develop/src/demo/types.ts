import type {
  BirthNotification,
  BirthRegistrationCase,
  FoundationalIdentity,
  BirthCertificateRequest,
  DemoBirthCertificate,
  CertificateConfig,
  DeathNotification,
  DeathRegistrationCase,
} from "@/domain/crvs/types";

export type {
  BirthNotification,
  BirthRegistrationCase,
  FoundationalIdentity,
  BirthCertificateRequest,
  DemoBirthCertificate,
  CertificateConfig,
  DeathNotification,
  DeathRegistrationCase,
};

export type DemoRole =
  | "administrator"
  | "enrolment_officer"
  | "reviewer"
  | "supervisor";

export type DemoAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: DemoRole;
  centerId: string;
  status: "active" | "inactive";
  phoneNumber: string;
  createdAt: string;
};

export type DemoCenter = {
  id: string;
  name: string;
  region: string;
  district: string;
  address: string;
  phoneNumber: string;
  status: "active" | "inactive";
};

export type DemoDeviceType =
  | "laptop"
  | "fingerprint"
  | "iris"
  | "camera"
  | "signature_pad";

export type DemoDevice = {
  id: string;
  serialNumber: string;
  type: DemoDeviceType;
  centerId: string;
  status: "active" | "inactive" | "maintenance";
  assignedAt: string;
};

export type DemoApplicant = {
  id: string;
  identityNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female";
  citizenshipStatus: "citizen" | "resident" | "refugee";
  phoneNumber: string;
  email: string;
  region: string;
  district: string;
  localArea: string;
  photo?: string;
};

export type DemoApplicationType =
  | "digitalIdentityPreEnrolment"
  | "birthRegistration"
  | "deathRegistration"
  | "marriageRegistration"
  | "certificateRequest"
  | "recordCorrection";

export type DemoApplicationStatus =
  | "draft"
  | "submitted"
  | "pendingReview"
  | "inProgress"
  | "awaitingInfo"
  | "exception"
  | "approved"
  | "rejected"
  | "offlinePending"
  | "rolledBack"
  | "completed";

export type DemoStatusHistoryEntry = {
  status: DemoApplicationStatus;
  at: string;
  by: string;
  note?: string;
};

export type DemoReviewComment = {
  by: string;
  at: string;
  comment: string;
};

export type DemoDocument = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
};

export type DemoFamilyMember = {
  relationship: "mother" | "father" | "guardian" | "spouse";
  firstName: string;
  lastName: string;
  identityNumber?: string;
};

export type DemoBiometricsStatus =
  | "notStarted"
  | "inProgress"
  | "captured"
  | "poorQuality"
  | "deviceError";

export type DemoApplication = {
  id: string;
  reference: string;
  applicantId: string;
  type: DemoApplicationType;
  status: DemoApplicationStatus;
  submittedAt: string;
  centerId: string;
  officerId: string;
  reviewerId?: string;
  address: { region: string; district: string; localArea: string };
  familyMembers: DemoFamilyMember[];
  documents: DemoDocument[];
  appointmentId?: string;
  biometricsStatus: DemoBiometricsStatus;
  reviewComments: DemoReviewComment[];
  statusHistory: DemoStatusHistoryEntry[];
  processingDays?: number;
  exceptionReason?: string;
  syncedToCentral?: boolean;
};

export type DemoAppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "transferred";

export type DemoAppointment = {
  id: string;
  applicationId: string;
  applicantName: string;
  date: string;
  time: string;
  centerId: string;
  officerId: string;
  status: DemoAppointmentStatus;
  transferHistory: { fromCenterId: string; toCenterId: string; at: string }[];
};

export type DemoNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetRole?: DemoRole;
};

export type DemoAuditEvent = {
  id: string;
  actor: string;
  action: string;
  module: string;
  targetRef: string;
  at: string;
  details?: string;
};

export type DemoAnalyticsMonth = {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  avgProcessingDays: number;
};

export type DemoDatabase = {
  version: string;
  accounts: DemoAccount[];
  centers: DemoCenter[];
  devices: DemoDevice[];
  applicants: DemoApplicant[];
  applications: DemoApplication[];
  appointments: DemoAppointment[];
  notifications: DemoNotification[];
  auditEvents: DemoAuditEvent[];
  analytics: DemoAnalyticsMonth[];
  crvsNotifications: BirthNotification[];
  crvsRegistrations: BirthRegistrationCase[];
  crvsFoundationalIdentities: FoundationalIdentity[];
  crvsCertificateRequests: BirthCertificateRequest[];
  crvsCertificates: DemoBirthCertificate[];
  crvsCertificateConfig: CertificateConfig;
  crvsDeathNotifications: DeathNotification[];
  crvsDeathRegistrations: DeathRegistrationCase[];
};
