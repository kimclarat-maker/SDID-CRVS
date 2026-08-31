// Simulated court-integration notification queue for marriage annulment
// (spec §6A, §14) — mirrors crvsDivorceNotifications.ts's shape closely. A
// notification always arrives already "submitted" by the mock court
// integration (RECEIVED, never DRAFT) — demoSimulateCourtAnnulmentNotification
// is the ONLY entry point that creates one, standing in for a typed mock
// integration; there is no real court API call anywhere in this file.
// Validating a notification searches for the underlying marriage the same
// way crvsAnnulmentMarriageSearch.ts does for an applicant submission, then
// demoConvertAnnulmentNotificationToRegistration() hands off to
// demoCreateAnnulmentRegistrationDraft() — never a bulk action (spec §14 "Do
// not allow bulk validation or registration").
import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { AnnulmentNotification, AnnulmentEvidence, AnnulmentRegistration } from "@/domain/crvs/types";
import { assertTransitionAnnulmentNotification } from "@/domain/crvs/statusMachines";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";
import { demoSearchExistingAnnulmentMarriages } from "./crvsAnnulmentMarriageSearch";
import { demoCreateAnnulmentRegistrationDraft } from "./crvsAnnulmentRegistrations";

export type AnnulmentNotificationListParams = {
  search?: string;
  status?: string;
  court?: string;
  assignedOfficerId?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListAnnulmentNotifications = async (params: AnnulmentNotificationListParams) => {
  const db = getDemoData();
  let results = db.crvsAnnulmentNotifications;

  if (params.status) results = results.filter((n) => n.status === params.status!.toUpperCase());
  if (params.court) results = results.filter((n) => n.courtName === params.court);
  if (params.assignedOfficerId) results = results.filter((n) => n.assignedOfficerId === params.assignedOfficerId);
  if (params.dateFrom) results = results.filter((n) => n.notifiedAt >= params.dateFrom!);
  if (params.dateTo) results = results.filter((n) => n.notifiedAt <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (n) =>
        n.reference.toLowerCase().includes(term) ||
        n.courtCaseNumber.toLowerCase().includes(term) ||
        n.decisionNumber.toLowerCase().includes(term) ||
        n.applicantNamesAsReported.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetAnnulmentNotification = async (id: string): Promise<AnnulmentNotification | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsAnnulmentNotifications.find((n) => n.id === id || n.reference === id));
};

const nextAnnulmentNotificationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  // Mirrors crvsAnnulmentRegistrations.ts's shared AN-DEMO-{year}-{seq}
  // numbering across notifications and registrations, so new references
  // never collide with seeded ones from either collection.
  const seq = db.crvsAnnulmentNotifications.length + db.crvsAnnulmentRegistrations.length + 1;
  return `AN-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

export type SimulateCourtAnnulmentNotificationInput = {
  courtName: string;
  courtCaseNumber: string;
  decisionNumber: string;
  decisionDate: string;
  finalityDate?: string;
  effectiveDate?: string;
  legalEffectWordingAsReported?: string;
  applicantNamesAsReported: string;
  marriageReferenceAsReported?: string;
  signedDecisionDocument?: Omit<AnnulmentEvidence, "id" | "uploadedAt" | "uploadedBy" | "verification">;
};

/** Typed mock court integration — the only way an AnnulmentNotification
 * enters the system (spec §6A "Do not make a real court API call. Use a
 * typed mock integration."). */
export const demoSimulateCourtAnnulmentNotification = async (input: SimulateCourtAnnulmentNotificationInput, actorName: string): Promise<AnnulmentNotification> =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const notification: AnnulmentNotification = {
      id: nextId("AN"),
      reference: nextAnnulmentNotificationReference(db),
      status: "RECEIVED",
      courtName: input.courtName,
      courtCaseNumber: input.courtCaseNumber,
      decisionNumber: input.decisionNumber,
      decisionDate: input.decisionDate,
      finalityDate: input.finalityDate,
      effectiveDate: input.effectiveDate,
      legalEffectWordingAsReported: input.legalEffectWordingAsReported,
      applicantNamesAsReported: input.applicantNamesAsReported,
      marriageReferenceAsReported: input.marriageReferenceAsReported,
      signedDecisionDocument: input.signedDecisionDocument
        ? { id: nextId("AEV"), ...input.signedDecisionDocument, uploadedAt: now, uploadedBy: "Court integration (simulated)", verification: "NOT_VERIFIED" }
        : undefined,
      notifiedAt: now,
      marriageMatch: { status: "NOT_SEARCHED", candidates: [], notFoundEvidence: [] },
      duplicateWarning: db.crvsAnnulmentNotifications.some((n) => n.courtCaseNumber === input.courtCaseNumber || n.decisionNumber === input.decisionNumber),
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: "RECEIVED", at: now, by: actorName }],
      version: 1,
    };
    db.crvsAnnulmentNotifications.unshift(notification);
    logCrvsAudit(db, actorName, "received", "crvs.annulment_notification", notification.reference, `Simulated court notification from ${input.courtName}, case ${input.courtCaseNumber}.`);
    return db;
  }).crvsAnnulmentNotifications[0];

export const demoAssignAnnulmentNotification = async (id: string, officerId: string, officerName: string, actorName: string): Promise<AnnulmentNotification> =>
  updateDemoData((db) => {
    const notification = db.crvsAnnulmentNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Annulment notification");
    notification.assignedOfficerId = officerId;
    notification.assignedOfficerName = officerName;
    notification.updatedAt = new Date().toISOString();
    notification.version += 1;
    logCrvsAudit(db, actorName, "assigned", "crvs.annulment_notification", notification.reference, `Assigned to ${officerName}.`);
    return db;
  }).crvsAnnulmentNotifications.find((n) => n.id === id)!;

/** Runs the marriage-lookup step against the notification's reported
 * marriage reference/applicant names, storing the result on
 * notification.marriageMatch — same underlying search as the wizard's Step
 * 3 (spec §11 Step 3). */
export const demoValidateAnnulmentNotification = async (id: string, actorName: string): Promise<AnnulmentNotification> => {
  const db = getDemoData();
  const notification = db.crvsAnnulmentNotifications.find((n) => n.id === id);
  if (!notification) throw new NotFoundError("Annulment notification");

  const { candidates, confidence } = await demoSearchExistingAnnulmentMarriages({
    marriageRegistrationNumber: notification.marriageReferenceAsReported,
    party1Name: notification.applicantNamesAsReported.split(/&| and /i)[0]?.trim(),
    party2Name: notification.applicantNamesAsReported.split(/&| and /i)[1]?.trim(),
  });

  return updateDemoData((innerDb) => {
    const n = innerDb.crvsAnnulmentNotifications.find((x) => x.id === id);
    if (!n) throw new NotFoundError("Annulment notification");
    assertTransitionAnnulmentNotification(n.status, "VALIDATION_PENDING");
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
    logCrvsAudit(innerDb, actorName, "validated", "crvs.annulment_notification", n.reference, `Marriage match: ${n.marriageMatch.status} (${candidates.length} candidate(s), ${confidence} confidence).`);
    return innerDb;
  }).crvsAnnulmentNotifications.find((n) => n.id === id)!;
};

export const demoReturnAnnulmentNotification = async (id: string, reason: string, actorName: string): Promise<AnnulmentNotification> =>
  updateDemoData((db) => {
    const notification = db.crvsAnnulmentNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Annulment notification");
    assertTransitionAnnulmentNotification(notification.status, "RETURNED");
    const now = new Date().toISOString();
    notification.status = "RETURNED";
    notification.returnReason = { reason };
    notification.updatedAt = now;
    notification.version += 1;
    notification.statusHistory.push({ status: "RETURNED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "returned", "crvs.annulment_notification", notification.reference, reason);
    return db;
  }).crvsAnnulmentNotifications.find((n) => n.id === id)!;

export const demoMarkAnnulmentNotificationDuplicate = async (id: string, note: string, actorName: string): Promise<AnnulmentNotification> =>
  updateDemoData((db) => {
    const notification = db.crvsAnnulmentNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Annulment notification");
    assertTransitionAnnulmentNotification(notification.status, "DUPLICATE");
    const now = new Date().toISOString();
    notification.status = "DUPLICATE";
    notification.updatedAt = now;
    notification.version += 1;
    notification.statusHistory.push({ status: "DUPLICATE", at: now, by: actorName, note });
    logCrvsAudit(db, actorName, "marked duplicate", "crvs.annulment_notification", notification.reference, note);
    return db;
  }).crvsAnnulmentNotifications.find((n) => n.id === id)!;

/** Converts a VALIDATED notification into an AnnulmentRegistration draft,
 * pre-filling the court-decision and existing-marriage-match fields —
 * never a bulk action, always one case at a time (spec §14). Awaits
 * demoCreateAnnulmentRegistrationDraft() since (unlike its divorce
 * equivalent) that function is async. */
export const demoConvertAnnulmentNotificationToRegistration = async (
  id: string,
  processingOfficeId: string,
  processingOfficeName: string,
  actorId: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  const db = getDemoData();
  const notification = db.crvsAnnulmentNotifications.find((n) => n.id === id);
  if (!notification) throw new NotFoundError("Annulment notification");
  if (notification.status !== "VALIDATED") throw new Error("Only a validated notification can be converted to a registration.");

  const draft = await demoCreateAnnulmentRegistrationDraft(
    {
      source: "COURT_NOTIFICATION",
      sourceNotificationId: notification.id,
      sourceNotificationReference: notification.reference,
      jurisdiction: getDemoData().crvsAnnulmentRegistrations[0]?.jurisdiction || "Demo District",
      applicant: {
        documentType: "NONE",
        firstName: notification.applicantNamesAsReported,
        relationshipToCase: "STAFF",
        authorizationBasis: `Converted from court notification ${notification.reference}.`,
        identityVerification: "NOT_VERIFIED",
      },
      processingOffice: {
        selectedProcessingOfficeId: processingOfficeId,
        selectedProcessingOfficeName: processingOfficeName,
        embassyOrForeignOfficePath: false,
        jurisdictionResult: "UNRESOLVED",
      },
    },
    actorId,
    actorName
  );

  updateDemoData((innerDb) => {
    const reg = innerDb.crvsAnnulmentRegistrations.find((r) => r.id === draft.id);
    const n = innerDb.crvsAnnulmentNotifications.find((x) => x.id === id);
    if (!reg || !n) throw new NotFoundError("Annulment registration or notification");
    reg.decision = {
      country: "Rwanda",
      courtOrAuthorityName: n.courtName,
      jurisdiction: reg.jurisdiction,
      courtCaseNumber: n.courtCaseNumber,
      decisionNumber: n.decisionNumber,
      decisionDate: n.decisionDate,
      finalityDate: n.finalityDate,
      effectiveDate: n.effectiveDate,
      decisionType: "OTHER",
      describesMarriageAs: "UNSPECIFIED",
      legalEffectWording: n.legalEffectWordingAsReported,
      isForeign: false,
    };
    if (n.signedDecisionDocument) reg.evidence.push({ ...n.signedDecisionDocument, id: nextId("AEV") });
    if (n.marriageMatch.selected) reg.existingMarriage = { ...n.marriageMatch, status: "MATCHED" };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;

    assertTransitionAnnulmentNotification(n.status, "CONVERTED_TO_REGISTRATION");
    n.status = "CONVERTED_TO_REGISTRATION";
    n.convertedRegistrationId = reg.id;
    n.convertedRegistrationReference = reg.reference;
    n.updatedAt = new Date().toISOString();
    n.version += 1;
    n.statusHistory.push({ status: "CONVERTED_TO_REGISTRATION", at: new Date().toISOString(), by: actorName });
    logCrvsAudit(innerDb, actorName, "converted to registration", "crvs.annulment_notification", n.reference, `Created registration ${reg.reference}.`);
    return innerDb;
  });

  return getDemoData().crvsAnnulmentRegistrations.find((r) => r.id === draft.id)!;
};
