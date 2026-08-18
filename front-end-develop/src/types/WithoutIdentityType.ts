export type WithoutIdentityType = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: string;
  maritalStatus: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  middleName?: string;
  dob: string;
  referalName?: string;
  referalPhoneNumber?: string;
  referalNid?: string;
  address?: any;
  supportingDocuments?: {
    name: string;
    url: string;
  };
  placeOfBirth: string;
  fatherNames?: string;
  motherNames?: string;
  spouseName: string;
  typeOfRwandanNationality?: string;
  otherNationality?: string;
  motherIDNumber?: string;
  fatherIDNumber?: string;
  dialCode?: string;
  spouseIDNumber?: string;
  residentCountry?: {
    label: string;
    value: string;
  };
  residentProvince?: {
    label: string;
    value: string;
  };
  residentDistrict?: {
    label: string;
    value: string;
  };
  residentSector?: {
    label: string;
    value: string;
  };
  residentCell?: {
    label: string;
    value: string;
  };
  residentVillage?: {
    label: string;
    value: string;
  };
  phoneNumberCountry?: {
    label: string;
    value: string;
  };

  referralPhoneNumberCountry?: {
    label: string;
    value: string;
  };
  otherName?: string;
};
