export interface PublicNavLink {
  label: string;
  href: string;
}

export interface PublicCommonContent {
  nav: {
    home: string;
    digitalIdentity: string;
    civilRegistration: string;
    certificates: string;
    track: string;
    verify: string;
    serviceCentres: string;
    help: string;
    staffSignIn: string;
    skipToContent: string;
    menu: string;
  };
  footer: {
    aboutHeading: string;
    aboutText: string;
    linksHeading: string;
    contactHeading: string;
    legalHeading: string;
    privacy: string;
    accessibility: string;
    complaints: string;
    copyright: string;
  };
  common: {
    learnMore: string;
    getStarted: string;
    startNow: string;
    readMore: string;
    backToHome: string;
    languageSelectorLabel: string;
  };
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  meta?: string;
}

export interface HeroSlide {
  video: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  heroSlides: HeroSlide[];
  about: {
    eyebrow: string;
    index: string;
    heading: string;
    stats: {
      value: string;
      label: string;
      description: string;
    }[];
  };
  serviceShowcase: {
    eyebrow: string;
    index: string;
    heading: string;
    viewAllLabel: string;
    viewAllHref: string;
    tags: string[];
    moreTagsLabel: string;
    items: {
      title: string;
      description: string;
      href: string;
    }[];
  };
  serviceCards: ServiceCard[];
  popularServices: {
    heading: string;
    intro: string;
    items: ServiceCard[];
  };
  trackShortcut: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  verifyShortcut: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  howSdidCrvsWorkTogether: {
    heading: string;
    body: string[];
  };
  howItWorks: {
    heading: string;
    steps: { title: string; description: string }[];
  };
  requirementsFeesProcessing: {
    heading: string;
    intro: string;
    items: { title: string; description: string }[];
  };
  serviceCentreFinderPreview: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  trustSection: {
    heading: string;
    points: { title: string; description: string }[];
  };
  notices: {
    heading: string;
    items: { title: string; message: string; type: "info" | "warning" }[];
  };
}

export interface ServicePageFaq {
  question: string;
  answer: string;
}

export interface ServicePageContent {
  id: string;
  title: string;
  summary: string;
  description: string;
  whoMayApply: string[];
  eligibility: string[];
  requiredEvidence: string[];
  conditionalEvidence: string[];
  registrationSteps: string[];
  onlineOption: string;
  assistedOption: string;
  feeDescription: string;
  waiverDescription: string;
  processingTimeDescription: string;
  faqs: ServicePageFaq[];
  privacyNotice: string;
  primaryActionLabel: string;
  primaryActionHref: string;
}

export interface CrvsOverviewContent {
  heading: string;
  intro: string;
  services: { id: string; title: string; description: string; href: string }[];
  otherEvents: { title: string; description: string };
}

export interface DigitalIdentityContent {
  heading: string;
  intro: string;
  benefits: { title: string; description: string }[];
  eligibility: string[];
  steps: string[];
  primaryActionLabel: string;
  primaryActionHref: string;
  faqs: ServicePageFaq[];
}

export interface TrackContent {
  heading: string;
  intro: string;
  referenceLabel: string;
  otpLabel: string;
  submitLabel: string;
  privacyNote: string;
  statusStages: string[];
  emptyStateHint: string;
}

export interface VerifyContent {
  heading: string;
  intro: string;
  documentNumberLabel: string;
  verificationCodeLabel: string;
  qrHint: string;
  submitLabel: string;
  disclosureNote: string;
  resultLabels: {
    status: string;
    issuingAuthority: string;
    documentType: string;
    documentStatus: string;
    holderMatch: string;
  };
}

export interface SimpleStaticPageContent {
  heading: string;
  intro: string;
  sections: { title: string; body: string[] }[];
}

export interface CertificatesContent {
  heading: string;
  intro: string;
  certificateTypes: { title: string; description: string; href: string }[];
  processingTimeDescription: string;
  feeDescription: string;
}

export interface RequirementsContent {
  heading: string;
  intro: string;
  categories: { title: string; items: string[] }[];
}

export interface ServiceCentresContent {
  heading: string;
  intro: string;
  finderPlaceholder: string;
  assistedServiceNote: string;
}

export interface PublicContent {
  common: PublicCommonContent;
  home: HomeContent;
  digitalIdentity: DigitalIdentityContent;
  crvsOverview: CrvsOverviewContent;
  servicePages: Record<string, ServicePageContent>;
  certificates: CertificatesContent;
  requirements: RequirementsContent;
  serviceCentres: ServiceCentresContent;
  track: TrackContent;
  verify: VerifyContent;
  help: SimpleStaticPageContent;
  complaints: SimpleStaticPageContent;
  privacy: SimpleStaticPageContent;
  accessibility: SimpleStaticPageContent;
}
