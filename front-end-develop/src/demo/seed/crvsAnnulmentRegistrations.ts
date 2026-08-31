// Realistic demo seed data for the marriage-annulment-notification /
// marriage-annulment-registration workflow (spec §30) — one hand-authored
// scenario per bullet in the spec's seed-data list, following the same
// base-builder-plus-overrides convention as crvsDivorceRegistrations.ts.
// Names, courts and reference numbers are invented fictional demo data.
// Like the divorce seed file, `marriageAnnulmentUpdate.applied` stays false
// throughout: seed data does not cross-mutate the referenced
// MarriageApplication record, so `applied` accurately reflects that the
// seed hasn't actually flipped the marriage object (only the real
// demoRegisterAnnulment() service does that).
import {
  AnnulmentNotification,
  AnnulmentRegistration,
  AnnulmentApplicant,
  AffectedParty,
  AffectedPartyKey,
  AnnulmentDecision,
  ForeignAnnulmentRecognition,
  AnnulmentLegalEffect,
  FoundationalIdentity,
  emptyAnnulmentReviewSections,
} from "@/domain/crvs/types";
import { isoDaysAgo, isoDaysFromNow } from "./fixtures";
import {
  DEMO_ANNULMENT_OFFICE_ID,
  DEMO_ANNULMENT_OFFICE_NAME,
  DEMO_JURISDICTION,
  ANNULMENT_REGISTRATION_OFFICER_DEMO_ID,
  ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
  CIVIL_REGISTRAR_DEMO_ID,
  CIVIL_REGISTRAR_DEMO_NAME,
  CRVS_SUPERVISOR_DEMO_NAME,
  COURT_NOTIFICATION_OFFICER_DEMO_NAME,
} from "./crvsAccounts";

const applicantFromParty = (
  documentNumber: string,
  firstName: string,
  lastName: string,
  ageYears: number,
  overrides: Partial<AnnulmentApplicant> = {}
): AnnulmentApplicant => ({
  documentType: "NATIONAL_ID",
  documentNumber,
  firstName,
  lastName,
  dateOfBirth: isoDaysAgo(365 * ageYears),
  nationality: "Demo Republic",
  residence: "Riverside, Demo District",
  phone: "+000 555 0199",
  relationshipToMarriage: "PARTY_1",
  relationshipToCase: "AFFECTED_PARTY_1",
  identityVerification: "VERIFIED",
  ...overrides,
});

const affectedParty = (
  partyKey: AffectedPartyKey,
  firstName: string,
  lastName: string,
  sex: "MALE" | "FEMALE",
  ageYears: number,
  overrides: Partial<AffectedParty> = {}
): AffectedParty => ({
  partyKey,
  firstName,
  lastName,
  sex,
  dateOfBirth: isoDaysAgo(365 * ageYears),
  nationality: "Demo Republic",
  currentCivilStatus: "MARRIED",
  identityMatchConfidence: "CONFIRMED",
  identityVerification: "VERIFIED",
  linkedToSelectedMarriage: true,
  ...overrides,
});

const decision = (overrides: Partial<AnnulmentDecision> = {}): AnnulmentDecision => ({
  country: "Rwanda",
  courtOrAuthorityName: "Demo District Intermediate Court",
  jurisdiction: DEMO_JURISDICTION,
  courtCaseNumber: "RDIC-ANN-DEMO-0001",
  decisionNumber: "ANN-JGT-DEMO-0001",
  decisionDate: isoDaysAgo(60),
  finalityDate: isoDaysAgo(30),
  effectiveDate: isoDaysAgo(30),
  decisionType: "COURT_ORDER",
  describesMarriageAs: "VOIDABLE",
  legalEffectWording: "The marriage between the parties is hereby annulled and declared void.",
  isForeign: false,
  ...overrides,
});

const notApplicableForeignAnnulment = (overrides: Partial<ForeignAnnulmentRecognition> = {}): ForeignAnnulmentRecognition => ({
  status: "NOT_APPLICABLE",
  country: "",
  foreignCourtOrAuthority: "",
  translationRequired: false,
  translationProvided: false,
  authenticationRequired: false,
  authenticationProvided: false,
  exequaturOrRecognitionRequired: false,
  exequaturOrRecognitionProvided: false,
  missingRequirements: [],
  ...overrides,
});

const unclassifiedLegalEffect = (overrides: Partial<AnnulmentLegalEffect> = {}): AnnulmentLegalEffect => ({
  wordingFromDecision: "The marriage between the parties is hereby annulled and declared void.",
  marriageStatusResult: "REQUIRES_MANUAL_REVIEW",
  proposedSdid: {
    party1: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
    party2: { proposedCivilStatus: "UNCHANGED", rationale: "Legal-effect classification not yet confirmed." },
  },
  relationshipHistoryTreatment: "MARK_ANNULLED_PRESERVE_HISTORY",
  certificateConsequence: "MANUAL_REVIEW",
  downstreamChangesExplicitlyExcluded: [
    "Parent-child relationships",
    "Names",
    "Nationality or citizenship",
    "Residence or address",
    "Property, inheritance, tax, or immigration decisions",
  ],
  classificationHistory: [],
  ...overrides,
});

type Overrides = Partial<AnnulmentRegistration> & Pick<AnnulmentRegistration, "id" | "reference" | "status">;

