export interface EnrollmentType {
  _id: string;
  requestType: string;
  preEnrollmentTempId: string;
  enrollmentNumber: string;
  applicationNumber: string;
  enrollmentCenter: {
    _id: string;
    name: string;
  };
  maskedPhoneNumbers: {
    key: string;
    value: string;
  }[];
  requestNo: string;
  preEnrollmentNumber: string;
  preEnrollmentDate: string;
  applicantCategory: string;
  documentType: string;
  identifier: string;
  idNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string; //"MALE" | "FEMALE";
  maritalStatus: string; //"SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  spouse: string | null;
  phoneNumber: string;
  email: string | null;
  referalName: string | null;
  referalPhoneNumber: string | null;
  referalNid: string | null;
  address: string | null;
  dob: string;
  placeOfBirth: string;
  countryOfBirth: string | null;
  nationality: string;
  countryOfDomicile: string;
  otherNationality: string | null;
  typeOfRwandanNationality: string;
  fatherNames: string;
  fatherIDNumber: string;
  motherNames: string;
  motherIDNumber: string;
  country: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  countryDetail: {
    id: string;
    name: string;
    code: string;
  };
  provinceDetail: {
    id: string;
    name: string;
    code: string;
  };
  districtDetail: {
    id: string;
    name: string;
    code: string;
  };
  sectorDetail: {
    id: string;
    name: string;
    code: string;
  };
  cellDetail: {
    id: string;
    name: string;
    code: string;
  };
  village_detail: {
    village_leader_mob_no: string | null;
    village_leader_name: string | null;
    village_name: string;
    village_sno: string;
    village_code: string;
  };
  centerId: string | null;
  supportingDocuments: {
    name: string;
    url: string | null;
    id: string | null;
  }[];
  selfie: string;
  status: string; //"APPROVED" | "PENDING" | "REJECTED";
  selfieVerificationSkipStatus: string | null;

  rejectComment: string | null;
  spouseIDNumber: string | null;
  residentialAddress: string | null;
  placeOfRegistration: string | null;
  createdAt: string;
  requestForChangeFields: string[] | null;
  requestForChangeComment: string | null;
  modifiedDate: string;
  digitalAmbassadorNid: string;
  digitalAmbassador: {
    id: string;
    first_name: string;
    last_name: string;
    center: string;
    id_number: string;
    center_name: string;
    center_location: string;
  };
  language: string;
  selfieVerificationSkipRequestedAt: string | null;
  selfieVerificationSkipApprovedAt: string | null;
  selfieVerificationSkipRejectedAt: string | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  reviewCompletedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  residentialCountryCode: string;
  residentialProvinceCode: string;
  residentialDistrictCode: string;
  residentialSectorCode: string;
  residentialCellCode: string;
  residentialVillageCode: string;
  citizenshipStatus: string;
  documentIssueDate: string | null;
  documentExpiryDate: string | null;
  legalGuardianId: string | null;
  legalGuardianDocumentTypeDetail: string | null;
  legalGuardianIdentifier: string | null;
  legalGuardianSelfie: string | null;
  consent: boolean | null;
  postedFrom: string | null;
  externalApplicationNo: string | null;
  residentialCountry: {
    _id: string;
    name: string;
    code: string;
  };
  residentialProvince: {
    _id: string;
    name: string;
    code: string;
  };
  residentialDistrict: {
    _id: string;
    name: string;
    code: string;
  };
  residentialSector: {
    _id: string;
    name: string;
    code: string;
  };
  residentialCell: {
    _id: string;
    name: string;
    code: string;
  };
  residentialVillage: {
    _id: string;
    name: string;
    code: string;
  };
  biometrics: any;
  biometric: any;
  preEnrollmentId?: string;
  specification?: any;
  operator: {
    _id: string;
    name: string;
  };
  officer?: any;
  enrollmentStatus: string;
  approverSelfieSkipStatus?: string;
  approverSelfieSkipCode?: string;
  approverSelfieForSkip?: string;
  approverSelfieSkipExpiresAt?: string;
  approverSelfieSkipRequestedAt?: string;
  approverSelfieSkipRejectedComment?: string;
  biometricCaptureDate?: string;
  biometricRefreshStatus?: string;
  age?: number;
  syncedToCentral?: boolean;
  isStartedOnline?: boolean;
  syncSource?: string;
  isDiplomat?: boolean;

