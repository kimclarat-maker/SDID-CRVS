import { PlatformConfig } from "@/types/PlatformConfig";

const FEE_PLACEHOLDER = "Defined by the responsible authority.";
const PROCESSING_TIME_PLACEHOLDER = "Defined by the responsible authority.";

export const genericDeploymentConfig: PlatformConfig = {
  platformName: "Legal Identity Services Platform",
  platformShortName: "LISP",
  countryName: "Configured Country",
  identitySystemName: "Digital Identity",
  civilRegistrationSystemName: "Civil Registration",
  authorities: {
    platformAuthority: "Configured Platform Authority",
    civilRegistrationAuthority:
      "Configured Civil Registration and Vital Statistics Authority",
    identityAuthority: "Configured Digital Identity Authority",
  },
  logo: {
    src: "/public-assets/platform-logo.svg",
    alt: "Legal Identity Services Platform",
  },
  languages: [{ code: "en", label: "English", translationKey: "en" }],
  defaultLanguage: "en",
  identityNumberLabel: "National Identity Number",
  // 5 levels to match the underlying administrative-area data model
  // (currently implemented end-to-end as province/district/sector/cell/village);
  // only the display labels are neutral here, not the data structure.
  administrativeAreaHierarchy: [
    { key: "level1", label: "Region" },
    { key: "level2", label: "District" },
    { key: "level3", label: "Sub-district" },
    { key: "level4", label: "Ward" },
    { key: "level5", label: "Locality" },
  ],
  contact: {
    callCenterNumber: "Defined by the responsible authority",
    email: "Defined by the responsible authority",
    address: "Defined by the responsible authority",
    hoursOfOperation: "Defined by the responsible authority",
  },
  services: [
    {
      id: "digitalIdentityPreEnrolment",
      enabled: true,
      nameKey: "digitalIdentityPreEnrolment",
      descriptionKey: "digitalIdentityPreEnrolment",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
    {
      id: "birthRegistration",
      enabled: true,
      nameKey: "birthRegistration",
      descriptionKey: "birthRegistration",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
    {
      id: "deathRegistration",
      enabled: true,
      nameKey: "deathRegistration",
      descriptionKey: "deathRegistration",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
    {
      id: "marriageRegistration",
      enabled: true,
      nameKey: "marriageRegistration",
      descriptionKey: "marriageRegistration",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
    {
      id: "certificateRequest",
      enabled: true,
      nameKey: "certificateRequest",
      descriptionKey: "certificateRequest",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
    {
      id: "recordCorrection",
      enabled: true,
      nameKey: "recordCorrection",
      descriptionKey: "recordCorrection",
      feeDescription: FEE_PLACEHOLDER,
      processingTimeDescription: PROCESSING_TIME_PLACEHOLDER,
      waiverDescription: FEE_PLACEHOLDER,
    },
  ],
  featureFlags: {
    enableApplicationTracking: true,
    enableDocumentVerification: true,
    enableServiceCentreFinder: true,
    enableComplaintsChannel: true,
    enableStaffSignInLink: true,
    enableCameraDevTools: false,
  },
};