const baseAnnulmentRegistration = (overrides: Overrides): AnnulmentRegistration => ({
  source: "APPLICANT",
  jurisdiction: DEMO_JURISDICTION,
  applicant: applicantFromParty("DEMO-ID-0601", "Selam", "Ade", 31, { relationshipToMarriage: "PARTY_1", relationshipToCase: "AFFECTED_PARTY_1" }),
  existingMarriage: {
    status: "MATCHED",
    candidates: [],
    notFoundEvidence: [],
    selected: {
      registrationNumber: "CRVS-MARRIAGE-DEMO-SEED-0020",
      marriageDate: isoDaysAgo(900),
      marriagePlace: DEMO_ANNULMENT_OFFICE_NAME,
      party1Name: "Selam Ade",
      party2Name: "Victor Nwachukwu",
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      currentCivilStatus: "ACTIVE",
      matchConfidence: "HIGH",
    },
    searchedAt: isoDaysAgo(20),
    searchedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
  },
  affectedParty1: affectedParty("PARTY_1", "Selam", "Ade", "FEMALE", 31),
  affectedParty2: affectedParty("PARTY_2", "Victor", "Nwachukwu", "MALE", 34),
  decision: decision(),
  decisionVerification: { status: "NOT_STARTED", results: [] },
  legalEffect: unclassifiedLegalEffect(),
  foreignRecognition: notApplicableForeignAnnulment(),
  evidence: [
    {
      id: "AEV-SEED-1",
      documentType: "FINAL_ANNULMENT_DECISION",
      fileName: "final-annulment-decision.pdf",
      fileType: "application/pdf",
      fileSizeKb: 460,
      uploadedAt: isoDaysAgo(20),
      uploadedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
      verification: "VERIFIED",
    },
    {
      id: "AEV-SEED-2",
      documentType: "MARRIAGE_CERTIFICATE_OR_RECORD",
      fileName: "marriage-certificate.pdf",
      fileType: "application/pdf",
      fileSizeKb: 200,
      uploadedAt: isoDaysAgo(20),
      uploadedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
      verification: "VERIFIED",
    },
  ],
  processingOffice: {
    marriageRegisteredOfficeName: DEMO_ANNULMENT_OFFICE_NAME,
    applicantDomicileOfficeName: DEMO_ANNULMENT_OFFICE_NAME,
    selectedProcessingOfficeId: DEMO_ANNULMENT_OFFICE_ID,
    selectedProcessingOfficeName: DEMO_ANNULMENT_OFFICE_NAME,
    embassyOrForeignOfficePath: false,
    jurisdictionResult: "CONFIRMED",
  },
  reviewSections: emptyAnnulmentReviewSections(),
  reviewDecisions: [],
  correctionRequests: [],
  officerId: ANNULMENT_REGISTRATION_OFFICER_DEMO_ID,
  officerName: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
  accuracyDeclarationConfirmed: true,
  authorityToSubmitConfirmed: true,
  authoritativeDecisionExistsConfirmed: true,
  decisionCompleteConfirmed: true,
  privacyAcknowledged: true,
  electronicSubmissionConfirmed: true,
  createdAt: isoDaysAgo(21),
  updatedAt: isoDaysAgo(20),
  submittedAt: isoDaysAgo(20),
  sdid: {
    status: "NOT_READY",
    party1: { status: "NOT_READY", attempts: [] },
    party2: { status: "NOT_READY", attempts: [] },
  },
  statusHistory: [{ status: "DRAFT", at: isoDaysAgo(21), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME }],
  version: 1,
  ...overrides,
});

export const seedCrvsAnnulmentNotifications = (): AnnulmentNotification[] => [
  // 1. Court notification awaiting validation.
  {
    id: "AN-1",
    reference: "AN-DEMO-2026-0001",
    status: "RECEIVED",
    courtName: "Demo District Intermediate Court",
    courtCaseNumber: "RDIC-ANN-DEMO-0042",
    decisionNumber: "ANN-JGT-DEMO-0042",
    decisionDate: isoDaysAgo(15),
    finalityDate: isoDaysAgo(5),
    legalEffectWordingAsReported: "The marriage is declared void and annulled.",
    applicantNamesAsReported: "Nadia Correia & Emeka Obi",
    marriageReferenceAsReported: "CRVS-MARRIAGE-DEMO-0021",
    signedDecisionDocument: {
      id: "AEV-AN-1",
      documentType: "FINAL_ANNULMENT_DECISION",
      fileName: "rdic-ann-0042-decision.pdf",
      fileType: "application/pdf",
      fileSizeKb: 505,
      uploadedAt: isoDaysAgo(5),
      uploadedBy: "Court integration (simulated)",
      verification: "NOT_VERIFIED",
    },
    notifiedAt: isoDaysAgo(5),
    marriageMatch: { status: "NOT_SEARCHED", candidates: [], notFoundEvidence: [] },
    duplicateWarning: false,
    createdAt: isoDaysAgo(5),
    updatedAt: isoDaysAgo(5),
    statusHistory: [{ status: "RECEIVED", at: isoDaysAgo(5), by: COURT_NOTIFICATION_OFFICER_DEMO_NAME }],
    version: 1,
  },
];

