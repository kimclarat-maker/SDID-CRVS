// Centralized transition tables for the three CRVS state machines. Per the
// milestone spec, no component/service may assign a status field directly —
// every write goes through canTransition()/assertTransition() here so illegal
// jumps (e.g. DRAFT straight to REGISTERED) are impossible by construction.
import {
  BirthNotificationStatus,
  BirthRegistrationStatus,
  SdidSyncStatus,
} from "./types";

const NOTIFICATION_TRANSITIONS: Record<BirthNotificationStatus, BirthNotificationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["RETURNED", "ACCEPTED"],
  RETURNED: ["SUBMITTED"],
  ACCEPTED: [],
  CANCELLED: [],
};

const REGISTRATION_TRANSITIONS: Record<BirthRegistrationStatus, BirthRegistrationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "LATE_REGISTRATION_REVIEW", "EXCEPTION_REVIEW"],
  UNDER_REVIEW: ["CORRECTION_REQUIRED", "APPROVED", "REJECTED", "EXCEPTION_REVIEW"],
  CORRECTION_REQUIRED: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  LATE_REGISTRATION_REVIEW: ["UNDER_REVIEW", "EXCEPTION_REVIEW", "CORRECTION_REQUIRED"],
  EXCEPTION_REVIEW: ["UNDER_REVIEW", "LATE_REGISTRATION_REVIEW", "REJECTED"],
  APPROVED: ["REGISTERED"],
  REJECTED: [],
  REGISTERED: [],
  CANCELLED: [],
};

const SYNC_TRANSITIONS: Record<SdidSyncStatus, SdidSyncStatus[]> = {
  NOT_READY: ["PENDING"],
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IDENTITY_CREATED", "FAILED"],
  FAILED: ["IN_PROGRESS", "MANUAL_REVIEW"],
  MANUAL_REVIEW: ["IN_PROGRESS"],
  IDENTITY_CREATED: [],
};

export class IllegalTransitionError extends Error {
  constructor(machine: string, from: string, to: string) {
    super(`Illegal ${machine} transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export function canTransitionNotification(
  from: BirthNotificationStatus,
  to: BirthNotificationStatus
): boolean {
  return NOTIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionNotification(
  from: BirthNotificationStatus,
  to: BirthNotificationStatus
): void {
  if (!canTransitionNotification(from, to)) {
    throw new IllegalTransitionError("notification", from, to);
  }
}

export function canTransitionRegistration(
  from: BirthRegistrationStatus,
  to: BirthRegistrationStatus
): boolean {
  return REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionRegistration(
  from: BirthRegistrationStatus,
  to: BirthRegistrationStatus
): void {
  if (!canTransitionRegistration(from, to)) {
    throw new IllegalTransitionError("registration", from, to);
  }
}

export function canTransitionSync(from: SdidSyncStatus, to: SdidSyncStatus): boolean {
  return SYNC_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionSync(from: SdidSyncStatus, to: SdidSyncStatus): void {
  if (!canTransitionSync(from, to)) {
    throw new IllegalTransitionError("sync", from, to);
  }
}

export const NOTIFICATION_STATUS_LABELS: Record<BirthNotificationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  RETURNED: "Returned for correction",
  ACCEPTED: "Accepted",
  CANCELLED: "Cancelled",
};

export const REGISTRATION_STATUS_LABELS: Record<BirthRegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CORRECTION_REQUIRED: "Correction required",
  RESUBMITTED: "Resubmitted",
  LATE_REGISTRATION_REVIEW: "Late registration review",
  EXCEPTION_REVIEW: "Exception review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGISTERED: "Registered",
  CANCELLED: "Cancelled",
};

export const SYNC_STATUS_LABELS: Record<SdidSyncStatus, string> = {
  NOT_READY: "Not ready",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  IDENTITY_CREATED: "Identity created",
  FAILED: "Failed",
  MANUAL_REVIEW: "Manual review",
};

// The status-timeline stages shown on the case-details page (spec §11) — only
// entries the case has actually reached (or is eligible to reach) are shown.
export const REGISTRATION_TIMELINE_ORDER: BirthRegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "APPROVED",
  "REGISTERED",
];
