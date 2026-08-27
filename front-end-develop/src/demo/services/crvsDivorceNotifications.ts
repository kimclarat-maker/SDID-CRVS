// Simulated court-integration notification queue (spec §5A, §14). A
// notification always arrives already "submitted" by the mock court
// integration (RECEIVED, never DRAFT) — demoSimulateCourtDivorceNotification
// is the ONLY entry point that creates one, standing in for a typed mock
// integration; there is no real court API call anywhere in this file.
// Validating a notification searches for the underlying marriage the same
// way crvsDivorceMarriageSearch.ts does for an applicant submission, then
// demoConvertDivorceNotificationToRegistration() hands off to
// demoCreateDivorceRegistrationDraft() — never a bulk action (spec §14 "Do
// not allow bulk validation or registration").
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DivorceNotification, DivorceEvidence } from "@/domain/crvs/types";
import { assertTransitionDivorceNotification } from "@/domain/crvs/statusMachines";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { demoSearchExistingMarriages } from "./crvsDivorceMarriageSearch";
import { demoCreateDivorceRegistrationDraft } from "./crvsDivorceRegistrations";

export type DivorceNotificationListParams = {
  search?: string;
  status?: string;
  court?: string;
  assignedOfficerId?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListDivorceNotifications = async (params: DivorceNotificationListParams) => {
  const db = getDemoData();
  let results = db.crvsDivorceNotifications;

  if (params.status) results = results.filter((n) => n.status === params.status!.toUpperCase());
  if (params.court) results = results.filter((n) => n.courtName === params.court);
  if (params.assignedOfficerId) results = results.filter((n) => n.assignedOfficerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((n) => n.notifiedAt >= params.dateFrom!);
  if (params.dateTo) results = results.filter((n) => n.notifiedAt <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (n) => n.reference.toLowerCase().includes(term) || n.courtCaseNumber.toLowerCase().includes(term) || n.judgmentNumber.toLowerCase().includes(term) || n.applicantNamesAsReported.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetDivorceNotification = async (id: string): Promise<DivorceNotification | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsDivorceNotifications.find((n) => n.id === id || n.reference === id));
};

const nextNotificationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsDivorceNotifications.length + 1;
  return `DN-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

export type SimulateCourtNotificationInput = {
  courtName: string;
  courtCaseNumber: string;
  judgmentNumber: string;
  judgmentDate: string;
  finalityDate?: string;
  applicantNamesAsReported: string;
  marriageReferenceAsReported?: string;
  signedJudgmentDocument?: Omit<DivorceEvidence, "id" | "uploadedAt" | "uploadedBy" | "verification">;
};

/** Typed mock court integration — the only way a DivorceNotification enters
 * the system (spec §5A "Do not make a real court API call. Use a typed mock
 * integration."). */
export const demoSimulateCourtDivorceNotification = (input: SimulateCourtNotificationInput, actorName: string): DivorceNotification =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const notification: DivorceNotification = {
      id: nextId("DN"),
      reference: nextNotificationReference(db),
      status: "RECEIVED",
      courtName: input.courtName,
      courtCaseNumber: input.courtCaseNumber,
      judgmentNumber: input.judgmentNumber,
      judgmentDate: input.judgmentDate,
      finalityDate: input.finalityDate,
      applicantNamesAsReported: input.applicantNamesAsReported,
      marriageReferenceAsReported: input.marriageReferenceAsReported,
      signedJudgmentDocument: input.signedJudgmentDocument
        ? { id: nextId("DEV"), ...input.signedJudgmentDocument, uploadedAt: now, uploadedBy: "Court integration (simulated)", verification: "NOT_VERIFIED" }
        : undefined,
      notifiedAt: now,
      marriageMatch: { status: "NOT_SEARCHED", candidates: [], notFoundEvidence: [] },
      duplicateWarning: db.crvsDivorceNotifications.some((n) => n.courtCaseNumber === input.courtCaseNumber || n.judgmentNumber === input.judgmentNumber),
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: "RECEIVED", at: now, by: actorName }],
      version: 1,
    };
    db.crvsDivorceNotifications.unshift(notification);
    logCrvsAudit(db, actorName, "received", "crvs.divorce_notification", notification.reference, `Simulated court notification from ${input.courtName}, case ${input.courtCaseNumber}.`);
    return db;
  }).crvsDivorceNotifications[0];

export const demoAssignDivorceNotification = (id: string, officerId: string, officerName: string, actorName: string): DivorceNotification =>
  updateDemoData((db) => {
    const notification = db.crvsDivorceNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Divorce notification");
    notification.assignedOfficerId = officerId;
    notification.assignedOfficerName = officerName;
    notification.updatedAt = new Date().toISOString();
    notification.version += 1;
    logCrvsAudit(db, actorName, "assigned", "crvs.divorce_notification", notification.reference, `Assigned to ${officerName}.`);
    return db;
  }).crvsDivorceNotifications.find((n) => n.id === id)!;

/** Runs the marriage-lookup step against the notification's reported
 * marriage reference/applicant names, storing the result on
 * notification.marriageMatch — same underlying search as the wizard's Step
 * 3 (spec §3 Step 3, §14 "Marriage match" column). */
export const demoValidateDivorceNotification = async (id: string, actorName: string): Promise<DivorceNotification> => {
  const db = getDemoData();
  const notification = db.crvsDivorceNotifications.find((n) => n.id === id);
  if (!notification) throw new NotFoundError("Divorce notification");

  const { candidates, confidence } = await demoSearchExistingMarriages({
    marriageRegistrationNumber: notification.marriageReferenceAsReported,
    spouse1Name: notification.applicantNamesAsReported.split(/&| and /i)[0]?.trim(),
    spouse2Name: notification.applicantNamesAsReported.split(/&| and /i)[1]?.trim(),
  });

  return updateDemoData((innerDb) => {
    const n = innerDb.crvsDivorceNotifications.find((x) => x.id === id);
    if (!n) throw new NotFoundError("Divorce notification");
    assertTransitionDivorceNotification(n.status, "VALIDATION_PENDING");
    const now = new Date().toISOString();
    n.status = candidates.length > 0 ? "VALIDATED" : "VALIDATION_PENDING";
    n.marriageMatch = {
      status: candidates.length === 0 ? "NOT_FOUND" : candidates.length === 1 ? "MATCHED" : "MULTIPLE_CANDIDATES",
      candidates,
      selected: candidates.length === 1 ? candidates[0] : undefined,
      searchedAt: now,
      searchedBy: actorName,
      notFoundEvidence: [],
    };
    n.updatedAt = now;
    n.version += 1;
    n.statusHistory.push({ status: n.status, at: now, by: actorName });
    logCrvsAudit(innerDb, actorName, "validated", "crvs.divorce_notification", n.reference, `Marriage match: ${n.marriageMatch.status} (${candidates.length} candidate(s), ${confidence} confidence).`);
    return innerDb;
  }).crvsDivorceNotifications.find((n) => n.id === id)!;
};

export const demoReturnDivorceNotification = (id: string, reason: string, actorName: string): DivorceNotification =>
  updateDemoData((db) => {
    const notification = db.crvsDivorceNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Divorce notification");
    assertTransitionDivorceNotification(notification.status, "RETURNED");
    const now = new Date().toISOString();
    notification.status = "RETURNED";
    notification.returnReason = { reason };
    notification.updatedAt = now;
    notification.version += 1;
    notification.statusHistory.push({ status: "RETURNED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "returned", "crvs.divorce_notification", notification.reference, reason);
    return db;
  }).crvsDivorceNotifications.find((n) => n.id === id)!;

export const demoMarkDivorceNotificationDuplicate = (id: string, note: string, actorName: string): DivorceNotification =>
  updateDemoData((db) => {
    const notification = db.crvsDivorceNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Divorce notification");
    assertTransitionDivorceNotification(notification.status, "DUPLICATE");
    const now = new Date().toISOString();
    notification.status = "DUPLICATE";
    notification.updatedAt = now;
    notification.version += 1;
    notification.statusHistory.push({ status: "DUPLICATE", at: now, by: actorName, note });
    logCrvsAudit(db, actorName, "marked duplicate", "crvs.divorce_notification", notification.reference, note);
    return db;
  }).crvsDivorceNotifications.find((n) => n.id === id)!;

/** Converts a VALIDATED notification into a DivorceRegistration draft,
 * pre-filling the court-decision and existing-marriage-match fields —
 * never a bulk action, always one case at a time (spec §14). */
export const demoConvertDivorceNotificationToRegistration = (id: string, processingOfficeId: string, processingOfficeName: string, actorId: string, actorName: string) => {
  const db = getDemoData();
  const notification = db.crvsDivorceNotifications.find((n) => n.id === id);
  if (!notification) throw new NotFoundError("Divorce notification");
  if (notification.status !== "VALIDATED") throw new Error("Only a validated notification can be converted to a registration.");

  const draft = demoCreateDivorceRegistrationDraft(
    {
      source: "COURT_NOTIFICATION",
      sourceNotificationId: notification.id,
      sourceNotificationReference: notification.reference,
      jurisdiction: getDemoData().crvsDivorceRegistrations[0]?.jurisdiction || "Demo District",
      applicant: {
        documentType: "NONE",
        firstName: notification.applicantNamesAsReported,
        relationshipToCase: "STAFF",
        authorizationBasis: `Converted from court notification ${notification.reference}.`,
        identityVerification: "NOT_VERIFIED",
      },
      processingOfficeId,
      processingOfficeName,
    },
    actorId,
    actorName
  );

  updateDemoData((innerDb) => {
    const reg = innerDb.crvsDivorceRegistrations.find((r) => r.id === draft.id);
    const n = innerDb.crvsDivorceNotifications.find((x) => x.id === id);
    if (!reg || !n) throw new NotFoundError("Divorce registration or notification");
    reg.judgment = {
      country: "Rwanda",
      courtOrAuthorityName: n.courtName,
      courtCaseNumber: n.courtCaseNumber,
      judgmentNumber: n.judgmentNumber,
      judgmentDate: n.judgmentDate,
      finalityDate: n.finalityDate,
      decisionType: "OTHER",
      isForeign: false,
    };
    if (n.signedJudgmentDocument) reg.evidence.push({ ...n.signedJudgmentDocument, id: nextId("DEV") });
    if (n.marriageMatch.selected) reg.existingMarriage = { ...n.marriageMatch, status: "MATCHED" };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;

    assertTransitionDivorceNotification(n.status, "CONVERTED_TO_REGISTRATION");
    n.status = "CONVERTED_TO_REGISTRATION";
    n.convertedRegistrationId = reg.id;
    n.convertedRegistrationReference = reg.reference;
    n.updatedAt = new Date().toISOString();
    n.version += 1;
    n.statusHistory.push({ status: "CONVERTED_TO_REGISTRATION", at: new Date().toISOString(), by: actorName });
    logCrvsAudit(innerDb, actorName, "converted to registration", "crvs.divorce_notification", n.reference, `Created registration ${reg.reference}.`);
    return innerDb;
  });

  return getDemoData().crvsDivorceRegistrations.find((r) => r.id === draft.id)!;
};
