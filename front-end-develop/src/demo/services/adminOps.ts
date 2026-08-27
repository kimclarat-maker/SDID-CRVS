// Demo-mode backing for src/api/reports, src/api/syncStats and
// src/api/rollBacks — three admin-dashboard-only read/action modules (not
// part of the main enrollment walkthrough). Reports/sync-stats are derived
// from the seeded applications so the numbers move as demo data changes;
// rollbacks reuse the same "rolledBack" application status the seed data
// already models, projected onto the full RollBack shape via the existing
// @/mocks/rollbacks.ts template (same technique as demo/services/prenrollment.ts).
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import mockReports from "@/mocks/reports";
import rollbackTemplate from "@/mocks/rollbacks";

// ---- Reports (dashboard/admin/reports) ----
export const demoFetchReports = async () =>
  demoDelay({ data: mockReports, total: mockReports.length });

// ---- Sync stats (offline/online sync dashboard) ----
export const demoFetchOfflineSyncedAnalytics = async () => {
  const db = getDemoData();
  const offlinePending = db.applications.filter(
    (a) => a.status === "offlinePending"
  ).length;
  const synced = db.applications.filter((a) => a.syncedToCentral).length;
  return demoDelay({
    data: {
      offlinePending,
      synced,
      total: db.applications.length,
    },
  });
};

export const demoFetchOnlineSyncedAnalytics = async () => {
  const db = getDemoData();
  const centerId = db.accounts[0]?.centerId;
  const center = db.centers.find((c) => c.id === centerId);
  return demoDelay({
    data: {
      center: center?.name,
      totalApplications: db.applications.length,
      synced: db.applications.filter((a) => a.syncedToCentral).length,
    },
  });
};

// ---- Rollbacks (dashboard/admin/requests/rollBacks) ----
const toRollBackRecord = (appId: string, index: number): any => {
  const db = getDemoData();
  const app = db.applications.find((a) => a.id === appId);
  const applicant = app && db.applicants.find((a) => a.id === app.applicantId);
  const template = rollbackTemplate[0];

  return {
    ...template,
    _id: appId,
    applicationNumber: app?.reference || template.applicationNumber,
    preEnrollmentNumber: app?.reference || template.preEnrollmentNumber,
    requestNo: app?.reference || template.requestNo,
    identifier: applicant?.identityNumber || template.identifier,
    idNumber: applicant?.identityNumber || template.idNumber,
    firstName: (applicant?.firstName || template.firstName).toUpperCase(),
    lastName: applicant?.lastName || template.lastName,
    gender: applicant?.gender === "female" ? "FEMALE" : "MALE",
    phoneNumber: applicant?.phoneNumber || template.phoneNumber,
    email: applicant?.email || template.email,
    dob: applicant?.dob?.slice(0, 10) || template.dob,
    status: "ROLLBACK",
    rejectComment:
      app?.exceptionReason ||
      app?.reviewComments?.[app.reviewComments.length - 1]?.comment ||
      template.rejectComment,
    createdAt: app?.submittedAt || template.createdAt,
    center: app
      ? { _id: app.centerId, name: db.centers.find((c) => c.id === app.centerId)?.name || "" }
      : template.center,
  };
};

export const demoFetchRollBacks = async (params?: { offset?: number; limit?: number; search?: string }) => {
  const db = getDemoData();
  let rolledBack = db.applications.filter((a) => a.status === "rolledBack");

  if (params?.search) {
    const term = params.search.toLowerCase();
    rolledBack = rolledBack.filter((a) => a.reference.toLowerCase().includes(term));
  }

  const total = rolledBack.length;
  const offset = params?.offset || 0;
  const limit = params?.limit || 10;
  const page = rolledBack
    .slice(offset, offset + limit)
    .map((a, i) => toRollBackRecord(a.id, i));

  return demoDelay({ data: page, total });
};

// Finds a demo application by its reference/pre-enrollment number and
// transitions it to "rolledBack", mirroring the transitionApplication()
// pattern used by demoApproveApplication/demoRejectApplication.
export const demoCreateRollBack = async (payload: {
  preEnrollmentId: string;
  rollbackReason: string;
}) => {
  const found = updateDemoData((db) => {
    const app =
      db.applications.find((a) => a.reference === payload.preEnrollmentId) ||
      db.applications.find((a) => a.id === payload.preEnrollmentId);
    if (!app) return db;

    app.status = "rolledBack";
    app.statusHistory.push({
      status: "rolledBack",
      at: new Date().toISOString(),
      by: "Demo Administrator",
      note: payload.rollbackReason,
    });

    db.auditEvents.unshift({
      id: `LOG-${Date.now()}`,
      actor: "Demo Administrator",
      action: "rolled back",
      module: "rollBacks",
      targetRef: app.reference,
      at: new Date().toISOString(),
      details: payload.rollbackReason,
    });

    return db;
  }).applications.find(
    (a) =>
      a.reference === payload.preEnrollmentId || a.id === payload.preEnrollmentId
  );

  return demoDelay({
    data: found,
    message: found
      ? "Application rolled back (demo)."
      : "No matching demo application found for that identifier.",
  });
};
