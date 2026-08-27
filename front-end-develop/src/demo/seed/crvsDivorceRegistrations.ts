// Realistic demo seed data for the divorce-notification / divorce-
// registration workflow (spec §28) — one hand-authored scenario per bullet
// in the spec's seed-data list, following the same
// base-builder-plus-overrides convention as crvsMarriageApplications.ts.
// Names, courts and reference numbers are invented fictional demo data.
import {
  DivorceNotification,
  DivorceRegistration,
  DivorceApplicant,
  FormerSpouse,
  DivorceJudgment,
  ForeignDivorceRecognition,
  FoundationalIdentity,
  emptyDivorceReviewSections,
} from "@/domain/crvs/types";
import { isoDaysAgo, isoDaysFromNow } from "./fixtures";
import {
  DEMO_DIVORCE_OFFICE_ID,
  DEMO_DIVORCE_OFFICE_NAME,
  DEMO_JURISDICTION,
  DIVORCE_REGISTRATION_OFFICER_DEMO_ID,
  DIVORCE_REGISTRATION_OFFICER_DEMO_NAME,
  CIVIL_REGISTRAR_DEMO_ID,
  CIVIL_REGISTRAR_DEMO_NAME,
  CRVS_SUPERVISOR_DEMO_NAME,
  COURT_NOTIFICATION_OFFICER_DEMO_NAME,
} from "./crvsAccounts";

const applicantFromSpouse = (
  documentNumber: string,
  firstName: string,
  lastName: string,
  ageYears: number,
  overrides: Partial<DivorceApplicant> = {}
): DivorceApplicant => ({
  documentType: "NATIONAL_ID",
  documentNumber,
  firstName,
  lastName,
  dateOfBirth: isoDaysAgo(365 * ageYears),
  nationality: "Demo Republic",
  residence: "Riverside, Demo District",
  phone: "+000 555 0199",
  relationshipToCase: "FORMER_SPOUSE_1",
  identityVerification: "VERIFIED",
  ...overrides,
});

