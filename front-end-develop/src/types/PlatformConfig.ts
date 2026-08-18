export type SupportedLanguageCode = string;

export interface PlatformLanguage {
  code: SupportedLanguageCode;
  label: string;
  translationKey: string;
}

export interface AdministrativeAreaLevel {
  key: string;
  label: string;
}

export interface ContactInformation {
  callCenterNumber?: string;
  email?: string;
  address?: string;
  hoursOfOperation?: string;
}

export type VitalServiceId =
  | "digitalIdentityPreEnrolment"
  | "birthRegistration"
  | "deathRegistration"
  | "marriageRegistration"
  | "certificateRequest"
  | "recordCorrection";

export interface ServiceProcessConfig {
  id: VitalServiceId;
  enabled: boolean;
  nameKey: string;
  descriptionKey: string;
  feeDescription: string;
  processingTimeDescription: string;
  waiverDescription?: string;
}

export interface FeatureFlags {
  enableApplicationTracking: boolean;
  enableDocumentVerification: boolean;
  enableServiceCentreFinder: boolean;
  enableComplaintsChannel: boolean;
  enableStaffSignInLink: boolean;
  enableCameraDevTools: boolean;
}

export interface AuthorityNames {
  platformAuthority: string;
  civilRegistrationAuthority: string;
  identityAuthority: string;
}

export interface PlatformConfig {
  platformName: string;
  platformShortName: string;
  countryName: string;
  authorities: AuthorityNames;
  logo: {
    src: string;
    alt: string;
  };
  languages: PlatformLanguage[];
  defaultLanguage: SupportedLanguageCode;
  identityNumberLabel: string;
  administrativeAreaHierarchy: AdministrativeAreaLevel[];
  contact: ContactInformation;
  services: ServiceProcessConfig[];
  featureFlags: FeatureFlags;
}