  // SDID Core sync state
  sdidCoreStatus?: string;
  syncedToCore?: boolean;
  syncedToCoreAt?: string;
  corePushError?: string;
  corePushRetryCount?: number;
  applicantPublicSdin?: string;
  sdidCoreObservationDecisionComment?: string[];
  sdidCoreBiometricQualityIssue?: boolean;
}

export type GETParameters = {
  offset?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  center?: string;
  preEnrollmentNumber?: string;
  preEnrollmentId?: string;
  enrollmentNumber?: string;
  [key: string]: any;
};

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Landmark {
  type?: string;
  x: number;
  y: number;
}

export interface IcaoCompliance {
  passed: string[];
  failed: string[];
}

export interface LiveEnrollRequest {
  deviceId: string;
  checkIcao: boolean;
  detectLiveness: boolean;
  frameInterval: number;
  livenessMode:
    | "None"
    | "Passive"
    | "Active"
    | "PassiveAndActive"
    | "Simple"
    | "Custom"
    | "PassiveWithBlink";

  width: number;
  height: number;
  frameRate: number;
  mediaSubtype: number;

  // ───────── Advanced: Template & Token ─────────
  createTemplate?: boolean;
  templateSize: "Small" | "Medium" | "Large";
  tokenImageWidth?: number;
  tokenQualityThreshold?: number;

  // ───────── Position ─────────
  minInterOcularDistance?: number;
  maxRoll?: number;
  maxYaw?: number;
  maxPitch?: number;

  // ───────── Quality ─────────
  faceConfidenceThreshold?: number;
  additionalFacesThreshold?: number;
  qualityThreshold?: number;

  // ───────── Liveness ─────────
  livenessThreshold?: number;
  livenessConfidenceThreshold?: number;

  // ───────── Detection ─────────
  detectAllFeaturePoints?: boolean;
  determineGender?: boolean;
  determineAge?: boolean;
  detectProperties?: boolean;

  // ───────── Output ─────────
  createThumbnail?: boolean;
  thumbnailWidth?: number;

  // ───────── Corrections ─────────
  removeRedEyes?: boolean;
  removeBackground?: boolean;
}

export type LiveEnrollFrame = {
  bBox: Rect;
  detectionConfidence?: number;
  quality: number;
  yaw: number;
  pitch: number;
  roll: number;
  gender: number;
  attributes: Record<string, number>;
  landmarks: Landmark[];
  noseTip: Landmark;
  mouthCenter: Landmark;
  leftEyeCenter: Landmark;
  rightEyeCenter: Landmark;
  icaoWarnings: { passed: string[]; failed: string[] };
  imageBase64: string;
  templateBase64: string;
  tokenImageBase64: string;
  errorReason: string;
  livenessScore: number;
  livenessConfidence: number;
  livenessAction: string;
  livenessTargetPitch: number;
  livenessTargetYaw: number;
};

export type LiveEnrollComplete = LiveEnrollFrame & {};

export type LiveEnrollFailed = LiveEnrollFrame & {
  errorReason?: string;
};

export type LiveEnrollMessage =
  | { type: "frame"; payload: LiveEnrollFrame }
  | { type: "complete"; payload: LiveEnrollComplete }
  | { type: "failed"; payload: LiveEnrollFailed };

export type CameraFormatInfo = {
  width: number;
  height: number;
  frameRate: number;
  mediaSubtype: number;
  label: string;
};

export type CameraDeviceInfo = {
  id: string;
  displayName: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  formats: CameraFormatInfo[];
  label?: string;
  value?: string;
};
