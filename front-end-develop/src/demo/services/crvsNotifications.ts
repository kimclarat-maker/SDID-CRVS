import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { BirthNotification, ReturnReason } from "@/domain/crvs/types";
import { assertTransitionNotification } from "@/domain/crvs/statusMachines";
import { logCrvsAudit } from "./crvsAudit";
import { ConcurrencyError, NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

export type NotificationListParams = {
  status?: string;
  facilityId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export const demoListNotifications = async (params: NotificationListParams) => {
  const db = getDemoData();
  let results = db.crvsNotifications;

  if (params.status) results = results.filter((n) => n.status === params.status.toUpperCase());
  if (params.facilityId) results = results.filter((n) => n.facilityId === params.facilityId);
  if (params.dateFrom) results = results.filter((n) => n.child.dateOfBirth >= params.dateFrom!);
  if (params.dateTo) results = results.filter((n) => n.child.dateOfBirth <= params.dateTo!);
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (n) =>
        n.reference.toLowerCase().includes(term) ||
        `${n.child.firstName || ""} ${n.child.lastName}`.toLowerCase().includes(term)
    );
  }

  results = [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const total = results.length;
  const offset = params.offset || 0;
  const limit = params.limit || 20;
  return demoDelay({ data: results.slice(offset, offset + limit), total });
};

export const demoGetNotification = async (id: string): Promise<BirthNotification | undefined> => {
  const db = getDemoData();
  return demoDelay(db.crvsNotifications.find((n) => n.id === id || n.reference === id));
};

export type NotificationDraftInput = Partial<
  Pick<BirthNotification, "facilityId" | "facilityName" | "sourceReference" | "occurrenceType" | "child" | "mother" | "father">
>;

const nextNotificationReference = (db: ReturnType<typeof getDemoData>) => {
  const year = new Date().getFullYear();
  const seq = db.crvsNotifications.length + 1;
  return `BN-DEMO-${year}-${seq.toString().padStart(4, "0")}`;
};

export const demoCreateNotificationDraft = (
  input: NotificationDraftInput,
  actorId: string,
  actorName: string
): BirthNotification =>
  updateDemoData((db) => {
    const now = new Date().toISOString();
    const draft: BirthNotification = {
      id: nextId("BN"),
      reference: nextNotificationReference(db),
      status: "DRAFT",
      facilityId: input.facilityId || "",
      facilityName: input.facilityName || "",
      sourceReference: input.sourceReference,
      occurrenceType: input.occurrenceType || "FACILITY",
      child: input.child || {
        lastName: "",
        sex: "UNKNOWN",
        dateOfBirth: "",
        placeOfBirth: "",
        multipleBirth: { isMultiple: false },
      },
      mother: input.mother || {
        firstName: "",
        lastName: "",
        documentType: "NONE",
        nationality: "",
        verification: "NOT_VERIFIED",
      },
      father: input.father || { availability: "NOT_DECLARED" },
      notifierId: actorId,
      notifierName: actorName,
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: "DRAFT", at: now, by: actorName }],
      version: 1,
    };
    db.crvsNotifications.unshift(draft);
    logCrvsAudit(db, actorName, "created draft", "crvs.notification", draft.reference, "Created a birth-notification draft.");
    return db;
  }).crvsNotifications[0];

export const demoUpdateNotificationDraft = (
  id: string,
  patch: NotificationDraftInput,
  actorName: string,
  expectedVersion?: number
): BirthNotification => {
  let updated: BirthNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Birth notification");
    if (notification.status !== "DRAFT" && notification.status !== "RETURNED") {
      throw new Error("Only draft or returned notifications can be edited.");
    }
    if (expectedVersion !== undefined && notification.version !== expectedVersion) {
      throw new ConcurrencyError("This notification");
    }
    Object.assign(notification, patch);
    notification.updatedAt = new Date().toISOString();
    notification.version += 1;
    updated = notification;
    return db;
  });
  return updated!;
};

export const demoSubmitNotification = (id: string, actorName: string): BirthNotification => {
  let result: BirthNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Birth notification");
    assertTransitionNotification(notification.status, "SUBMITTED");
    notification.status = "SUBMITTED";
    notification.submittedAt = new Date().toISOString();
    notification.updatedAt = notification.submittedAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "SUBMITTED", at: notification.submittedAt, by: actorName });
    logCrvsAudit(db, actorName, "submitted", "crvs.notification", notification.reference, "Submitted the birth notification.");
    result = notification;
    return db;
  });
  return result!;
};

export const demoReturnNotification = (id: string, reason: ReturnReason, actorName: string): BirthNotification => {
  let result: BirthNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Birth notification");
    assertTransitionNotification(notification.status, "RETURNED");
    notification.status = "RETURNED";
    notification.returnedAt = new Date().toISOString();
    notification.updatedAt = notification.returnedAt;
    notification.returnReason = reason;
    notification.version += 1;
    notification.statusHistory.push({ status: "RETURNED", at: notification.returnedAt, by: actorName, note: reason.reason });
    logCrvsAudit(db, actorName, "returned", "crvs.notification", notification.reference, `Returned for correction: ${reason.reason}`);
    result = notification;
    return db;
  });
  return result!;
};

export const demoAcceptNotification = (id: string, actorName: string): BirthNotification => {
  let result: BirthNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Birth notification");
    assertTransitionNotification(notification.status, "ACCEPTED");
    notification.status = "ACCEPTED";
    notification.acceptedAt = new Date().toISOString();
    notification.acceptedBy = actorName;
    notification.updatedAt = notification.acceptedAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "ACCEPTED", at: notification.acceptedAt, by: actorName });
    logCrvsAudit(db, actorName, "accepted", "crvs.notification", notification.reference, "Accepted the birth notification for registration.");
    result = notification;
    return db;
  });
  return result!;
};

export const demoCancelNotification = (id: string, reason: string, actorName: string): BirthNotification => {
  let result: BirthNotification | undefined;
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === id);
    if (!notification) throw new NotFoundError("Birth notification");
    assertTransitionNotification(notification.status, "CANCELLED");
    notification.status = "CANCELLED";
    notification.cancelledAt = new Date().toISOString();
    notification.cancellationReason = reason;
    notification.updatedAt = notification.cancelledAt;
    notification.version += 1;
    notification.statusHistory.push({ status: "CANCELLED", at: notification.cancelledAt, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "cancelled", "crvs.notification", notification.reference, `Cancelled: ${reason}`);
    result = notification;
    return db;
  });
  return result!;
};

/** An ACCEPTED notification not yet linked to a registration is eligible for conversion. */
export const canConvertNotification = (notification: BirthNotification): boolean =>
  notification.status === "ACCEPTED" && !notification.convertedToRegistrationId;

export const demoLinkNotificationToRegistration = (notificationId: string, registrationId: string) =>
  updateDemoData((db) => {
    const notification = db.crvsNotifications.find((n) => n.id === notificationId);
    if (notification) notification.convertedToRegistrationId = registrationId;
    return db;
  });
