import {
  DemoAccount,
  DemoApplicant,
  DemoApplication,
  DemoApplicationStatus,
  DemoApplicationType,
  DemoCenter,
  DemoDocument,
  DemoFamilyMember,
  DemoStatusHistoryEntry,
} from "../types";
import { isoDaysAgo, nextId, pick } from "./fixtures";

const APPLICATION_COUNT = 25;

const TYPES: DemoApplicationType[] = [
  "digitalIdentityPreEnrolment",
  "birthRegistration",
  "deathRegistration",
  "marriageRegistration",
  "certificateRequest",
  "recordCorrection",
];

// All 11 required states appear at least once across the 25 seeded records.
const STATUS_CYCLE: DemoApplicationStatus[] = [
  "draft",
  "submitted",
  "pendingReview",
  "inProgress",
  "awaitingInfo",
  "exception",
  "approved",
  "rejected",
  "offlinePending",
  "rolledBack",
  "completed",
  "approved",
  "pendingReview",
  "completed",
  "approved",
];

const DOCUMENT_KINDS = [
  "Birth certificate",
  "Proof of address",
  "Passport photo",
  "Parent identity document",
  "Marriage certificate",
  "Death certificate",
];

const buildDocuments = (seed: number): DemoDocument[] => {
  const count = 1 + (seed % 3);
  return Array.from({ length: count }, (_, i) => ({
    id: nextId("DOC"),
    name: pick(DOCUMENT_KINDS, seed + i),
    type: "application/pdf",
    uploadedAt: isoDaysAgo(20 - i),
  }));
};

const buildFamilyMembers = (
  applicant: DemoApplicant,
  seed: number
): DemoFamilyMember[] => {
  if (seed % 4 !== 0) return [];
  return [
    {
      relationship: "mother",
      firstName: pick(["Amara", "Lena", "Ines", "Zara"], seed),
      lastName: applicant.lastName,
      identityNumber: `DEMO-ID-${((seed + 500) % 999999)
        .toString()
        .padStart(6, "0")}`,
    },
  ];
};

const buildStatusHistory = (
  status: DemoApplicationStatus,
  submittedAt: string,
  officerName: string,
  reviewerName?: string
): DemoStatusHistoryEntry[] => {
  const history: DemoStatusHistoryEntry[] = [
    { status: "draft", at: submittedAt, by: officerName },
  ];
  if (status === "draft") return history;

  history.push({
    status: "submitted",
    at: isoDaysAgo(0),
    by: officerName,
    note: "Submitted for review",
  });

  if (status === "submitted") return history;

  history.push({ status: "pendingReview", at: isoDaysAgo(0), by: officerName });

  if (["approved", "rejected", "completed"].includes(status) && reviewerName) {
    history.push({
      status,
      at: isoDaysAgo(0),
      by: reviewerName,
      note:
        status === "approved"
          ? "Approved after review"
          : status === "rejected"
          ? "Rejected — did not meet requirements"
          : "Processing completed",
    });
  } else if (status !== "pendingReview") {
    history.push({ status, at: isoDaysAgo(0), by: officerName });
  }

  return history;
};

const referenceFor = (
  type: DemoApplicationType,
  status: DemoApplicationStatus,
  index: number
) => {
  const num = (index + 1).toString().padStart(4, "0");
  if (type === "digitalIdentityPreEnrolment") {
    return status === "approved" || status === "completed"
      ? `ENR-DEMO-2026-${num}`
      : `PRE-DEMO-2026-${num}`;
  }
  return `APP-DEMO-2026-${num}`;
};

export const seedApplications = (
  applicants: DemoApplicant[],
  centers: DemoCenter[],
  accounts: DemoAccount[]
): DemoApplication[] => {
  const officers = accounts.filter((a) => a.role === "enrolment_officer");
  const reviewers = accounts.filter((a) => a.role === "reviewer");

  return Array.from({ length: APPLICATION_COUNT }, (_, i) => {
    const applicant = pick(applicants, i);
    const type = pick(TYPES, i);
    const status = pick(STATUS_CYCLE, i);
    const center = pick(centers, i);
    const officer = pick(officers.length ? officers : accounts, i);
    const reviewer = pick(reviewers.length ? reviewers : accounts, i + 1);
    const submittedAt = isoDaysAgo(90 - i * 2);
    const officerName = `${officer.firstName} ${officer.lastName}`;
    const reviewerName = `${reviewer.firstName} ${reviewer.lastName}`;
    const isReviewed = ["approved", "rejected", "completed"].includes(status);
    const processingDays = 1 + (i % 12);

    return {
      id: nextId("APPLICATION"),
      // Record 0 is pinned to the exact reference documented as the public
      // tracking example (spec section 20 / README), so that lookup is
      // always resolvable regardless of the type/status cycling above.
      reference: i === 0 ? "APP-DEMO-2026-0001" : referenceFor(type, status, i),
      applicantId: applicant.id,
      type,
      status,
      submittedAt,
      centerId: center.id,
      officerId: officer.id,
      reviewerId: isReviewed ? reviewer.id : undefined,
      address: {
        region: applicant.region,
        district: applicant.district,
        localArea: applicant.localArea,
      },
      familyMembers: buildFamilyMembers(applicant, i),
      documents: buildDocuments(i),
      biometricsStatus:
        status === "draft"
          ? "notStarted"
          : status === "exception"
          ? "poorQuality"
          : "captured",
      reviewComments: isReviewed
        ? [
            {
              by: reviewerName,
              at: isoDaysAgo(1),
              comment:
                status === "rejected"
                  ? "Supporting documents do not match the application details."
                  : "All details verified against supporting documents.",
            },
          ]
        : [],
      statusHistory: buildStatusHistory(
        status,
        submittedAt,
        officerName,
        isReviewed ? reviewerName : undefined
      ),
      processingDays: isReviewed ? processingDays : undefined,
      exceptionReason:
        status === "exception"
          ? "Selfie capture did not pass the automated quality check."
          : undefined,
    };
  });
};
