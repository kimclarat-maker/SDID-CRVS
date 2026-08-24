import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DeathNotification, DeathReturnReason } from "@/domain/crvs/types";
import { assertTransitionDeathNotification } from "@/domain/crvs/statusMachines";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

export type DeathNotificationListParams = {
  status?: string;
  facilityId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListDeathNotifications = async (params: DeathNotificationListParams) => {
  const db = getDemoData();
  let results = db.crvsDeathNotifications;

  if (params.status) {
    const wantedStatus = params.status.toUpperCase();
    results = results.filter((n) => n.status === wantedStatus);
  }
  if (params.facilityId) results = results.filter((n) => n.facilityId === params.facilityId);
  if (params.dateFrom) results = results.filter((n) => n.occurrence.dateOfDeath >= params.dateFrom!);
  if (params.dateTo) results = results.filter((n) => n.occurrence.dateOfDeath <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (n) =>
        n.reference.toLowerCase().includes(term) ||
        `${n.deceased.firstName || ""} ${n.deceased.lastName || ""}`.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetDeathNotification = async (id: string): Promise<DeathNotification | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsDeathNotifications.find((n) => n.id === id || n.reference === id));
};

export type DeathNotificationDraftInput = Partial<
  Pick<DeathNotification, "pathway" | "facilityId" | "facilityName" | "deceased" | "occurrence" | "medicalCertification">
>;

const nextDeathNotificationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsDeathNotifications.length + 1;
  return `DN-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

export const demoCreateDeathNotificationDraft = (
  input: DeathNotificationDraftInput,
  actorId: string,
  actorName: string
): DeathNotification =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const draft: DeathNotification = {
      id: nextId("DN"),
      reference: nextDeathNotificationReference(db),
      status: "DRAFT",
      pathway: input.pathway || "HEALTH_FACILITY",
      facilityId: input.facilityId,
      facilityName: input.facilityName,
      deceased: input.deceased || { identityStatus: "KNOWN", sex: "UNKNOWN", verification: "NOT_VERIFIED" },
      occurrence: input.occurrence || {
        dateOfDeath: "",
        placeCategory: "HEALTH_FACILITY",
        location: "",
        adminLocation: "",
        jurisdiction: "",
        circumstanceCategory: "UNKNOWN",
      },
      medicalCertification: input.medicalCertification,
      notifierId: actorId,
      notifierName: actorName,
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsDeathNotifications.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.death_notification", draft.reference, "Created a death-notification draft.");
    return db;
  }).crvsDeathNotifications[0];

export const demoUpdateDeathNotificationDraft = (
  id: string,
  patch: DeathNotificationDraftInput,
  actorName: string,
  expectedVersion?: number
): DeathNotification => {
  let updated: DeathNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Death notification");
    if (notification.status !== "DRAFT" && notification.status !== "RETURNED") {
      throw new Error("Only draft or returned death notifications can be edited.");
    }
    if (expectedVersion !== undefined && notification.version !== expectedVersion) {
      throw new ConcurrencyError("This death notification");
    }
    Object.assign(notification, patch);
    notification.updatedAt = new Date().toISOString();
    notification.version += 1;
    updated = notification;
    return db;
  });
  return updated!;
};

export const demoSubmitDeathNotification = (id: string, actorName: string): DeathNotification => {
  let result: DeathNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Death notification");
    assertTransitionDeathNotification(notification.status, "SUBMITTED");
    notification.status = "SUBMITTED";
    notification.submittedAt = new Date().toISOString();
    notification.updatedAt = notification.submittedAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "SUBMITTED", at: notification.submittedAt, by: actorName });
    logCrvsAudit(db, actorName, "submitted", "crvs.death_notification", notification.reference, "Submitted the death notification.");
    result = notification;
    return db;
  });
  return result!;
};

export const demoReturnDeathNotification = (id: string, reason: DeathReturnReason, actorName: string): DeathNotification => {
  let result: DeathNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Death notification");
    assertTransitionDeathNotification(notification.status, "RETURNED");
    notification.status = "RETURNED";
    notification.returnedAt = new Date().toISOString();
    notification.updatedAt = notification.returnedAt;
    notification.returnReason = reason;
    notification.version += 1;
    notification.statusHistory.push({ status: "RETURNED", at: notification.returnedAt, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "returned", "crvs.death_notification", notification.reference, `Returned for correction: ${reason.reason}`);
    result = notification;
    return db;
  });
  return result!;
};

export const demoAcceptDeathNotification = (id: string, actorName: string): DeathNotification => {
  let result: DeathNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Death notification");
    assertTransitionDeathNotification(notification.status, "ACCEPTED");
    notification.status = "ACCEPTED";
    notification.acceptedAt = new Date().toISOString();
    notification.acceptedBy = actorName;
    notification.updatedAt = notification.acceptedAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "ACCEPTED", at: notification.acceptedAt, by: actorName });
    logCrvsAudit(db, actorName, "accepted", "crvs.death_notification", notification.reference, "Accepted the death notification for registration.");
    result = notification;
    return db;
  });
  return result!;
};

export const demoCancelDeathNotification = (id: string, reason: string, actorName: string): DeathNotification => {
  let result: DeathNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Death notification");
    assertTransitionDeathNotification(notification.status, "CANCELLED");
    notification.status = "CANCELLED";
    notification.cancelledAt = new Date().toISOString();
    notification.cancellationReason = reason;
    notification.updatedAt = notification.cancelledAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "CANCELLED", at: notification.cancelledAt, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.death_notification", notification.reference, `Cancelled: ${reason}`);
    result = notification;
    return db;
  });
  return result!;
};

/** An ACCEPTED notification not yet linked to a registration is eligible for conversion. */
export const canConvertDeathNotification = (notification: DeathNotification): boolean =>
  notification.status === "ACCEPTED" && !notification.convertedToRegistrationId;

export const demoLinkDeathNotificationToRegistration = (notificationId: string, registrationId: string) =>
  updateDemoData((db) => {
    const notification = db.crvsDeathNotifications.find((n) => n.id === notificationId);
    if (notification) notification.convertedToRegistrationId = registrationId;
    return db;
  });
