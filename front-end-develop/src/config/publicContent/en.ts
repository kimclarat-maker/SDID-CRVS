import { PublicContent, ServicePageContent } from "@/types/PublicContent";
import { platformConfig } from "@/config/platform.config";

const authority = platformConfig.authorities.civilRegistrationAuthority;
const idAuthority = platformConfig.authorities.identityAuthority;
const FEE_NOTE = "Defined by the responsible authority.";
const TIME_NOTE = "Defined by the responsible authority.";
const CARD_META = "Fee & processing time: defined by the responsible authority";

function buildServicePage(params: {
  id: string;
  title: string;
  summary: string;
  description: string;
  eventNoun: string;
  primaryActionHref: string;
}): ServicePageContent {
  const { id, title, summary, description, eventNoun, primaryActionHref } = params;
  return {
    id,
    title,
    summary,
    description,
    whoMayApply: [
      `A parent, spouse, next of kin, or legal guardian connected to the ${eventNoun}.`,
      `A legally authorised representative acting on behalf of the person concerned.`,
      `The individual themselves, where applicable and permitted by the responsible authority.`,
    ],
    eligibility: [
      `The ${eventNoun} occurred, or is recognised, within the platform's service area.`,
      `Supporting evidence for the ${eventNoun} is available, or an assisted-service pathway is used to help gather it.`,
    ],
    requiredEvidence: [
      "A valid form of identification for the applicant.",
      `Primary evidence of the ${eventNoun} (for example, a notification, medical certificate, or witness attestation, as defined by the responsible authority).`,
    ],
    conditionalEvidence: [
      "Additional supporting documents may be required depending on individual circumstances, as defined by the responsible authority.",
      "Late registration may require extra supporting evidence or an administrative review step.",
    ],
    registrationSteps: [
      "Confirm eligibility and gather the required evidence.",
      "Submit the application online or at an assisted-service centre.",
      "Provide any additional information requested during review.",
      "Receive confirmation once the record has been registered.",
      "Request a certificate for the registered record, if needed.",
    ],
    onlineOption:
      "Start and, where enabled, complete this service online through the platform.",
    assistedOption:
      "Visit a service centre for in-person, assisted support with this service.",
    feeDescription: FEE_NOTE,
    waiverDescription: FEE_NOTE,
    processingTimeDescription: TIME_NOTE,
    faqs: [
      {
        question: `Who is responsible for registering a ${eventNoun}?`,
        answer: `${authority} is responsible for civil registration services, including this one. Specific procedures are defined by the responsible authority.`,
      },
      {
        question: "What happens if I am missing a required document?",
        answer:
          "Visit an assisted-service centre. Staff can advise on alternative evidence or next steps for your situation.",
      },
      {
        question: "How do I check on my application afterwards?",
        answer:
          "Use the application tracking page with your application reference to view a status update.",
      },
    ],
    privacyNotice:
      "Information you submit is used only to process this civil registration service and is handled in line with the platform's data protection safeguards. It is not published or shared publicly.",
    primaryActionLabel: "Start this service",
    primaryActionHref: primaryActionHref,
  };
}

