// Small helpers shared across the birth-registration wizard, case-details
// page and correction workflow (src/screens/dashboard/crvs/births/**).
// Not part of the file list the milestone spec enumerates, but every one of
// those files needs "who is the current officer" and "mask this identity
// document number" — duplicating that logic six times would be worse than
// one extra, births/-scoped helper module.
import { cfg } from "@/constants/cfg";
import {
  BirthRegistrationCase,
  ChildDetails,
  Declarant,
  FatherDetails,
  MotherDetails,
} from "@/domain/crvs/types";

const STORAGE_NAME = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";

function readSession(): any | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_NAME);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Display name for the signed-in officer, used as the `actorName` argument
 * every crvs demo service call records into the audit trail / status history. */
export function getActorName(): string {
  const session = readSession();
  const first = session?.firstName || session?.account?.firstName;
  const last = session?.lastName || session?.account?.lastName;
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || session?.email || session?.account?.email || "CRVS Registration Officer";
}

/** Masks an identity document number to its last 4 characters — used
 * everywhere outside the officer's own editing flow (spec: mask document
 * numbers anywhere shown outside the officer's own editing flow). */
export function maskDocumentNumber(value?: string): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${"*".repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function childDisplayName(child: ChildDetails): string {
  return [child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ") || "Unnamed child";
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const emptyChild = (): ChildDetails => ({
  lastName: "",
  sex: "UNKNOWN",
  dateOfBirth: "",
  placeOfBirth: "",
  multipleBirth: { isMultiple: false },
});

export const emptyMother = (): MotherDetails => ({
  firstName: "",
  lastName: "",
  documentType: "NONE",
  nationality: "",
  verification: "NOT_VERIFIED",
});

export const emptyFather = (): FatherDetails => ({
  availability: "NOT_DECLARED",
});

export const emptyDeclarant = (): Declarant => ({
  relationship: "",
  documentType: "NONE",
  firstName: "",
  lastName: "",
  verification: "NOT_VERIFIED",
});

/** Human labels for the wizard/queue selects — kept local since these are
 * presentation-only vocabularies, not domain rules. */
export const OCCURRENCE_TYPE_LABELS: Record<string, string> = {
  FACILITY: "Health facility",
  HOME: "Home / community",
  TRANSIT: "In transit",
  OTHER: "Other",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  REFUGEE_ID: "Refugee ID",
  DRIVER_LICENSE: "Driver's license",
  OTHER: "Other",
  NONE: "None provided",
};

export const FATHER_AVAILABILITY_LABELS: Record<string, string> = {
  PROVIDED_VERIFIED: "Provided — verified",
  PROVIDED_UNVERIFIED: "Provided — not yet verified",
  NOT_DECLARED: "Not declared",
  UNKNOWN: "Unknown",
  LEGALLY_UNAVAILABLE: "Legally unavailable",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  UNVERIFIED_PROVIDED: "Provided, unverified",
  MANUAL_REVIEW_REQUIRED: "Manual review required",
};

// StatusBadge (screens/dashboard/crvs/components/StatusBadge.tsx) only
// supports kind="notification"|"registration"|"sync" — there's no
// "verification" kind there, so the wizard/details page build their own
// pill for VerificationState using these two small maps instead.
export const VERIFICATION_TONE: Record<string, string> = {
  NOT_VERIFIED: "neutral",
  VERIFIED: "success",
  UNVERIFIED_PROVIDED: "warning",
  MANUAL_REVIEW_REQUIRED: "danger",
};

export const VERIFICATION_ICON: Record<string, string> = {
  NOT_VERIFIED: "radio_button_unchecked",
  VERIFIED: "verified",
  UNVERIFIED_PROVIDED: "help",
  MANUAL_REVIEW_REQUIRED: "flag",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  FROM_NOTIFICATION: "From birth notification",
  COMMUNITY: "Community birth",
  LATE: "Late birth registration",
  ABROAD: "Birth abroad",
  OTHER: "Other direct registration",
};

/** Read-only "can this case still be edited by its officer" gate reused by
 * the details page, edit page and drafts queue alike. */
export function isEditableDraft(registrationCase: Pick<BirthRegistrationCase, "status">): boolean {
  return registrationCase.status === "DRAFT";
}
