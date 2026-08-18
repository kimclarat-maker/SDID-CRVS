import { PlatformConfig } from "@/types/PlatformConfig";

/**
 * Optional deployment pack. Not used unless VITE_DEPLOYMENT=rwanda.
 * Kept isolated here so Rwanda-specific naming, geography and language
 * never appear as defaults on the country-neutral public site.
 */
export const rwandaDeploymentConfig: PlatformConfig = {
  platformName: "SDID-CRVS",
  platformShortName: "SDID",
  countryName: "Rwanda",
  authorities: {
    platformAuthority: "National Identification Agency (NIDA)",
    civilRegistrationAuthority:
      "National Civil Registration and Vital Statistics Authority",
    identityAuthority: "National Identification Agency (NIDA)",
  },
  logo: {
    src: "/public-assets/platform-logo.svg",
    alt: "SDID-CRVS Rwanda",
  },
  languages: [
    { code: "en", label: "English", translationKey: "en" },
    { code: "fr", label: "Français", translationKey: "fr" },
    { code: "rw", label: "Ikinyarwanda", translationKey: "rw" },
  ],
  defaultLanguage: "en",
  identityNumberLabel: "National ID Number (Indangamuntu)",
  administrativeAreaHierarchy: [
    { key: "province", label: "Province" },
    { key: "district", label: "District" },
    { key: "sector", label: "Sector" },
    { key: "cell", label: "Cell" },
    { key: "village", label: "Village" },
  ],
  contact: {
    callCenterNumber: "3500",
    email: "Defined by the responsible authority",
    address: "Kigali, Rwanda",
    hoursOfOperation: "Defined by the responsible authority",
  },
  services: [
    {
      id: "digitalIdentityPreEnrolment",
      enabled: true,
      nameKey: "digitalIdentityPreEnrolment",
      descriptionKey: "digitalIdentityPreEnrolment",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
    },
    {
      id: "birthRegistration",
      enabled: true,
      nameKey: "birthRegistration",
      descriptionKey: "birthRegistration",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
    },
    {
      id: "deathRegistration",
      enabled: true,
      nameKey: "deathRegistration",
      descriptionKey: "deathRegistration",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
    },
    {
      id: "marriageRegistration",
      enabled: true,
      nameKey: "marriageRegistration",
      descriptionKey: "marriageRegistration",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
    },
    {
      id: "certificateRequest",
      enabled: true,
      nameKey: "certificateRequest",
      descriptionKey: "certificateRequest",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
    },
    {
      id: "recordCorrection",
      enabled: true,
      nameKey: "recordCorrection",
      descriptionKey: "recordCorrection",
      feeDescription: "Defined by the responsible authority.",
      processingTimeDescription: "Defined by the responsible authority.",
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