export const en: PublicContent = {
  common: {
    nav: {
      home: "Home",
      digitalIdentity: "Digital Identity",
      civilRegistration: "Civil Registration",
      certificates: "Certificates",
      track: "Track Application",
      verify: "Verify Document",
      serviceCentres: "Service Centres",
      help: "Help",
      staffSignIn: "Staff sign in",
      skipToContent: "Skip to main content",
      menu: "Menu",
    },
    footer: {
      aboutHeading: platformConfig.platformName,
      aboutText: `${platformConfig.platformName} brings digital identity and civil registration services together in one place, operated on behalf of ${platformConfig.authorities.platformAuthority}.`,
      linksHeading: "Quick links",
      contactHeading: "Contact",
      legalHeading: "Legal",
      privacy: "Privacy notice",
      accessibility: "Accessibility statement",
      complaints: "Complaints",
      copyright: `© ${new Date().getFullYear()} ${platformConfig.platformName}. All rights reserved.`,
    },
    common: {
      learnMore: "Learn more",
      getStarted: "Get started",
      startNow: "Start now",
      readMore: "Read more",
      backToHome: "Back to home",
      languageSelectorLabel: "Choose language",
      trustStatementPrefix: "An initiative of",
    },
  },

  home: {
    hero: {
      title:
        "One trusted platform for civil registration and digital identity services.",
      subtitle: `Register life events, request certificates, and manage your digital identity — backed by ${platformConfig.authorities.platformAuthority}.`,
      primaryCtaLabel: "Start digital identity pre-enrolment",
      primaryCtaHref: "/digital-identity",
      secondaryCtaLabel: "Explore civil registration",
      secondaryCtaHref: "/civil-registration",
    },
    heroSlides: [
      {
        video: "/videos/crvs.mp4",
        title: "Every life event, officially recorded",
        subtitle:
          "Register births, deaths, and marriages, and request certificates through one trusted civil registration platform.",
        ctaLabel: "Explore civil registration",
        ctaHref: "/civil-registration",
      },
      {
        video: "/videos/sdid.mp4",
        title: "One secure identity, for every service",
        subtitle: `Pre-enrol for your digital identity and access government services with confidence, backed by ${platformConfig.authorities.platformAuthority}.`,
        ctaLabel: "Start digital identity pre-enrolment",
        ctaHref: "/digital-identity",
      },
    ],
    about: {
      eyebrow: "About us",
      index: "01",
      heading:
        "A single, trusted platform that helps citizens register life events, secure a digital identity, and access government services with confidence.",
      stats: [
        {
          value: "2",
          label: "Core services",
          description:
            "Digital identity and civil registration, connected in one platform.",
        },
        {
          value: "8",
          label: "Online services",
          description:
            "The most common identity and civil registration requests, available online.",
        },
        {
          value: "24/7",
          label: "Access",
          description:
            "Start most services online anytime, with assisted support at service centres.",
        },
      ],
    },
    serviceShowcase: {
      eyebrow: "Our Services",
      index: "02",
      heading: "Find the right service for whatever you need",
      viewAllLabel: "View All Services",
      viewAllHref: "#popular-services",
      tags: [
        "Digital ID",
        "Birth registration",
        "Death registration",
        "Marriage registration",
        "Certificates",
        "Corrections",
      ],
      moreTagsLabel: "+2 more",
      items: [
        {
          title: "Digital Identity",
          description:
            "Pre-enrol for a digital identity, manage your profile, and book an appointment for biometric enrolment.",
          href: "/digital-identity",
        },
        {
          title: "Civil Registration",
          description:
            "Register births, deaths, marriages, request certificates, and correct civil records.",
          href: "/civil-registration",
        },
        {
          title: "Certificates",
          description:
            "Request an official certificate for a birth, death, marriage, or other registered civil record.",
          href: "/certificates",
        },
      ],
    },
    serviceCards: [
      {
        id: "digital-identity",
        title: "Digital Identity",
        description:
          "Pre-enrol for a digital identity, manage your profile, and book an appointment for biometric enrolment.",
        href: "/digital-identity",
        icon: "fingerprint",
      },
      {
        id: "civil-registration",
        title: "Civil Registration",
        description:
          "Register births, deaths, marriages, request certificates, and correct civil records.",
        href: "/civil-registration",
        icon: "family_history",
      },
    ],
    popularServices: {
      heading: "Popular services",
      intro: "The most requested digital identity and civil registration services.",
      items: [
        {
          id: "pre-enrolment",
          title: "Start digital identity pre-enrolment",
          description: "Begin your digital identity application online.",
          href: "/digital-identity",
          icon: "fingerprint",
          meta: CARD_META,
        },
        {
          id: "register-birth",
          title: "Register a birth",
          description: "Report and register a birth with the civil registry.",
          href: "/civil-registration/birth",
          icon: "child_care",
          meta: CARD_META,
        },
        {
          id: "register-death",
          title: "Register a death",
          description: "Report and register a death with the civil registry.",
          href: "/civil-registration/death",
          icon: "sentiment_neutral",
          meta: CARD_META,
        },
        {
          id: "register-marriage",
          title: "Apply for marriage registration",
          description: "Apply to register a marriage or partnership.",
          href: "/civil-registration/marriage",
          icon: "favorite",
          meta: CARD_META,
        },
        {
          id: "request-certificate",
          title: "Request a certificate",
          description: "Request an official certificate for a registered record.",
          href: "/certificates",
          icon: "workspace_premium",
          meta: CARD_META,
        },
        {
          id: "correct-record",
          title: "Correct a civil record",
          description: "Request a correction or amendment to a civil record.",
          href: "/civil-registration",
          icon: "edit_document",
          meta: CARD_META,
        },
        {
          id: "track-application",
          title: "Track an application",
          description: "Check the status of a submitted application.",
          href: "/track",
          icon: "search",
        },
        {
          id: "verify-document",
          title: "Verify a document",
          description: "Confirm whether a certificate or document is valid.",
          href: "/verify",
          icon: "verified",
        },
      ],
    },
    trackShortcut: {
      heading: "Track an application",
      description:
        "Already applied? Enter your application reference to see a status update.",
      ctaLabel: "Track my application",
      ctaHref: "/track",
    },
    verifyShortcut: {
      heading: "Verify a document",
      description:
        "Check whether a certificate or identity document issued by this platform is valid.",
      ctaLabel: "Verify a document",
      ctaHref: "/verify",
    },
    howSdidCrvsWorkTogether: {
      eyebrow: "How it connects",
      heading: "How digital identity and civil registration work together",
      items: [
        {
          icon: "history_edu",
          title: "Civil registration",
          description: `Creates the official record of a life event — a birth, death, marriage, or other vital event recognised by ${authority}.`,
        },
        {
          icon: "fingerprint",
          title: "Digital identity",
          description: `Managed by ${idAuthority}, uses trusted civil registration records to verify who you are, so identity documents and civil records stay consistent.`,
        },
        {
          icon: "handshake",
          title: "Working together",
          description:
            "Register a life event and use that record to support identity enrolment, certificate requests, and other government services — without submitting the same information twice.",
        },
      ],
    },
    howItWorks: {
      heading: "How it works",
      steps: [
        {
          title: "Choose a service",
          description:
            "Select a digital identity or civil registration service that matches your need.",
        },
        {
          title: "Apply online or visit a service centre",
          description:
            "Complete the request online where available, or get assisted support at a service centre.",
        },
        {
          title: "Track and receive your outcome",
          description:
            "Follow your application status and receive your certificate, identity credential, or confirmation.",
        },
      ],
    },
    requirementsFeesProcessing: {
      heading: "Requirements, fees and processing times",
      intro:
        "Each service lists its own requirements, applicable fees or waivers, and expected processing time. Exact values are set by the responsible authority and shown on each service page.",
      items: [
        {
          title: "Requirements",
          description:
            "Identity evidence and event-specific documents, listed on each service page.",
        },
        {
          title: "Fees and waivers",
          description: FEE_NOTE,
        },
        {
          title: "Processing time",
          description: TIME_NOTE,
        },
      ],
    },
    serviceCentreFinderPreview: {
      heading: "Find a service centre",
      description:
        "Locate a service centre near you for in-person and assisted-service support.",
      ctaLabel: "Find a service centre",
      ctaHref: "/service-centres",
    },
    trustSection: {
      heading: "Privacy, security and trust",
      points: [
        {
          title: "Your data is protected",
          description:
            "Information you submit is handled under data protection safeguards and only used to deliver the service you requested.",
        },
        {
          title: "Limited public disclosure",
          description:
            "Document verification only confirms validity and minimal matching details — never a full identity or civil-registration record.",
        },
        {
          title: "Accountable authorities",
          description: `Services are delivered by ${platformConfig.authorities.platformAuthority} and its civil registration and identity authorities.`,
        },
      ],
    },
    notices: {
      heading: "Service notices",
      items: [
        {
          title: "Assisted service available",
          message:
            "If you cannot complete a service online, assisted support is available at service centres.",
          type: "info",
        },
      ],
    },
  },

  digitalIdentity: {
    heading: "Digital Identity",
    intro: `Pre-enrol for a digital identity, manage your profile, and schedule biometric enrolment with ${idAuthority}.`,
    benefits: [
      {
        title: "One trusted identity",
        description:
          "A digital identity that can be used to access government and other services securely.",
      },
      {
        title: "Faster enrolment",
        description:
          "Pre-enrolling online reduces the time needed at your enrolment appointment.",
      },
      {
        title: "Linked to civil registration",
        description:
          "Where available, your civil registration record can support your identity application.",
      },
    ],
    eligibility: [
      "You meet the age and residency criteria defined by the responsible authority.",
      "You can provide the identity evidence requested during pre-enrolment.",
    ],
    steps: [
      "Start pre-enrolment and enter your identifying details.",
      "Validate your information against available records.",
      "Book an appointment for biometric enrolment at a service centre.",
      "Attend your appointment to complete enrolment.",
    ],
    primaryActionLabel: "Start digital identity pre-enrolment",
    primaryActionHref: "/staff/sign-in",
    faqs: [
      {
        question: "Do I need an existing civil registration record?",
        answer:
          "It helps, but exceptional-case pathways exist for people without traceable records. Visit a service centre for assisted support.",
      },
      {
        question: "Where do I complete biometric enrolment?",
        answer:
          "Biometric enrolment is completed in person at a service centre, after pre-enrolment and appointment booking.",
      },
    ],
  },

  crvsOverview: {
    heading: "Civil Registration",
    intro: `Civil registration is the official recording of life events. Services are delivered by ${authority} and, where configured, cover the events below.`,
    services: [
      {
        id: "birth",
        title: "Birth registration",
        description: "Register a birth and obtain an official birth record.",
        href: "/civil-registration/birth",
      },
      {
        id: "death",
        title: "Death registration",
        description: "Register a death and obtain an official death record.",
        href: "/civil-registration/death",
      },
      {
        id: "marriage",
        title: "Marriage or partnership registration",
        description:
          "Register a marriage or partnership recognised by the responsible authority.",
        href: "/civil-registration/marriage",
      },
      {
        id: "divorce",
        title: "Divorce registration",
        description:
          "Register a divorce already granted by a court or other competent authority.",
        href: "/civil-registration/divorce",
      },
      {
        id: "certificates",
        title: "Certificate requests",
        description: "Request an official certificate for a registered record.",
        href: "/certificates",
      },
      {
        id: "corrections",
        title: "Corrections and amendments",
        description: "Request a correction or amendment to an existing civil record.",
        href: "/requirements",
      },
    ],
    otherEvents: {
      title: "Other country-configured vital events",
      description:
        "Additional vital events can be enabled by the responsible authority as part of the platform configuration.",
    },
  },

  servicePages: {
    birth: buildServicePage({
      id: "birth",
      title: "Birth registration",
      summary: "Register a birth and obtain an official birth record.",
      description:
        "Birth registration creates the official, permanent record of a child's birth. It is usually the first step toward obtaining identity documents and accessing other services.",
      eventNoun: "birth",
      primaryActionHref: "/staff/sign-in",
    }),
    death: buildServicePage({
      id: "death",
      title: "Death registration",
      summary: "Register a death and obtain an official death record.",
      description:
        "Death registration creates the official record of a death. It is typically required before estate, insurance, or other administrative processes can proceed.",
      eventNoun: "death",
      primaryActionHref: "/staff/sign-in",
    }),
    marriage: buildServicePage({
      id: "marriage",
      title: "Marriage or partnership registration",
      summary: "Register a marriage or partnership recognised by the responsible authority.",
      description:
        "Marriage or partnership registration creates the official record of a union recognised by the responsible authority.",
      eventNoun: "marriage or partnership",
      primaryActionHref: "/civil-registration/marriage/declaration",
    }),
    // Divorce is written out in full rather than built from
    // buildServicePage(), because its copy has to draw a distinction the
    // generic template has no room for: this service registers a divorce a
    // court has ALREADY granted, and never files, hears or decides one.
    divorce: {
      id: "divorce",
      title: "Divorce registration",
      summary: "Register a divorce a court has already granted, so the civil register and both former spouses' records reflect it.",
      description:
        "Divorce registration is the administrative step that comes after a court has ended a marriage. The registry records the decision the court has already made: the existing marriage record is marked as dissolved and each former spouse's civil status becomes divorced. It is not a way to ask for a divorce, and it changes nothing about what the court decided.",
      whoMayApply: [
        "Either former spouse named in the court decision.",
        "Both former spouses together, where they prefer to register the decision jointly.",
        "Another interested person acting for a former spouse, who must declare and evidence their authority to do so.",
        "A registration officer entering the request with you at a service centre.",
      ],
      eligibility: [
        "A competent court or authority has already granted the divorce.",
        "The decision is final and is no longer open to appeal.",
        "The marriage being dissolved is on the civil register, or can be evidenced with a marriage certificate or record.",
      ],
      requiredEvidence: [
        "The final court judgment or divorce decree.",
        "The marriage certificate, or the marriage record details, for the marriage being dissolved.",
        "A valid identity document for the person submitting the request.",
        "Proof that the decision is final, such as a certificate of non-appeal.",
      ],
      conditionalEvidence: [
        "Where the person submitting is not one of the former spouses: a power of attorney or court authorisation.",
        "Where the divorce was granted outside the country: a certified translation, authentication or legalisation of the decision, and a recognition (exequatur) decision.",
        "Where the marriage record cannot be located in the registry: any documentary evidence of the marriage, so a registrar can search manually.",
      ],
      registrationSteps: [
        "Obtain the final decision from the court that granted the divorce. This service cannot do that for you.",
        "Start a registration request and identify the marriage the divorce ends.",
        "Enter the court decision's details and upload the supporting documents.",
        "Review everything, make the required declarations, and submit.",
        "A registration officer verifies the court decision and either registers the divorce or asks you for a correction.",
        "Once registered, request a divorce record or certificate if you need one.",
      ],
      onlineOption: "Complete the whole registration request online, saving your progress and returning to it with your reference.",
      assistedOption: "Visit a service centre, where a registration officer can enter the request with you and check your documents.",
      feeDescription: "No fee is charged for registering a divorce.",
      waiverDescription: "No fee applies, so no waiver is needed.",
      processingTimeDescription:
        "Most requests are reviewed within about ten working days. Verifying the court decision adds up to five working days, and a decision granted abroad needs a further recognition review.",
      faqs: [
        {
          question: "Can I get a divorce through this service?",
          answer:
            "No. A divorce can only be granted by a court. This service registers a divorce that a court has already granted, so that the civil register and both former spouses' identity records reflect it. If your divorce has not been granted yet, there is nothing to register.",
        },
        {
          question: "What is the difference between the court's judgment and registering it?",
          answer:
            "The judgment is the court's decision to end the marriage. Registration is the civil registry recording that decision. Until the divorce is registered, the marriage record and both former spouses' civil status still show them as married, which can affect anything that depends on civil status — including remarrying.",
        },
        {
          question: "Will you look at why my marriage ended, or decide about children, maintenance or property?",
          answer:
            "No. The registry never examines the grounds for a divorce and has no role in custody, maintenance or the division of property. Those are decided by the court, and this service does not collect information about them.",
        },
        {
          question: "My divorce was granted in another country. Can I register it here?",
          answer:
            "Yes, but a decision granted abroad has extra requirements: a certified translation, authentication or legalisation of the decision, and a recognition decision. A supervisor reviews every foreign decision before it can be registered, which takes longer than a domestic one.",
        },
        {
          question: "Does the other former spouse have to agree, or be told?",
          answer:
            "Registering the decision does not need the other former spouse's agreement — the court has already decided. Because the divorce affects both people's civil status, both records are updated once it is registered. The tracking page never shows either former spouse the other's contact details or documents.",
        },
        {
          question: "When can I get a divorce certificate?",
          answer:
            "Once the divorce has been registered and any outstanding correction or review has been resolved. Track your request with your reference — the tracking page tells you when a record or certificate can be requested.",
        },
      ],
      privacyNotice:
        "Court documents you upload are treated as restricted: they are visible only to you and to the staff handling your request, and are never shown on the public tracking page. Tracking pages show a status and next step only — never the judgment, the documents, internal notes, or the other former spouse's personal details.",
      primaryActionLabel: "Register an existing divorce",
      primaryActionHref: "/civil-registration/divorce/register",
    },
  },

  certificates: {
    heading: "Certificates",
    intro:
      "Request an official certificate for a birth, death, marriage, or other registered civil record.",
    certificateTypes: [
      {
        title: "Birth certificate",
        description: "Official certificate for a registered birth.",
        href: "/civil-registration/birth",
      },
      {
        title: "Death certificate",
        description: "Official certificate for a registered death.",
        href: "/civil-registration/death",
      },
      {
        title: "Marriage certificate",
        description: "Official certificate for a registered marriage or partnership.",
        href: "/civil-registration/marriage",
      },
    ],
    processingTimeDescription: TIME_NOTE,
    feeDescription: FEE_NOTE,
  },

  requirements: {
    heading: "Requirements, fees and processing times",
    intro:
      "General guidance on what is typically needed across services. Each service page lists its specific requirements, fees or waivers, and expected processing time.",
    categories: [
      {
        title: "Identity evidence",
        items: [
          "A valid form of identification for the applicant.",
          "Additional identity evidence if the applicant is acting on behalf of someone else.",
        ],
      },
      {
        title: "Event evidence",
        items: [
          "Primary evidence of the event being registered (as defined by the responsible authority).",
          "Supporting documents for late or exceptional registrations, where applicable.",
        ],
      },
      {
        title: "Fees and waivers",
        items: [FEE_NOTE],
      },
      {
        title: "Processing time",
        items: [TIME_NOTE],
      },
    ],
  },

  serviceCentres: {
    heading: "Service centres",
    intro:
      "Find a service centre for in-person and assisted-service support with digital identity and civil registration services.",
    finderPlaceholder: "Search by area or service centre name",
    assistedServiceNote:
      "Assisted service is available at every listed centre for people who cannot complete a service online.",
  },

  track: {
    heading: "Track an application",
    intro:
      "Enter your application reference and the one-time code sent to you to see a status update.",
    referenceLabel: "Application reference",
    otpLabel: "One-time code (OTP)",
    submitLabel: "Check status",
    privacyNote:
      "Only a limited status summary is shown here. For full details, sign in or visit a service centre.",
    statusStages: ["Submitted", "Under review", "Additional information requested", "Approved", "Completed"],
    emptyStateHint:
      "Enter your application reference and one-time code above to see a status update.",
  },

  verify: {
    heading: "Verify a document",
    intro:
      "Confirm whether a certificate or identity document issued by this platform is valid.",
    documentNumberLabel: "Document number",
    verificationCodeLabel: "Verification code",
    qrHint: "Scan the QR code printed on the document, or enter its details manually.",
    submitLabel: "Verify document",
    disclosureNote:
      "For privacy, verification only shows whether a document is valid, its type, issuing authority, status, and minimal holder matching — never a full identity or civil-registration record.",
    resultLabels: {
      status: "Result",
      issuingAuthority: "Issuing authority",
      documentType: "Document type",
      documentStatus: "Document status",
      holderMatch: "Holder match",
    },
  },

  help: {
    heading: "Help",
    intro: "Guidance on using this platform and getting assisted support.",
    sections: [
      {
        title: "Using the platform",
        body: [
          "Use the navigation menu to find digital identity or civil registration services.",
          "Each service page explains eligibility, required evidence, steps, fees, and processing time.",
        ],
      },
      {
        title: "Assisted service",
        body: [
          "If you cannot complete a service online, visit a service centre for in-person, assisted support.",
        ],
      },
      {
        title: "Contact",
        body: [
          `Call centre: ${platformConfig.contact.callCenterNumber}`,
          `Email: ${platformConfig.contact.email}`,
        ],
      },
    ],
  },

  complaints: {
    heading: "Complaints",
    intro:
      "If you experienced a problem with a service, you can raise it with the responsible authority.",
    sections: [
      {
        title: "How to raise a complaint",
        body: [
          "Visit a service centre and speak with a staff member, or use the contact details below.",
        ],
      },
      {
        title: "Contact",
        body: [
          `Call centre: ${platformConfig.contact.callCenterNumber}`,
          `Email: ${platformConfig.contact.email}`,
        ],
      },
    ],
  },

  privacy: {
    heading: "Privacy notice",
    intro:
      "This notice explains, in general terms, how information submitted through this platform is used.",
    sections: [
      {
        title: "What we collect",
        body: [
          "Information you submit when using digital identity or civil registration services, limited to what each service requires.",
        ],
      },
      {
        title: "How it is used",
        body: [
          "To process the service you requested and to maintain accurate civil registration and identity records.",
        ],
      },
      {
        title: "Public disclosure",
        body: [
          "Document verification only discloses limited, non-identifying details. Full identity and civil-registration records are never made publicly available.",
        ],
      },
    ],
  },

  accessibility: {
    heading: "Accessibility statement",
    intro:
      "This platform aims to be usable by everyone, including people using assistive technology.",
    sections: [
      {
        title: "Our commitment",
        body: [
          "Mobile-first, responsive layouts, semantic HTML, keyboard navigation, visible focus styles, and accessible form labelling.",
        ],
      },
      {
        title: "Assisted service alternatives",
        body: [
          "Every online service has an in-person, assisted-service alternative at a service centre for people who cannot use the website.",
        ],
      },
      {
        title: "Feedback",
        body: [
          `If you encounter an accessibility barrier, contact: ${platformConfig.contact.email}`,
        ],
      },
    ],
  },
};

export default en;
