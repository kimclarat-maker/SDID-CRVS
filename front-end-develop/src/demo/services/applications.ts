import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DemoApplication, DemoApplicationStatus } from "../types";

const STATUS_FILTER_MAP: Record<string, DemoApplicationStatus> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PENDING: "pendingReview",
  IN_PROGRESS: "inProgress",
  AWAITING_INFO: "awaitingInfo",
  EXCEPTION: "exception",
  APPROVED: "approved",
  REJECTED: "rejected",
  OFFLINE: "offlinePending",
  ROLLED_BACK: "rolledBack",
  COMPLETED: "completed",
};

// Shapes each seeded application into the loosely-typed record the existing
// EnrollmentType-driven list/detail screens read (selfie, preEnrollmentNumber,
// identifier, firstName/lastName, fatherNames/motherNames, officer.*, dob).
const toEnrollmentRecord = (app: DemoApplication) => {
  const db = getDemoData();
  const applicant = db.applicants.find((a) => a.id === app.applicantId);
  const officer = db.accounts.find((a) => a.id === app.officerId);
  const reviewer = db.accounts.find((a) => a.id === app.reviewerId);
  const father = app.familyMembers.find((f) => f.relationship === "father");
  const mother = app.familyMembers.find((f) => f.relationship === "mother");
  const center = db.centers.find((c) => c.id === app.centerId);

  return {
    _id: app.id,
    identifier: applicant?.identityNumber || app.applicantId,
    preEnrollmentNumber: app.reference,
    applicantNumber: app.reference,
    selfie: applicant?.photo || "",
    firstName: applicant?.firstName || "Demo",
    lastName: applicant?.lastName || "Applicant",
    fatherNames: father ? `${father.firstName} ${father.lastName}` : "-",
    motherNames: mother ? `${mother.firstName} ${mother.lastName}` : "-",
    officer: officer
      ? { firstName: officer.firstName, lastName: officer.lastName }
      : undefined,
    reviewer: reviewer
      ? { firstName: reviewer.firstName, lastName: reviewer.lastName }
      : undefined,
    dob: applicant?.dob,
    age: applicant
      ? Math.max(
          0,
          new Date().getFullYear() - new Date(applicant.dob).getFullYear()
        )
      : undefined,
    status: app.status,
    syncedToCentral: !!app.syncedToCentral,
    center: center?.name,
    centerId: app.centerId,
    type: app.type,
    address: app.address,
    familyMembers: app.familyMembers,
    documents: app.documents,
    biometricsStatus: app.biometricsStatus,
    reviewComments: app.reviewComments,
    statusHistory: app.statusHistory,
    exceptionReason: app.exceptionReason,
    submittedAt: app.submittedAt,
    reference: app.reference,
    applicantId: app.applicantId,
    preHistoricalInfo: JSON.stringify({}),
  };
};

// Returned as `any`: the shape intentionally satisfies whichever consumer
// (EnrollmentType[], Draft[], ...) reads the fields it actually renders,
// rather than re-declaring every field of those large production types.
export const demoListApplications = async (params: {
  status?: string;
  offset?: number;
  limit?: number;
  search?: string;
}): Promise<any> => {
  const db = getDemoData();
  const wantedStatus = params.status
    ? STATUS_FILTER_MAP[params.status.toUpperCase()]
    : undefined;

  let results = db.applications;
  if (wantedStatus) {
    results = results.filter((a) => a.status === wantedStatus);
  }

  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter((a) => {
      const applicant = db.applicants.find((x) => x.id === a.applicantId);
      return (
        a.reference.toLowerCase().includes(term) ||
        applicant?.firstName.toLowerCase().includes(term) ||
        applicant?.lastName.toLowerCase().includes(term) ||
        applicant?.identityNumber.toLowerCase().includes(term)
      );
    });
  }

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 10;
  const page = results.slice(offset, offset + limit).map(toEnrollmentRecord);

  return demoDelay({ data: page, total });
};

// Workflow B: exception handling. Reuses the same seeded "exception" status
// records, adding the selfie-skip-specific fields that screen reads.
export const demoListExceptions = async (params: {
  offset?: number;
  limit?: number;
}): Promise<any> => {
  const db = getDemoData();
  const results = db.applications.filter((a) => a.status === "exception");
  const offset = params.offset || 0;
  const limit = params.limit || 10;
  const page = results.slice(offset, offset + limit).map((app) => ({
    ...toEnrollmentRecord(app),
    selfieForSkip: "",
    selfieVerificationSkipCode: app.id.slice(-6).toUpperCase(),
    selfieVerificationSkipStatus: "PENDING",
    exceptionReason: app.exceptionReason,
  }));

  return demoDelay({ data: page, total: results.length });
};

export const demoGetApplicationById = async (id: string): Promise<any> => {
  const db = getDemoData();
  const app = db.applications.find((a) => a.id === id);
  return demoDelay({ data: app ? toEnrollmentRecord(app) : undefined });
};

const transitionApplication = (
  id: string,
  status: DemoApplicationStatus,
  actorName: string,
  comment: string
) =>
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === id);
    if (!app) return db;

    app.status = status;
    app.statusHistory.push({
      status,
      at: new Date().toISOString(),
      by: actorName,
      note: comment,
    });
    app.reviewComments.push({
      by: actorName,
      at: new Date().toISOString(),
      comment,
    });

    db.auditEvents.unshift({
      id: `LOG-${Date.now()}`,
      actor: actorName,
      action: status === "approved" ? "approved" : "rejected",
      module: "applications",
      targetRef: app.reference,
      at: new Date().toISOString(),
      details: comment,
    });

    return db;
  });

export const demoApproveApplication = async (
  id: string,
  actorName: string,
  comment = "Approved after review."
) => demoDelay(transitionApplication(id, "approved", actorName, comment));

export const demoRejectApplication = async (
  id: string,
  actorName: string,
  comment = "Rejected — did not meet requirements."
) => demoDelay(transitionApplication(id, "rejected", actorName, comment));

// Workflow D: offline synchronization. ~70% simulated success so the retry
// path is reachable; never touches a real sync endpoint.
export type DemoSyncOutcome = "synced" | "failed";

export const demoSyncOfflineApplication = async (
  id: string,
  actorName: string
): Promise<DemoSyncOutcome> => {
  await demoDelay(null, 900);

  const outcome: DemoSyncOutcome = Math.random() < 0.7 ? "synced" : "failed";

  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === id);
    if (!app) return db;

    if (outcome === "synced") {
      app.syncedToCentral = true;
    }

    db.auditEvents.unshift({
      id: `LOG-${Date.now()}`,
      actor: actorName,
      action: "synchronised",
      module: "offline",
      targetRef: app.reference,
      at: new Date().toISOString(),
      details:
        outcome === "synced"
          ? "Offline application synchronised to central successfully."
          : "Offline synchronisation failed — retry required.",
    });

    return db;
  });

  return outcome;
};
