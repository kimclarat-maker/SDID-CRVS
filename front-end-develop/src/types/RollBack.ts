export interface RollBack {
  _id: string;
  requestType: string;
  preEnrollmentTempId: string;
  applicationNumber: string;
  center: {
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
  reviewer: {
    firstName: string;
    lastName: string;
    idNumber: string;
  } | null;
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
}

export type GETParameters = {
  offset: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  center?: string;
  [key: string]: any;
};