const formerSpouse = (
  spouseKey: "SPOUSE1" | "SPOUSE2",
  firstName: string,
  lastName: string,
  sex: "MALE" | "FEMALE",
  ageYears: number,
  overrides: Partial<FormerSpouse> = {}
): FormerSpouse => ({
  spouseKey,
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

const judgment = (overrides: Partial<DivorceJudgment> = {}): DivorceJudgment => ({
  country: "Rwanda",
  courtOrAuthorityName: "Demo District Intermediate Court",
  courtCaseNumber: "RDIC-DEMO-0001",
  judgmentNumber: "JGT-DEMO-0001",
  judgmentDate: isoDaysAgo(60),
  finalityDate: isoDaysAgo(30),
  decisionType: "MUTUAL_CONSENT",
  registrationEffectiveDate: isoDaysAgo(30),
  isForeign: false,
  ...overrides,
});

const notApplicableForeign = (overrides: Partial<ForeignDivorceRecognition> = {}): ForeignDivorceRecognition => ({
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

type Overrides = Partial<DivorceRegistration> & Pick<DivorceRegistration, "id" | "reference" | "status">;

const baseDivorceRegistration = (overrides: Overrides): DivorceRegistration => ({
  source: "APPLICANT",
  jurisdiction: DEMO_JURISDICTION,
  applicant: applicantFromSpouse("DEMO-ID-0501", "Amara", "Bello", 30, { relationshipToCase: "FORMER_SPOUSE_1" }),
  existingMarriage: {
    status: "MATCHED",
    candidates: [],
    notFoundEvidence: [],
    selected: {
      registrationNumber: "CRVS-MARRIAGE-DEMO-SEED-0001",
      marriageDate: isoDaysAgo(1500),
      marriagePlace: DEMO_DIVORCE_OFFICE_NAME,
      spouse1Name: "Amara Bello",
      spouse2Name: "Kwame Toure",
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      matchConfidence: "HIGH",
    },
    searchedAt: isoDaysAgo(20),
    searchedBy: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME,
  },
  formerSpouse1: formerSpouse("SPOUSE1", "Amara", "Bello", "FEMALE", 30),
  formerSpouse2: formerSpouse("SPOUSE2", "Kwame", "Toure", "MALE", 33),
  judgment: judgment(),
  judgmentVerification: { status: "NOT_STARTED", results: [] },
  foreignRecognition: notApplicableForeign(),
  evidence: [
    { id: "DEV-SEED-1", documentType: "FINAL_COURT_JUDGMENT", fileName: "final-judgment.pdf", fileType: "application/pdf", fileSizeKb: 480, uploadedAt: isoDaysAgo(20), uploadedBy: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME, verification: "VERIFIED" },
    { id: "DEV-SEED-2", documentType: "MARRIAGE_CERTIFICATE_OR_RECORD", fileName: "marriage-certificate.pdf", fileType: "application/pdf", fileSizeKb: 210, uploadedAt: isoDaysAgo(20), uploadedBy: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME, verification: "VERIFIED" },
  ],
  processingOffice: {
    marriageRegisteredOfficeName: DEMO_DIVORCE_OFFICE_NAME,
    applicantDomicileOfficeName: DEMO_DIVORCE_OFFICE_NAME,
    selectedProcessingOfficeId: DEMO_DIVORCE_OFFICE_ID,
    selectedProcessingOfficeName: DEMO_DIVORCE_OFFICE_NAME,
    embassyOrForeignOfficePath: false,
    jurisdictionResult: "CONFIRMED",
  },
  reviewSections: emptyDivorceReviewSections(),
  reviewDecisions: [],
  correctionRequests: [],
  officerId: DIVORCE_REGISTRATION_OFFICER_DEMO_ID,
  officerName: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME,
  accuracyDeclarationConfirmed: true,
  authorityToSubmitConfirmed: true,
  judgmentFinalConfirmed: true,
  privacyAcknowledged: true,
  electronicSubmissionConfirmed: true,
  createdAt: isoDaysAgo(21),
  updatedAt: isoDaysAgo(20),
  submittedAt: isoDaysAgo(20),
  sdid: {
    status: "NOT_READY",
    spouse1: { status: "NOT_READY", attempts: [] },
    spouse2: { status: "NOT_READY", attempts: [] },
  },
  statusHistory: [{ status: "DRAFT", at: isoDaysAgo(21), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME }],
  version: 1,
  ...overrides,
});

export const seedCrvsDivorceNotifications = (): DivorceNotification[] => [
  // 1. Court notification awaiting validation.
  {
    id: "DN-1",
    reference: "DN-DEMO-2026-0001",
    status: "RECEIVED",
    courtName: "Demo District Intermediate Court",
    courtCaseNumber: "RDIC-DEMO-0042",
    judgmentNumber: "JGT-DEMO-0042",
    judgmentDate: isoDaysAgo(15),
    finalityDate: isoDaysAgo(5),
    applicantNamesAsReported: "Lena Farrow & Tariq Haile",
    marriageReferenceAsReported: "CRVS-MARRIAGE-DEMO-0002",
    signedJudgmentDocument: {
      id: "DEV-DN-1",
      documentType: "FINAL_COURT_JUDGMENT",
      fileName: "rdic-0042-judgment.pdf",
      fileType: "application/pdf",
      fileSizeKb: 512,
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

export const seedCrvsDivorceRegistrations = (): DivorceRegistration[] => [
  // 2. Applicant-submitted divorce, still in review.
  baseDivorceRegistration({
    id: "DR-2",
    reference: "DR-DEMO-2026-0002",
    status: "UNDER_REVIEW",
    reviewerId: CIVIL_REGISTRAR_DEMO_ID,
    reviewerName: CIVIL_REGISTRAR_DEMO_NAME,
    reviewLockedAt: isoDaysAgo(2),
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(21), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(20), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 3. Existing marriage successfully matched (Step 3 complete), still a
  // draft awaiting the remaining wizard steps.
  baseDivorceRegistration({
    id: "DR-3",
    reference: "DR-DEMO-2026-0003",
    status: "DRAFT",
    submittedAt: undefined,
    formerSpouse2: formerSpouse("SPOUSE2", "Kwame", "Toure", "MALE", 33, { identityMatchConfidence: "PROBABLE", identityVerification: "UNVERIFIED_PROVIDED" }),
    statusHistory: [{ status: "DRAFT", at: isoDaysAgo(3), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME }],
  }),
  // 4. Marriage record not found — routed to exception review, applicant
  // provided supporting marriage evidence instead.
  baseDivorceRegistration({
    id: "DR-4",
    reference: "DR-DEMO-2026-0004",
    status: "EXCEPTION_REVIEW",
    source: "STAFF_ASSISTED",
    applicant: applicantFromSpouse("DEMO-ID-0502", "Diego", "Farrow", 40, { relationshipToCase: "STAFF", authorizationBasis: "Staff-assisted registration on behalf of the applicant." }),
    existingMarriage: {
      status: "NOT_FOUND",
      candidates: [],
      searchCriteria: { spouse1Name: "Priya Gomez", spouse2Name: "Owen Haile", marriageDate: isoDaysAgo(2000) },
      searchedAt: isoDaysAgo(8),
      searchedBy: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME,
      notFoundEvidence: [
        { id: "DEV-DR4-1", documentType: "MARRIAGE_CERTIFICATE_OR_RECORD", fileName: "old-marriage-booklet.pdf", fileType: "application/pdf", fileSizeKb: 340, uploadedAt: isoDaysAgo(8), uploadedBy: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME, verification: "UNVERIFIED_PROVIDED" },
      ],
    },
    formerSpouse1: formerSpouse("SPOUSE1", "Priya", "Gomez", "FEMALE", 38, { linkedToSelectedMarriage: false }),
    formerSpouse2: formerSpouse("SPOUSE2", "Owen", "Haile", "MALE", 41, { linkedToSelectedMarriage: false }),
    exception: { type: "MARRIAGE_RECORD_NOT_FOUND", reason: "The applicant's declared marriage could not be located in the registry.", status: "OPEN", assignedTo: CIVIL_REGISTRAR_DEMO_NAME, priority: "MEDIUM" },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(9), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(8), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(8), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME, note: "Marriage record not found." },
    ],
  }),
  // 5. Former spouse identity mismatch — routed to exception review.
  baseDivorceRegistration({
    id: "DR-5",
    reference: "DR-DEMO-2026-0005",
    status: "EXCEPTION_REVIEW",
    formerSpouse2: formerSpouse("SPOUSE2", "Kwame", "Toure", "MALE", 33, {
      identityMatchConfidence: "LOW_CONFIDENCE",
      identityVerification: "MANUAL_REVIEW_REQUIRED",
      linkedToSelectedMarriage: false,
    }),
    exception: {
      type: "MARRIAGE_IDENTITY_MISMATCH",
      reason: "Former spouse 2's declared identity does not match the identity recorded on the selected marriage.",
      triggeringRule: "FORMER_SPOUSE_2_IDENTITY",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "HIGH",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(11), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(10), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Identity mismatch on former spouse 2." },
    ],
  }),
  // 6. Duplicate divorce registration — a second request against a marriage
  // that already has an active registration on file (DR-2's marriage).
  baseDivorceRegistration({
    id: "DR-6",
    reference: "DR-DEMO-2026-0006",
    status: "EXCEPTION_REVIEW",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0002", judgmentNumber: "JGT-DEMO-0002" }),
    exception: {
      type: "DUPLICATE_DIVORCE",
      reason: "Another active divorce registration already exists for this marriage.",
      triggeringRule: "DUPLICATE_DIVORCE",
      affectedData: "DR-DEMO-2026-0002",
      status: "OPEN",
      assignedTo: CIVIL_REGISTRAR_DEMO_NAME,
      priority: "HIGH",
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(6), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(5), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Duplicate divorce registration detected." },
    ],
  }),
  // 7. Judgment not final.
  baseDivorceRegistration({
    id: "DR-7",
    reference: "DR-DEMO-2026-0007",
    status: "EXCEPTION_REVIEW",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0003", judgmentNumber: "JGT-DEMO-0003", finalityDate: undefined }),
    judgmentFinalConfirmed: false,
    exception: { type: "JUDGMENT_NOT_FINAL", reason: "The court decision has not yet been recorded as final.", triggeringRule: "JUDGMENT_FINALITY", status: "OPEN", assignedTo: CIVIL_REGISTRAR_DEMO_NAME, priority: "MEDIUM" },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(14), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(13), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(12), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Judgment not yet final." },
    ],
  }),
  // 8. Judgment verification pending.
  baseDivorceRegistration({
    id: "DR-8",
    reference: "DR-DEMO-2026-0008",
    status: "JUDGMENT_VERIFICATION",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0004", judgmentNumber: "JGT-DEMO-0004" }),
    judgmentVerification: { status: "PENDING", checkedAt: isoDaysAgo(1), checkedBy: CIVIL_REGISTRAR_DEMO_NAME, results: [] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(7), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(6), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "JUDGMENT_VERIFICATION", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 9. Correction required.
  baseDivorceRegistration({
    id: "DR-9",
    reference: "DR-DEMO-2026-0009",
    status: "CORRECTION_REQUIRED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0005", judgmentNumber: "JGT-DEMO-0005" }),
    correctionRequests: [
      {
        id: "DCR-1",
        requestedBy: CIVIL_REGISTRAR_DEMO_NAME,
        requestedAt: isoDaysAgo(3),
        responseDeadline: isoDaysFromNow(11),
        notifyApplicants: true,
        responseToken: "resp-tok-dr-9-demo0001",
        items: [
          { id: "DCRI-1", section: "COURT_DECISION", fields: ["judgment.courtRegistryReference"], reason: "Court registry reference is missing.", documentsRequired: false, addressed: false },
          { id: "DCRI-2", section: "EVIDENCE", fields: ["evidence"], reason: "Proof that the decision became final was not attached.", documentsRequired: true, addressed: false },
        ],
      },
    ],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(12), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(11), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "CORRECTION_REQUIRED", at: isoDaysAgo(3), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Court registry reference is missing." },
    ],
  }),
  // 10. Resubmitted case.
  baseDivorceRegistration({
    id: "DR-10",
    reference: "DR-DEMO-2026-0010",
    status: "RESUBMITTED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0006", judgmentNumber: "JGT-DEMO-0006", courtRegistryReference: "REG-DEMO-0006" }),
    correctionRequests: [
      {
        id: "DCR-2",
        requestedBy: CIVIL_REGISTRAR_DEMO_NAME,
        requestedAt: isoDaysAgo(9),
        responseDeadline: isoDaysAgo(2),
        notifyApplicants: true,
        resolvedAt: isoDaysAgo(1),
        responseToken: "resp-tok-dr-10-demo0002",
        items: [{ id: "DCRI-3", section: "COURT_DECISION", fields: ["judgment.courtRegistryReference"], reason: "Court registry reference was missing.", documentsRequired: false, addressed: true, response: "Added registry reference REG-DEMO-0006." }],
      },
    ],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(18), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(17), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "CORRECTION_REQUIRED", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "RESUBMITTED", at: isoDaysAgo(1), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
    ],
  }),
  // 11. Foreign divorce awaiting recognition review.
  baseDivorceRegistration({
    id: "DR-11",
    reference: "DR-DEMO-2026-0011",
    status: "FOREIGN_JUDGMENT_REVIEW",
    source: "FOREIGN_DECISION",
    judgment: judgment({ country: "Republic of Sindara", courtOrAuthorityName: "Sindara Family Court", courtCaseNumber: "SFC-DEMO-0091", judgmentNumber: "JGT-SFC-0091", isForeign: true }),
    foreignRecognition: notApplicableForeign({
      status: "PENDING",
      country: "Republic of Sindara",
      foreignCourtOrAuthority: "Sindara Family Court",
      spouse1Nationality: "Sindaran",
      spouse2Nationality: "Demo Republic",
      translationRequired: true,
      translationProvided: true,
      authenticationRequired: true,
      authenticationProvided: false,
      exequaturOrRecognitionRequired: true,
      exequaturOrRecognitionProvided: false,
      missingRequirements: ["Authentication/legalization", "Exequatur or recognition judgment"],
    }),
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "FOREIGN_JUDGMENT_REVIEW", at: isoDaysAgo(14), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 12. Existing annulment conflict.
  baseDivorceRegistration({
    id: "DR-12",
    reference: "DR-DEMO-2026-0012",
    status: "EXCEPTION_REVIEW",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0007", judgmentNumber: "JGT-DEMO-0007" }),
    exception: { type: "EXISTING_ANNULMENT", reason: "This marriage already has an annulment record on file.", triggeringRule: "POSSIBLE_ANNULMENT", status: "OPEN", assignedTo: CRVS_SUPERVISOR_DEMO_NAME, priority: "HIGH" },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(6), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(5), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "EXCEPTION_REVIEW", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Existing annulment record found." },
    ],
  }),
  // 13. Approved divorce awaiting registration.
  baseDivorceRegistration({
    id: "DR-13",
    reference: "DR-DEMO-2026-0013",
    status: "APPROVED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0008", judgmentNumber: "JGT-DEMO-0008" }),
    judgmentVerification: { status: "VERIFIED", checkedAt: isoDaysAgo(3), checkedBy: CIVIL_REGISTRAR_DEMO_NAME, results: [], overallOutcome: "VERIFIED" },
    approvedAt: isoDaysAgo(1),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    reviewDecisions: [{ type: "APPROVE", decidedBy: CIVIL_REGISTRAR_DEMO_NAME, decidedAt: isoDaysAgo(1), confirmedDidNotPrepare: true, confirmedNoConflictOfInterest: true }],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(15), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(14), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(5), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 14. Registered divorce, SDID synchronization pending.
  baseDivorceRegistration({
    id: "DR-14",
    reference: "DR-DEMO-2026-0014",
    status: "REGISTERED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0009", judgmentNumber: "JGT-DEMO-0009" }),
    formerSpouse1: formerSpouse("SPOUSE1", "Mira", "Dubois", "FEMALE", 34, { nin: "DEMO-NIN-2026-005500" }),
    formerSpouse2: formerSpouse("SPOUSE2", "Kofi", "Farrow", "MALE", 37, { nin: "DEMO-NIN-2026-005501" }),
    approvedAt: isoDaysAgo(5),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(1),
    registrationEvent: {
      id: "DRE-1",
      registrationNumber: "CRVS-DIVORCE-DEMO-0001",
      registeredAt: isoDaysAgo(1),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_DIVORCE_OFFICE_ID,
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      effectiveDate: isoDaysAgo(1),
      courtCaseNumber: "RDIC-DEMO-0009",
      judgmentNumber: "JGT-DEMO-0009",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0009",
      formerSpouse1Summary: { firstName: "Mira", lastName: "Dubois" },
      formerSpouse2Summary: { firstName: "Kofi", lastName: "Farrow" },
    },
    marriageStatusUpdate: { applied: false, newStatus: "DISSOLVED_BY_DIVORCE", updatedAt: isoDaysAgo(1), divorceRegistrationReference: "DR-DEMO-2026-0014" },
    sdid: {
      status: "PENDING",
      spouse1: { status: "PENDING", attempts: [], idempotencyKey: "DIVORCE-SDID-SYNC-DR-14-SPOUSE1" },
      spouse2: { status: "PENDING", attempts: [], idempotencyKey: "DIVORCE-SDID-SYNC-DR-14-SPOUSE2" },
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(20), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(19), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(6), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(5), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(1), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 15. Registered, both SDID updates successful.
  baseDivorceRegistration({
    id: "DR-15",
    reference: "DR-DEMO-2026-0015",
    status: "REGISTERED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0010", judgmentNumber: "JGT-DEMO-0010" }),
    formerSpouse1: formerSpouse("SPOUSE1", "Lucia", "Okoye", "FEMALE", 36, { nin: "DEMO-NIN-2026-005600" }),
    formerSpouse2: formerSpouse("SPOUSE2", "Aiden", "Toure", "MALE", 39, { nin: "DEMO-NIN-2026-005601" }),
    approvedAt: isoDaysAgo(50),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(45),
    registrationEvent: {
      id: "DRE-2",
      registrationNumber: "CRVS-DIVORCE-DEMO-0002",
      registeredAt: isoDaysAgo(45),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_DIVORCE_OFFICE_ID,
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      effectiveDate: isoDaysAgo(45),
      courtCaseNumber: "RDIC-DEMO-0010",
      judgmentNumber: "JGT-DEMO-0010",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0010",
      formerSpouse1Summary: { firstName: "Lucia", lastName: "Okoye" },
      formerSpouse2Summary: { firstName: "Aiden", lastName: "Toure" },
    },
    marriageStatusUpdate: { applied: false, newStatus: "DISSOLVED_BY_DIVORCE", updatedAt: isoDaysAgo(45), divorceRegistrationReference: "DR-DEMO-2026-0015" },
    sdid: {
      status: "BOTH_IDENTITIES_UPDATED",
      relationshipDissolved: true,
      spouse1: { status: "IDENTITY_UPDATED", attempts: [{ at: isoDaysAgo(45), outcome: "SUCCESS" }], idempotencyKey: "DIVORCE-SDID-SYNC-DR-15-SPOUSE1", linkedFoundationalIdentityId: "FID-DIVORCE-0001", linkedNin: "DEMO-NIN-2026-005600", completedAt: isoDaysAgo(45) },
      spouse2: { status: "IDENTITY_UPDATED", attempts: [{ at: isoDaysAgo(45), outcome: "SUCCESS" }], idempotencyKey: "DIVORCE-SDID-SYNC-DR-15-SPOUSE2", linkedFoundationalIdentityId: "FID-DIVORCE-0002", linkedNin: "DEMO-NIN-2026-005601", completedAt: isoDaysAgo(45) },
    },
    certificateEligibility: { status: "ELIGIBLE", checkedAt: isoDaysAgo(45), reasons: [] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(60), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(58), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(52), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(50), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(45), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 16. Registered, partial SDID synchronization failure.
  baseDivorceRegistration({
    id: "DR-16",
    reference: "DR-DEMO-2026-0016",
    status: "REGISTERED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0011", judgmentNumber: "JGT-DEMO-0011" }),
    formerSpouse1: formerSpouse("SPOUSE1", "Ines", "Jansen", "FEMALE", 29, { nin: "DEMO-NIN-2026-005700" }),
    formerSpouse2: formerSpouse("SPOUSE2", "Marco", "Kadiri", "MALE", 31, { nin: "DEMO-NIN-2026-005701" }),
    approvedAt: isoDaysAgo(8),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(2),
    registrationEvent: {
      id: "DRE-3",
      registrationNumber: "CRVS-DIVORCE-DEMO-0003",
      registeredAt: isoDaysAgo(2),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_DIVORCE_OFFICE_ID,
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      effectiveDate: isoDaysAgo(2),
      courtCaseNumber: "RDIC-DEMO-0011",
      judgmentNumber: "JGT-DEMO-0011",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0011",
      formerSpouse1Summary: { firstName: "Ines", lastName: "Jansen" },
      formerSpouse2Summary: { firstName: "Marco", lastName: "Kadiri" },
    },
    marriageStatusUpdate: { applied: false, newStatus: "DISSOLVED_BY_DIVORCE", updatedAt: isoDaysAgo(2), divorceRegistrationReference: "DR-DEMO-2026-0016" },
    sdid: {
      status: "PARTIAL_FAILURE",
      relationshipDissolved: true,
      spouse1: { status: "IDENTITY_UPDATED", attempts: [{ at: isoDaysAgo(2), outcome: "SUCCESS" }], idempotencyKey: "DIVORCE-SDID-SYNC-DR-16-SPOUSE1", linkedFoundationalIdentityId: "FID-DIVORCE-0003", linkedNin: "DEMO-NIN-2026-005700", completedAt: isoDaysAgo(2) },
      spouse2: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(2), outcome: "FAILED", failureCode: "SDID_SERVICE_TIMEOUT", failureMessage: "The identity service did not respond in time." }],
        idempotencyKey: "DIVORCE-SDID-SYNC-DR-16-SPOUSE2",
        lastFailureCode: "SDID_SERVICE_TIMEOUT",
        linkedFoundationalIdentityId: "FID-DIVORCE-0004",
        linkedNin: "DEMO-NIN-2026-005701",
      },
    },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(2), reasons: ["SDID synchronization succeeded for one former spouse only — former spouse 2's identity update has not yet succeeded on retry."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(12), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(11), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(8), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(2), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 17. Registered, both SDID updates failed.
  baseDivorceRegistration({
    id: "DR-17",
    reference: "DR-DEMO-2026-0017",
    status: "REGISTERED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0012", judgmentNumber: "JGT-DEMO-0012" }),
    formerSpouse1: formerSpouse("SPOUSE1", "Zara", "Weber", "FEMALE", 42, { nin: "DEMO-NIN-2026-005800" }),
    formerSpouse2: formerSpouse("SPOUSE2", "Otto", "Eze", "MALE", 45, { nin: "DEMO-NIN-2026-005801" }),
    approvedAt: isoDaysAgo(9),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(3),
    registrationEvent: {
      id: "DRE-4",
      registrationNumber: "CRVS-DIVORCE-DEMO-0004",
      registeredAt: isoDaysAgo(3),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_DIVORCE_OFFICE_ID,
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      effectiveDate: isoDaysAgo(3),
      courtCaseNumber: "RDIC-DEMO-0012",
      judgmentNumber: "JGT-DEMO-0012",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0012",
      formerSpouse1Summary: { firstName: "Zara", lastName: "Weber" },
      formerSpouse2Summary: { firstName: "Otto", lastName: "Eze" },
    },
    marriageStatusUpdate: { applied: false, newStatus: "DISSOLVED_BY_DIVORCE", updatedAt: isoDaysAgo(3), divorceRegistrationReference: "DR-DEMO-2026-0017" },
    sdid: {
      status: "FAILED",
      spouse1: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(3), outcome: "FAILED", failureCode: "SDID_DATA_CONFLICT", failureMessage: "Submitted marital-status update conflicts with an existing SDID record." }],
        idempotencyKey: "DIVORCE-SDID-SYNC-DR-17-SPOUSE1",
        lastFailureCode: "SDID_DATA_CONFLICT",
        linkedFoundationalIdentityId: "FID-DIVORCE-0005",
        linkedNin: "DEMO-NIN-2026-005800",
      },
      spouse2: {
        status: "FAILED",
        attempts: [{ at: isoDaysAgo(3), outcome: "FAILED", failureCode: "SDID_VALIDATION_ERROR", failureMessage: "The identity service rejected the submitted update as incomplete." }],
        idempotencyKey: "DIVORCE-SDID-SYNC-DR-17-SPOUSE2",
        lastFailureCode: "SDID_VALIDATION_ERROR",
        linkedFoundationalIdentityId: "FID-DIVORCE-0006",
        linkedNin: "DEMO-NIN-2026-005801",
      },
    },
    certificateEligibility: { status: "MANUAL_REVIEW", checkedAt: isoDaysAgo(3), reasons: ["SDID synchronization failed for both former spouses and has not yet succeeded on retry."] },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(14), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(13), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(9), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(3), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 18. Registered, identity linkage uncertain for both former spouses —
  // manual identity-linking review, no unsafe automatic update performed.
  baseDivorceRegistration({
    id: "DR-18",
    reference: "DR-DEMO-2026-0018",
    status: "REGISTERED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0013", judgmentNumber: "JGT-DEMO-0013" }),
    formerSpouse1: formerSpouse("SPOUSE1", "Bianca", "Ferrante", "FEMALE", 33, { identityMatchConfidence: "LOW_CONFIDENCE" }),
    formerSpouse2: formerSpouse("SPOUSE2", "Chidi", "Nwosu", "MALE", 35, { identityMatchConfidence: "LOW_CONFIDENCE" }),
    approvedAt: isoDaysAgo(10),
    approvedBy: CIVIL_REGISTRAR_DEMO_ID,
    approvedByName: CIVIL_REGISTRAR_DEMO_NAME,
    registeredAt: isoDaysAgo(4),
    registrationEvent: {
      id: "DRE-5",
      registrationNumber: "CRVS-DIVORCE-DEMO-0005",
      registeredAt: isoDaysAgo(4),
      registeredBy: CIVIL_REGISTRAR_DEMO_ID,
      registeredByName: CIVIL_REGISTRAR_DEMO_NAME,
      officeId: DEMO_DIVORCE_OFFICE_ID,
      officeName: DEMO_DIVORCE_OFFICE_NAME,
      effectiveDate: isoDaysAgo(4),
      courtCaseNumber: "RDIC-DEMO-0013",
      judgmentNumber: "JGT-DEMO-0013",
      marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0013",
      formerSpouse1Summary: { firstName: "Bianca", lastName: "Ferrante" },
      formerSpouse2Summary: { firstName: "Chidi", lastName: "Nwosu" },
    },
    marriageStatusUpdate: { applied: false, newStatus: "DISSOLVED_BY_DIVORCE", updatedAt: isoDaysAgo(4), divorceRegistrationReference: "DR-DEMO-2026-0018" },
    sdid: {
      status: "MANUAL_REVIEW",
      manualReview: { reason: "Identity linkage could not be confirmed for both former spouses.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      spouse1: {
        status: "MANUAL_REVIEW",
        attempts: [{ at: isoDaysAgo(4), outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: "No SDID identity could be matched with sufficient confidence." }],
        idempotencyKey: "DIVORCE-SDID-SYNC-DR-18-SPOUSE1",
        manualReview: { reason: "No SDID identity could be matched with sufficient confidence.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      },
      spouse2: {
        status: "MANUAL_REVIEW",
        attempts: [{ at: isoDaysAgo(4), outcome: "FAILED", failureCode: "SDID_NO_RELIABLE_MATCH", failureMessage: "No SDID identity could be matched with sufficient confidence." }],
        idempotencyKey: "DIVORCE-SDID-SYNC-DR-18-SPOUSE2",
        manualReview: { reason: "No SDID identity could be matched with sufficient confidence.", assignedTo: "crvs.supervisor@demo.identity.local", priority: "MEDIUM", at: isoDaysAgo(4) },
      },
    },
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(11), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "APPROVED", at: isoDaysAgo(10), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REGISTERED", at: isoDaysAgo(4), by: CIVIL_REGISTRAR_DEMO_NAME },
    ],
  }),
  // 19. Rejected application.
  baseDivorceRegistration({
    id: "DR-19",
    reference: "DR-DEMO-2026-0019",
    status: "REJECTED",
    judgment: judgment({ courtCaseNumber: "RDIC-DEMO-0014", judgmentNumber: "JGT-DEMO-0014" }),
    rejectedAt: isoDaysAgo(6),
    rejectedBy: CIVIL_REGISTRAR_DEMO_ID,
    rejectionReason: { reason: "Applicant authority unclear", explanation: "The applicant could not demonstrate authorization to submit on behalf of the former spouses.", evidenceRefs: [], applicantsNotified: true },
    reviewDecisions: [{ type: "REJECT", decidedBy: CIVIL_REGISTRAR_DEMO_NAME, decidedAt: isoDaysAgo(6), reason: "Applicant authority unclear" }],
    statusHistory: [
      { status: "DRAFT", at: isoDaysAgo(16), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "SUBMITTED", at: isoDaysAgo(15), by: DIVORCE_REGISTRATION_OFFICER_DEMO_NAME },
      { status: "UNDER_REVIEW", at: isoDaysAgo(8), by: CIVIL_REGISTRAR_DEMO_NAME },
      { status: "REJECTED", at: isoDaysAgo(6), by: CIVIL_REGISTRAR_DEMO_NAME, note: "Applicant authority unclear" },
    ],
  }),
];

