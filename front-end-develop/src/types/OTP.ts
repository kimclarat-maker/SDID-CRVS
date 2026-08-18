export interface AddressType {
  name: string;
  id: string;
  code: string;
  value?: string;
  label?: string;
}

export type OTPType = {
  code: string;
  province?: AddressType | null;
  district?: AddressType | null;
  sector?: AddressType | null;
  cell?: AddressType | null;
  village?: AddressType | null;
  center?: AddressType | null;
};

export type SendOTPType = {
  type: string | "phone" | "email";
  phoneNumber?: string;
  emailAddress?: string;
  preEnrollmentTempId?: string;
  legalGuardianId?: string;
  phoneNumberKey?: string;
  maskedPhoneNumberKey?: string;
};

export type VerifyOTPType = {
  type?: string | "phone" | "email";
  phoneNumber?: string;
  emailAddress?: string;
  code: string;
  preEnrollmentTempId: string;
  phoneNumberKey?: string;
  maskedPhoneNumberKey?: string;
};

export type SkipVerificationCodeWithExisting = {
  preEnrollmentTempId: string;
  phoneNumber?: string;
  selfie: string;
  phoneNumberKey?: string;
};