export const seedCrvsAnnulmentRegistrations = (): AnnulmentRegistration[] => [
  // 2. Applicant-submitted annulment, still in review.
  baseAnnulmentRegistration({
    id: "AN-2",
    reference: "AN-DEMO-2026-0002",
    status: "UNDER_REVIEW",
    reviewerId: CIVIL_REGISTRAR_DEMO_ID,
    reviewerName: CIVIL_REGISTRAR_DEMO_NAME,
    reviewLockedAt: isoDaysAgo(2),
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(21), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(20), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 3. Existing marriage successfully matched (Step 3 complete), still a
  // draft awaiting the remaining wizard steps.
  baseAnnulmentRegistration({
    id: "AN-3",
    reference: "AN-DEMO-2026-0003",
    status: "DRAFT",
    submittedAt: undefined,
    affectedParty2: affectedParty("PARTY_2", "Victor", "Nwachukwu", "MALE", 34, {
      identityMatchConfidence: "PROBABLE",
      identityVerification: "UNVERIFIED_PROVIDED",
    }),
    statusHistory: [{ status: "DRAFT", at: isoDaysAgo(3), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME }],
  }),
  // 4. Marriage record not found — routed to exception review, applicant
  // provided supporting marriage evidence instead.
  baseAnnulmentRegistration({
    id: "AN-4",
    reference: "AN-DEMO-2026-0004",
    status: "EXCEPTION_REVIEW",
    source: "STAFF_ASSISTED",
    applicant: applicantFromParty("DEMO-ID-0602", "Grace", "Uwimana", 45, {
      relationshipToMarriage: "NEITHER_PARTY",
      relationshipToCase: "STAFF",
      authorizationBasis: "Staff-assisted registration on behalf of the applicant.",
    }),
    existingMarriage: {
      status: "NOT_FOUND",
      candidates: [],
      searchCriteria: { party1Name: "Halima Njoku", party2Name: "Samuel Kagame", marriageDate: isoDaysAgo(1200) },
      searchedAt: isoDaysAgo(8),
      searchedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
      notFoundEvidence: [
        {
          id: "AEV-AN4-1",
          documentType: "MARRIAGE_CERTIFICATE_OR_RECORD",
          fileName: "old-marriage-booklet.pdf",
          fileType: "application/pdf",
          fileSizeKb: 330,
          uploadedAt: isoDaysAgo(8),
          uploadedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
          verification: "UNVERIFIED_PROVIDED",
        },
      ],
    },
    affectedParty1: affectedParty("PARTY_1", "Halima", "Njoku", "FEMALE", 33, { linkedToSelectedMarriage: false }),
    affectedParty2: affectedParty("PARTY_2", "Samuel", "Kagame", "MALE", 36, { linkedToSelectedMarriage: false }),
    exception: {
      type: "MARRIAGE_RECORD_NOT_FOUND",
      reason: "The applicant's declared marriage could not be located in the registry.",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "MEDIUM",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(9), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(8), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(8), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME, note: "Marriage record not found." },
    ],
  }),
  // 5. Marriage-party mismatch — one affected party's identity does not
  // match the identity recorded on the selected marriage.
  baseAnnulmentRegistration({
    id: "AN-5",
    reference: "AN-DEMO-2026-0005",
    status: "EXCEPTION_REVIEW",
    affectedParty2: affectedParty("PARTY_2", "Victor", "Nwachukwu", "MALE", 34, {
      identityMatchConfidence: "LOW_CONFIDENCE",
      identityVerification: "MANUAL_REVIEW_REQUIRED",
      linkedToSelectedMarriage: false,
    }),
    exception: {
      type: "MARRIAGE_PARTY_MISMATCH",
      reason: "The second affected party's declared identity does not match the identity recorded on the selected marriage.",
      triggeringRule: "PARTY_2_IDENTITY",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "HIGH",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(11), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(10), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Identity mismatch on the second affected party." },
    ],
  }),
  // 6. Duplicate annulment registration — a second request against a
  // marriage that already has an active annulment registration on file
  // (AN-2's marriage).
  baseAnnulmentRegistration({
    id: "AN-6",
    reference: "AN-DEMO-2026-0006",
    status: "EXCEPTION_REVIEW",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0002", decisionNumber: "ANN-JGT-DEMO-0002" }),
    exception: {
      type: "DUPLICATE_ANNULMENT",
      reason: "Another active annulment registration already exists for this marriage.",
      triggeringRule: "DUPLICATE_ANNULMENT",
      affectedData: "AN-DEMO-2026-0002",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "HIGH",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(6), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(5), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Duplicate annulment registration detected." },
    ],
  }),
  // 7. Existing divorce conflict — the selected marriage has already been
  // dissolved by a registered divorce, so it cannot also be annulled without
  // supervisor review (spec §2/§10, the reciprocal of divorce's own
  // EXISTING_ANNULMENT guard).
  baseAnnulmentRegistration({
    id: "AN-7",
    reference: "AN-DEMO-2026-0007",
    status: "EXCEPTION_REVIEW",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0003", decisionNumber: "ANN-JGT-DEMO-0003" }),
    existingMarriage: {
      status: "MATCHED",
      candidates: [],
      notFoundEvidence: [],
      selected: {
        registrationNumber: "CRVS-MARRIAGE-DEMO-SEED-0010",
        marriageDate: isoDaysAgo(2200),
        marriagePlace: DEMO_ANNULMENT_OFFICE_NAME,
        party1Name: "Lucia Okoye",
        party2Name: "Aiden Toure",
        officeName: DEMO_ANNULMENT_OFFICE_NAME,
        currentCivilStatus: "DISSOLVED_BY_DIVORCE",
        matchConfidence: "HIGH",
      },
      searchedAt: isoDaysAgo(7),
      searchedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
    },
    affectedParty1: affectedParty("PARTY_1", "Lucia", "Okoye", "FEMALE", 36),
    affectedParty2: affectedParty("PARTY_2", "Aiden", "Toure", "MALE", 39),
    exception: {
      type: "EXISTING_DIVORCE_CONFLICT",
      reason: "This marriage was already dissolved by a registered divorce (DR-DEMO-2026-0015) and cannot also be annulled without supervisor review.",
      triggeringRule: "EXISTING_DIVORCE_CONFLICT",
      affectedData: "DR-DEMO-2026-0015",
      status: "OPEN",
      assignedTo: CRVS_SUPERVISOR_DEMO_NAME,
      priority: "HIGH",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(7), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(6), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(5), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Existing registered divorce found for this marriage." },
    ],
  }),
  // 8. Existing judicial-separation conflict.
  baseAnnulmentRegistration({
    id: "AN-8",
    reference: "AN-DEMO-2026-0008",
    status: "EXCEPTION_REVIEW",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0004", decisionNumber: "ANN-JGT-DEMO-0004" }),
    existingMarriage: {
      status: "MATCHED",
      candidates: [],
      notFoundEvidence: [],
      selected: {
        registrationNumber: "CRVS-MARRIAGE-DEMO-SEED-0022",
        marriageDate: isoDaysAgo(1800),
        marriagePlace: DEMO_ANNULMENT_OFFICE_NAME,
        party1Name: "Priya Fontaine",
        party2Name: "Julian Mensah",
        officeName: DEMO_ANNULMENT_OFFICE_NAME,
        currentCivilStatus: "JUDICIALLY_SEPARATED",
        matchConfidence: "HIGH",
      },
      searchedAt: isoDaysAgo(10),
      searchedBy: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME,
    },
    affectedParty1: affectedParty("PARTY_1", "Priya", "Fontaine", "FEMALE", 40),
    affectedParty2: affectedParty("PARTY_2", "Julian", "Mensah", "MALE", 43),
    exception: {
      type: "EXISTING_JUDICIAL_SEPARATION_CONFLICT",
      reason: "This marriage has an existing judicial-separation record on file.",
      triggeringRule: "EXISTING_JUDICIAL_SEPARATION_CONFLICT",
      status: "OPEN",
      assignedTo: CRVS_SUPERVISOR_DEMO_NAME,
      priority: "MEDIUM",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(10), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(9), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(8), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Existing judicial separation found for this marriage." },
    ],
  }),
  // 9. Decision not final.
  baseAnnulmentRegistration({
    id: "AN-9",
    reference: "AN-DEMO-2026-0009",
    status: "EXCEPTION_REVIEW",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0005", decisionNumber: "ANN-JGT-DEMO-0005", finalityDate: undefined, effectiveDate: undefined }),
    exception: {
      type: "DECISION_NOT_FINAL",
      reason: "The annulment decision has not yet been recorded as final.",
      triggeringRule: "DECISION_FINALITY",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "MEDIUM",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(14), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(13), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(12), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Decision not yet final." },
    ],
  }),
  // 10. Decision verification pending.
  baseAnnulmentRegistration({
    id: "AN-10",
    reference: "AN-DEMO-2026-0010",
    status: "DECISION_VERIFICATION",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0006", decisionNumber: "ANN-JGT-DEMO-0006" }),
    decisionVerification: { status: "PENDING", checkedAt: isoDaysAgo(1), checkedBy: CIVIL_REGISTRAR_DEMO_NAME, results: [] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(7), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(6), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "DECISION_VERIFICATION", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 11. Legal-effect classification unclear — the decision's wording does
  // not clearly state void vs. voidable, so staff have not yet confirmed a
  // classification.
  baseAnnulmentRegistration({
    id: "AN-11",
    reference: "AN-DEMO-2026-0011",
    status: "LEGAL_EFFECT_REVIEW",
    decision: decision({
      courtCaseNumber: "RDIC-ANN-DEMO-0007",
      decisionNumber: "ANN-JGT-DEMO-0007",
      describesMarriageAs: "UNSPECIFIED",
      legalEffectWording: "The Court orders that the marriage registered under CRVS-MARRIAGE-DEMO-SEED-0023 shall no longer be recognized.",
    }),
    legalEffect: unclassifiedLegalEffect({
      wordingFromDecision: "The Court orders that the marriage registered under CRVS-MARRIAGE-DEMO-SEED-0023 shall no longer be recognized.",
      proposedClassification: "EFFECT_REQUIRES_MANUAL_REVIEW",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
    }),
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(8), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(7), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(3), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "LEGAL_EFFECT_REVIEW", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Legal-effect wording does not clearly state void or voidable." },
    ],
  }),
  // 12. Correction required.
  baseAnnulmentRegistration({
    id: "AN-12",
    reference: "AN-DEMO-2026-0012",
    status: "CORRECTION_REQUIRED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0008", decisionNumber: "ANN-JGT-DEMO-0008" }),
    correctionRequests: [
      {
        id: "ACR-1",
        requestType: "CORRECTION",
        requestedBy: CIVIL_REGISTRAR_DEMO_NAME,
        requestedAt: isoDaysAgo(3),
        responseDeadline: isoDaysFromNow(11),
        notifyApplicants: true,
        responseToken: "resp-tok-an-12-demo0001",
        items: [
          { id: "ACRI-1", section: "DECISION", fields: ["decision.courtRegistryReference"], reason: "Court registry reference is missing.", documentsRequired: false, addressed: false },
        ],
      },
    ],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(12), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(11), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "CORRECTION_REQUIRED", at: isoDaysAgo(3), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Court registry reference is missing." },
    ],
  }),
  // 13. Resubmitted case, after an additional-evidence request was resolved.
  baseAnnulmentRegistration({
    id: "AN-13",
    reference: "AN-DEMO-2026-0013",
    status: "RESUBMITTED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0009", decisionNumber: "ANN-JGT-DEMO-0009" }),
    correctionRequests: [
      {
        id: "ACR-2",
        requestType: "EVIDENCE",
        requestedBy: CIVIL_REGISTRAR_DEMO_NAME,
        requestedAt: isoDaysAgo(9),
        responseDeadline: isoDaysAgo(2),
        notifyApplicants: true,
        resolvedAt: isoDaysAgo(1),
        responseToken: "resp-tok-an-13-demo0002",
        items: [
          { id: "ACRI-2", section: "EVIDENCE", fields: ["evidence"], reason: "Proof that the decision became final was not attached.", documentsRequired: true, addressed: true, response: "Attached the court's finality certificate." },
        ],
      },
    ],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(18), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(17), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "CORRECTION_REQUIRED", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "RESUBMITTED", at: isoDaysAgo(1), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
    ],
  }),
  // 14. Foreign annulment decision awaiting recognition review.
  baseAnnulmentRegistration({
    id: "AN-14",
    reference: "AN-DEMO-2026-0014",
    status: "FOREIGN_DECISION_REVIEW",
    source: "FOREIGN_DECISION",
    decision: decision({
      country: "Republic of Sindara",
      courtOrAuthorityName: "Sindara Family Court",
      jurisdiction: "Sindara Capital District",
      courtCaseNumber: "SFC-ANN-DEMO-0091",
      decisionNumber: "ANN-JGT-SFC-0091",
      isForeign: true,
    }),
    foreignRecognition: notApplicableForeignAnnulment({
      status: "PENDING",
      country: "Republic of Sindara",
      foreignCourtOrAuthority: "Sindara Family Court",
      jurisdiction: "Sindara Capital District",
      party1Nationality: "Sindaran",
      party2Nationality: "Demo Republic",
      translationRequired: true,
      translationProvided: true,
      authenticationRequired: true,
      authenticationProvided: false,
      exequaturOrRecognitionRequired: true,
      exequaturOrRecognitionProvided: false,
      missingRequirements: ["Authentication/legalization", "Exequatur or recognition decision"],
    }),
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "FOREIGN_DECISION_REVIEW", at: isoDaysAgo(14), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 15. Approved annulment awaiting registration — legal-effect
  // classification confirmed and locked, marriage/SDID not yet updated.
  baseAnnulmentRegistration({
    id: "AN-15",
    reference: "AN-DEMO-2026-0015",
    status: "APPROVED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0010", decisionNumber: "ANN-JGT-DEMO-0010" }),
    decisionVerification: { status: "VERIFIED", checkedAt: isoDaysAgo(3), checkedBy: CIVIL_REGISTRAR_DEMO_NAME, results: [], overallOutcome: "VERIFIED" },
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "ANNULLED_FROM_DECISION_DATE",
      confirmedClassification: "ANNULLED_FROM_DECISION_DATE",
      effectiveDate: isoDaysAgo(30),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      classificationHistory: [{ classification: "ANNULLED_FROM_DECISION_DATE", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(2), locked: true }],
      lockedAt: isoDaysAgo(1),
    }),
    approvedAt: isoDaysAgo(1),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    reviewDecisions: [{ type: "APPROVE", decidedBy: CIVIL_REGISTRAR_DEMO_NAME, decidedAt: isoDaysAgo(1), confirmedDidNotPrepare: true, confirmedNoConflictOfInterest: true }],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(15), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(14), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(5), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 16. Registered annulment, SDID synchronization pending.
  baseAnnulmentRegistration({
    id: "AN-16",
    reference: "AN-DEMO-2026-0016",
    status: "REGISTERED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0011", decisionNumber: "ANN-JGT-DEMO-0011" }),
    affectedParty1: affectedParty("PARTY_1", "Nora", "Diallo", "FEMALE", 28, { nin: "DEMO-NIN-2026-006500" }),
    affectedParty2: affectedParty("PARTY_2", "Yusuf", "Barre", "MALE", 30, { nin: "DEMO-NIN-2026-006501" }),
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "ANNULLED_FROM_EFFECTIVE_DATE",
      confirmedClassification: "ANNULLED_FROM_EFFECTIVE_DATE",
      effectiveDate: isoDaysAgo(1),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the date stated in the decision." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the date stated in the decision." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      classificationHistory: [{ classification: "ANNULLED_FROM_EFFECTIVE_DATE", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(6), locked: true }],
      lockedAt: isoDaysAgo(5),
    }),
    approvedAt: isoDaysAgo(5),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(1),
    registrationEvent: {
      id: "ARE-1",
      registrationNumber: "CRVS-ANNULMENT-DEMO-0001",
      registeredAt: isoDaysAgo(1),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_ANNULMENT_OFFICE_ID,
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      effectiveDate: isoDaysAgo(1),
      courtCaseNumber: "RDIC-ANN-DEMO-0011",
      decisionNumber: "ANN-JGT-DEMO-0011",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0024",
      legalEffectClassification: "ANNULLED_FROM_EFFECTIVE_DATE",
      party1Summary: { firstName: "Nora", lastName: "Diallo" },
      party2Summary: { firstName: "Yusuf", lastName: "Barre" },
    },
    marriageAnnulmentUpdate: {
      applied: false,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: "ANNULLED_FROM_EFFECTIVE_DATE",
      updatedAt: isoDaysAgo(1),
      annulmentRegistrationReference: "AN-DEMO-2026-0016",
    },
    existingMarriageCertificateConsequence: {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but marked restricted.",
      appliedAt: isoDaysAgo(1),
    },
    sdid: {
      status: "PENDING",
      party1: { status: "PENDING", attempts: [], idempotencyKey: "ANNULMENT-SDID-SYNC-AN-16-PARTY_1" },
      party2: { status: "PENDING", attempts: [], idempotencyKey: "ANNULMENT-SDID-SYNC-AN-16-PARTY_2" },
    },
    recordEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(1), reasons: ["SDID synchronization has not yet completed for both affected parties."] },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(1), reasons: ["SDID synchronization has not yet completed for both affected parties."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(20), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(19), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(6), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(5), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 17. Registered, both SDID updates successful.
  baseAnnulmentRegistration({
    id: "AN-17",
    reference: "AN-DEMO-2026-0017",
    status: "REGISTERED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0012", decisionNumber: "ANN-JGT-DEMO-0012" }),
    affectedParty1: affectedParty("PARTY_1", "Camille", "Rousseau", "FEMALE", 32, { nin: "DEMO-NIN-2026-006600" }),
    affectedParty2: affectedParty("PARTY_2", "Ibrahim", "Sesay", "MALE", 35, { nin: "DEMO-NIN-2026-006601" }),
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "ANNULLED_FROM_DECISION_DATE",
      confirmedClassification: "ANNULLED_FROM_DECISION_DATE",
      effectiveDate: isoDaysAgo(45),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      classificationHistory: [{ classification: "ANNULLED_FROM_DECISION_DATE", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(51), locked: true }],
      lockedAt: isoDaysAgo(50),
    }),
    approvedAt: isoDaysAgo(50),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(45),
    registrationEvent: {
      id: "ARE-2",
      registrationNumber: "CRVS-ANNULMENT-DEMO-0002",
      registeredAt: isoDaysAgo(45),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_ANNULMENT_OFFICE_ID,
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      effectiveDate: isoDaysAgo(45),
      courtCaseNumber: "RDIC-ANN-DEMO-0012",
      decisionNumber: "ANN-JGT-DEMO-0012",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0025",
      legalEffectClassification: "ANNULLED_FROM_DECISION_DATE",
      party1Summary: { firstName: "Camille", lastName: "Rousseau" },
      party2Summary: { firstName: "Ibrahim", lastName: "Sesay" },
    },
    marriageAnnulmentUpdate: {
      applied: false,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: "ANNULLED_FROM_DECISION_DATE",
      updatedAt: isoDaysAgo(45),
      annulmentRegistrationReference: "AN-DEMO-2026-0017",
    },
    existingMarriageCertificateConsequence: {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but marked restricted.",
      appliedAt: isoDaysAgo(45),
    },
    sdid: {
      status: "BOTH_IDENTITIES_UPDATED",
      relationshipUpdated: true,
      party1: {
        status: "IDENTITY_UPDATED",
        attempts: [{ at: isoDaysAgo(45), outcome: "SUCCESS" }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-17-PARTY_1",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0001",
        linkedNin: "DEMO-NIN-2026-006600",
        resultingCivilStatus: "SINGLE",
        completedAt: isoDaysAgo(45),
      },
      party2: {
        status: "IDENTITY_UPDATED",
        attempts: [{ at: isoDaysAgo(45), outcome: "SUCCESS" }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-17-PARTY_2",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0002",
        linkedNin: "DEMO-NIN-2026-006601",
        resultingCivilStatus: "SINGLE",
        completedAt: isoDaysAgo(45),
      },
    },
    recordEligibility: { status: "ELIGIBLE", checkedAt: isoDaysAgo(45), reasons: [] },
    certificateEligibility: { status: "ELIGIBLE", checkedAt: isoDaysAgo(45), reasons: [] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(60), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(58), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(52), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(50), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(45), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 18. Registered, partial SDID synchronization failure.
  baseAnnulmentRegistration({
    id: "AN-18",
    reference: "AN-DEMO-2026-0018",
    status: "REGISTERED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0013", decisionNumber: "ANN-JGT-DEMO-0013" }),
    affectedParty1: affectedParty("PARTY_1", "Elif", "Kaya", "FEMALE", 27, { nin: "DEMO-NIN-2026-006700" }),
    affectedParty2: affectedParty("PARTY_2", "Femi", "Balogun", "MALE", 29, { nin: "DEMO-NIN-2026-006701" }),
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "VOIDABLE_AND_ANNULLED",
      confirmedClassification: "VOIDABLE_AND_ANNULLED",
      effectiveDate: isoDaysAgo(8),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Marriage was voidable and has now been annulled." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Marriage was voidable and has now been annulled." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      classificationHistory: [{ classification: "VOIDABLE_AND_ANNULLED", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(9), locked: true }],
      lockedAt: isoDaysAgo(8),
    }),
    approvedAt: isoDaysAgo(8),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(2),
    registrationEvent: {
      id: "ARE-3",
      registrationNumber: "CRVS-ANNULMENT-DEMO-0003",
      registeredAt: isoDaysAgo(2),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_ANNULMENT_OFFICE_ID,
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      effectiveDate: isoDaysAgo(2),
      courtCaseNumber: "RDIC-ANN-DEMO-0013",
      decisionNumber: "ANN-JGT-DEMO-0013",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0026",
      legalEffectClassification: "VOIDABLE_AND_ANNULLED",
      party1Summary: { firstName: "Elif", lastName: "Kaya" },
      party2Summary: { firstName: "Femi", lastName: "Balogun" },
    },
    marriageAnnulmentUpdate: {
      applied: false,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: "VOIDABLE_AND_ANNULLED",
      updatedAt: isoDaysAgo(2),
      annulmentRegistrationReference: "AN-DEMO-2026-0018",
    },
    existingMarriageCertificateConsequence: {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but marked restricted.",
      appliedAt: isoDaysAgo(2),
    },
    sdid: {
      status: "PARTIAL_FAILURE",
      relationshipUpdated: true,
      party1: {
        status: "IDENTITY_UPDATED",
        attempts: [{ at: isoDaysAgo(2), outcome: "SUCCESS" }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-18-PARTY_1",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0003",
        linkedNin: "DEMO-NIN-2026-006700",
        resultingCivilStatus: "SINGLE",
        completedAt: isoDaysAgo(2),
      },
      party2: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(2), outcome: "FAILED", failureCode: "SDID_SERVICE_TIMEOUT", failureMessage: "The identity service did not respond in time." }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-18-PARTY_2",
        lastFailureCode: "SDID_SERVICE_TIMEOUT",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0004",
        linkedNin: "DEMO-NIN-2026-006701",
      },
    },
    recordEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(2), reasons: ["SDID synchronization succeeded for one affected party only — the second affected party's identity update has not yet succeeded on retry."] },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(2), reasons: ["SDID synchronization succeeded for one affected party only — the second affected party's identity update has not yet succeeded on retry."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(12), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(11), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(8), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 19. Registered, both SDID updates failed.
  baseAnnulmentRegistration({
    id: "AN-19",
    reference: "AN-DEMO-2026-0019",
    status: "REGISTERED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0014", decisionNumber: "ANN-JGT-DEMO-0014" }),
    affectedParty1: affectedParty("PARTY_1", "Josefina", "Alves", "FEMALE", 37, { nin: "DEMO-NIN-2026-006800" }),
    affectedParty2: affectedParty("PARTY_2", "Marcus", "Odhiambo", "MALE", 40, { nin: "DEMO-NIN-2026-006801" }),
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "VOID_FROM_INCEPTION",
      confirmedClassification: "VOID_FROM_INCEPTION",
      effectiveDate: isoDaysAgo(9),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Decision states the marriage was void from inception." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Decision states the marriage was void from inception." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      supervisorReviewedBy: CRVS_SUPERVISOR_DEMO_NAME,
      supervisorReviewedAt: isoDaysAgo(9),
      classificationHistory: [{ classification: "VOID_FROM_INCEPTION", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(10), note: "Supervisor-reviewed per policy — void-from-inception classifications always require review.", locked: true }],
      lockedAt: isoDaysAgo(9),
    }),
    approvedAt: isoDaysAgo(9),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(3),
    registrationEvent: {
      id: "ARE-4",
      registrationNumber: "CRVS-ANNULMENT-DEMO-0004",
      registeredAt: isoDaysAgo(3),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_ANNULMENT_OFFICE_ID,
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      effectiveDate: isoDaysAgo(3),
      courtCaseNumber: "RDIC-ANN-DEMO-0014",
      decisionNumber: "ANN-JGT-DEMO-0014",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0027",
      legalEffectClassification: "VOID_FROM_INCEPTION",
      party1Summary: { firstName: "Josefina", lastName: "Alves" },
      party2Summary: { firstName: "Marcus", lastName: "Odhiambo" },
    },
    marriageAnnulmentUpdate: {
      applied: false,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: "VOID_FROM_INCEPTION",
      updatedAt: isoDaysAgo(3),
      annulmentRegistrationReference: "AN-DEMO-2026-0019",
    },
    existingMarriageCertificateConsequence: {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but marked restricted.",
      appliedAt: isoDaysAgo(3),
    },
    sdid: {
      status: "FAILED",
      party1: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(3), outcome: "FAILED", failureCode: "SDID_DATA_CONFLICT", failureMessage: "Submitted civil-status update conflicts with an existing SDID record." }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-19-PARTY_1",
        lastFailureCode: "SDID_DATA_CONFLICT",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0005",
        linkedNin: "DEMO-NIN-2026-006800",
      },
      party2: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(3), outcome: "FAILED", failureCode: "SDID_VALIDATION_ERROR", failureMessage: "The identity service rejected the submitted update as incomplete." }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-19-PARTY_2",
        lastFailureCode: "SDID_VALIDATION_ERROR",
        linkedFoundationalIdentityId: "FID-ANNULMENT-0006",
        linkedNin: "DEMO-NIN-2026-006801",
      },
    },
    recordEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(3), reasons: ["SDID synchronization failed for both affected parties and has not yet succeeded on retry."] },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(3), reasons: ["SDID synchronization failed for both affected parties and has not yet succeeded on retry."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(14), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(13), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(3), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 20. Registered, identity linkage uncertain for both affected parties —
  // manual identity-linking review, no unsafe automatic update performed.
  baseAnnulmentRegistration({
    id: "AN-20",
    reference: "AN-DEMO-2026-0020",
    status: "REGISTERED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0015", decisionNumber: "ANN-JGT-DEMO-0015" }),
    affectedParty1: affectedParty("PARTY_1", "Ottilie", "Vance", "FEMALE", 34, { identityMatchConfidence: "LOW_CONFIDENCE" }),
    affectedParty2: affectedParty("PARTY_2", "Kelvin", "Mwangi", "MALE", 36, { identityMatchConfidence: "LOW_CONFIDENCE" }),
    legalEffect: unclassifiedLegalEffect({
      proposedClassification: "ANNULLED_FROM_DECISION_DATE",
      confirmedClassification: "ANNULLED_FROM_DECISION_DATE",
      effectiveDate: isoDaysAgo(10),
      marriageStatusResult: "ANNULLED",
      proposedSdid: {
        party1: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
        party2: { proposedCivilStatus: "SINGLE", rationale: "Marriage annulled effective the decision date." },
      },
      certificateConsequence: "RESTRICT_EXISTING_CERTIFICATE",
      reviewingOfficerId: CIVIL_REGISTRAR_DEMO_ID,
      reviewingOfficerName: CIVIL_REGISTRAR_DEMO_NAME,
      classificationHistory: [{ classification: "ANNULLED_FROM_DECISION_DATE", setBy: CIVIL_REGISTRAR_DEMO_NAME, setAt: isoDaysAgo(11), locked: true }],
      lockedAt: isoDaysAgo(10),
    }),
    approvedAt: isoDaysAgo(10),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(4),
    registrationEvent: {
      id: "ARE-5",
      registrationNumber: "CRVS-ANNULMENT-DEMO-0005",
      registeredAt: isoDaysAgo(4),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_ANNULMENT_OFFICE_ID,
      officeName: DEMO_ANNULMENT_OFFICE_NAME,
      effectiveDate: isoDaysAgo(4),
      courtCaseNumber: "RDIC-ANN-DEMO-0015",
      decisionNumber: "ANN-JGT-DEMO-0015",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0028",
      legalEffectClassification: "ANNULLED_FROM_DECISION_DATE",
      party1Summary: { firstName: "Ottilie", lastName: "Vance" },
      party2Summary: { firstName: "Kelvin", lastName: "Mwangi" },
    },
    marriageAnnulmentUpdate: {
      applied: false,
      newCivilStatus: "ANNULLED",
      legalEffectClassification: "ANNULLED_FROM_DECISION_DATE",
      updatedAt: isoDaysAgo(4),
      annulmentRegistrationReference: "AN-DEMO-2026-0020",
    },
    existingMarriageCertificateConsequence: {
      status: "RESTRICTED",
      reason: "The marriage has been annulled; the existing marriage certificate is preserved in history but marked restricted.",
      appliedAt: isoDaysAgo(4),
    },
    sdid: {
      status: "MANUAL_REVIEW",
      manualReview: { reason: "Identity linkage could not be confirmed for both affected parties.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      party1: {
        status: "MANUAL_REVIEW",
        attempts: [{ at: isoDaysAgo(4), outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: "No SDID identity could be matched with sufficient confidence." }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-20-PARTY_1",
        manualReview: { reason: "No SDID identity could be matched with sufficient confidence.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      },
      party2: {
        status: "MANUAL_REVIEW",
        attempts: [{ at: isoDaysAgo(4), outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: "No SDID identity could be matched with sufficient confidence." }],
        idempotencyKey: "ANNULMENT-SDID-SYNC-AN-20-PARTY_2",
        manualReview: { reason: "No SDID identity could be matched with sufficient confidence.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      },
    },
    recordEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(4), reasons: ["SDID identity linkage requires manual review before this annulment can be treated as fully synchronized."] },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(4), reasons: ["SDID identity linkage requires manual review before this annulment can be treated as fully synchronized."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(11), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 21. Rejected application.
  baseAnnulmentRegistration({
    id: "AN-21",
    reference: "AN-DEMO-2026-0021",
    status: "REJECTED",
    decision: decision({ courtCaseNumber: "RDIC-ANN-DEMO-0016", decisionNumber: "ANN-JGT-DEMO-0016" }),
    rejectedAt: isoDaysAgo(6),
    rejectedBy: CIVIL_REGISTRAR_DEMO_ID,
    rejectionReason: {
      reason: "Applicant authority unclear",
      explanation: "The applicant could not demonstrate authorization to submit on behalf of the affected parties.",
      evidenceRefs: [],
      applicantsNotified: true,
    },
    reviewDecisions: [{ type: "REJECT", decidedBy: CIVIL_REGISTRAR_DEMO_NAME, decidedAt: isoDaysAgo(6), reason: "Applicant authority unclear" }],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: ANNULMENT_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(8), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REJECTED", at: isoDaysAgo(6), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Applicant authority unclear" },
    ],
  }),
];

// Pre-existing SDID identities the annulment sync links against (spec §24
// "never fabricate an identity, always mutate an existing one"). Only
// AN-17/AN-18/AN-19 (whose sync has actually progressed past matching) get
// identities here; AN-20's deliberately has none, so the manual-review
// scenario reflects a genuine no-match rather than a seeded shortcut.
export const seedAnnulmentLinkedFoundationalIdentities = (): FoundationalIdentity[] => {
  type PersonSpec = {
    id: string;
    nin: string;
    first: string;
    last: string;
    age: number;
    sex: "FEMALE" | "MALE";
    annulled: boolean;
    annulmentReference?: string;
  };

  const person = (spec: PersonSpec): Omit<FoundationalIdentity, "relationships"> => ({
    id: spec.id,
    fictionalNin: spec.nin,
    childFirstName: spec.first,
    childLastName: spec.last,
    sex: spec.sex,
    dateOfBirth: isoDaysAgo(365 * spec.age),
    placeOfBirth: "Demo Referral Hospital",
    birthRecordReference: `CRVS-BIRTH-DEMO-HIST-${spec.nin.slice(-4)}`,
    identityStatus: "ACTIVE",
    biometrics: "NOT_REQUIRED_FOR_NEWBORN",
    credential: "NOT_ISSUED",
    source: "CRVS_BIRTH_RECORD",
    createdAt: isoDaysAgo(365 * spec.age - 10),
    idempotencyKey: `ANNULMENT-SDID-SYNC-${spec.id}`,
    maritalStatus: spec.annulled ? "SINGLE" : "MARRIED",
    maritalStatusUpdatedAt: isoDaysAgo(45),
    maritalStatusUpdatedByMarriageReference: spec.annulmentReference,
  });

  // Relationship reclassification happens as soon as BOTH identities are
  // matched during sync — independent of whether each party's own
  // field-update attempt then succeeds or fails — so AN-18's partial failure
  // and AN-19's full failure both still show a DISSOLVED relationship; only
  // AN-20's uncertain-linkage case leaves the relationship ACTIVE.
  const pair = (a: PersonSpec, b: PersonSpec, relationshipId: string, relationshipStatus: "ACTIVE" | "DISSOLVED"): FoundationalIdentity[] => [
    person(a),
    {
      ...person(b),
      relationships: [
        {
          id: relationshipId,
          type: "SPOUSE",
          identityAId: a.id,
          identityBId: b.id,
          marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0025",
          createdAt: isoDaysAgo(1500),
          status: relationshipStatus,
        },
      ],
    },
  ];

  return [
    ...pair(
      { id: "FID-ANNULMENT-0001", nin: "DEMO-NIN-2026-006600", first: "Camille", last: "Rousseau", age: 32, sex: "FEMALE", annulled: true, annulmentReference: "AN-DEMO-2026-0017" },
      { id: "FID-ANNULMENT-0002", nin: "DEMO-NIN-2026-006601", first: "Ibrahim", last: "Sesay", age: 35, sex: "MALE", annulled: true, annulmentReference: "AN-DEMO-2026-0017" },
      "AREL-1",
      "DISSOLVED"
    ),
    ...pair(
      { id: "FID-ANNULMENT-0003", nin: "DEMO-NIN-2026-006700", first: "Elif", last: "Kaya", age: 27, sex: "FEMALE", annulled: true, annulmentReference: "AN-DEMO-2026-0018" },
      { id: "FID-ANNULMENT-0004", nin: "DEMO-NIN-2026-006701", first: "Femi", last: "Balogun", age: 29, sex: "MALE", annulled: false },
      "AREL-2",
      "DISSOLVED"
    ),
    ...pair(
      { id: "FID-ANNULMENT-0005", nin: "DEMO-NIN-2026-006800", first: "Josefina", last: "Alves", age: 37, sex: "FEMALE", annulled: false },
      { id: "FID-ANNULMENT-0006", nin: "DEMO-NIN-2026-006801", first: "Marcus", last: "Odhiambo", age: 40, sex: "MALE", annulled: false },
      "AREL-3",
      "DISSOLVED"
    ),
  ];
};