// Pre-existing SDID identities the divorce sync links against (spec §23
// "never fabricate an identity, always mutate an existing one"). Only
// DR-15/DR-16/DR-17 (whose sync has actually progressed past matching) get
// identities here; DR-18's deliberately has none, so the manual-review
// scenario reflects a genuine no-match rather than a seeded shortcut. Each
// pair starts MARRIED with an ACTIVE relationship — mirroring
// seedMarriageLinkedFoundationalIdentities' shape — so the successful sync
// scenario (DR-15) has a real relationship to dissolve.
export const seedDivorceLinkedFoundationalIdentities = (): FoundationalIdentity[] => {
  type PersonSpec = { id: string; nin: string; first: string; last: string; age: number; sex: "FEMALE" | "MALE"; divorced: boolean; divorceReference?: string };

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
    idempotencyKey: `DIVORCE-SDID-SYNC-${spec.id}`,
    maritalStatus: spec.divorced ? "DIVORCED" : "MARRIED",
    maritalStatusUpdatedAt: isoDaysAgo(45),
    maritalStatusUpdatedByMarriageReference: spec.divorceReference,
  });

  // Relationship dissolution happens as soon as BOTH identities are matched
  // during sync — independent of whether each spouse's own field-update
  // attempt then succeeds or fails (see ensureRelationshipDissolved() in
  // crvsDivorceSdidSync.ts) — so DR-16's partial failure and DR-17's full
  // failure both still show a DISSOLVED relationship; only DR-18's
  // uncertain-linkage case leaves the relationship ACTIVE.
  const pair = (a: PersonSpec, b: PersonSpec, relationshipId: string, relationshipStatus: "ACTIVE" | "DISSOLVED"): FoundationalIdentity[] => [
    person(a),
    { ...person(b), relationships: [{ id: relationshipId, type: "SPOUSE", identityAId: a.id, identityBId: b.id, marriageRegistrationReference: "CRVS-MARRIAGE-DEMO-SEED-0010", createdAt: isoDaysAgo(1500), status: relationshipStatus }] },
  ];

  return [
    ...pair(
      { id: "FID-DIVORCE-0001", nin: "DEMO-NIN-2026-005600", first: "Lucia", last: "Okoye", age: 36, sex: "FEMALE", divorced: true, divorceReference: "DR-DEMO-2026-0015" },
      { id: "FID-DIVORCE-0002", nin: "DEMO-NIN-2026-005601", first: "Aiden", last: "Toure", age: 39, sex: "MALE", divorced: true, divorceReference: "DR-DEMO-2026-0015" },
      "DREL-1",
      "DISSOLVED"
    ),
    ...pair(
      { id: "FID-DIVORCE-0003", nin: "DEMO-NIN-2026-005700", first: "Ines", last: "Jansen", age: 29, sex: "FEMALE", divorced: true, divorceReference: "DR-DEMO-2026-0016" },
      { id: "FID-DIVORCE-0004", nin: "DEMO-NIN-2026-005701", first: "Marco", last: "Kadiri", age: 31, sex: "MALE", divorced: false },
      "DREL-2",
      "DISSOLVED"
    ),
    ...pair(
      { id: "FID-DIVORCE-0005", nin: "DEMO-NIN-2026-005800", first: "Zara", last: "Weber", age: 42, sex: "FEMALE", divorced: false },
      { id: "FID-DIVORCE-0006", nin: "DEMO-NIN-2026-005801", first: "Otto", last: "Eze", age: 45, sex: "MALE", divorced: false },
      "DREL-3",
      "DISSOLVED"
    ),
  ];
};
