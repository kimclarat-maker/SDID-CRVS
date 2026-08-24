// Small helpers shared across every death-notification / death-registration
// screen (src/screens/dashboard/crvs/death*/**), mirroring births/shared.ts's
// role for the birth module. Actor-name/account helpers now live in
// utils/workspace (getCurrentActorName/getCurrentAccountId) so they aren't
// duplicated here — only death-specific formatting/labels/empty-object
// factories live in this file.
import {
  DeathRegistrationCase,
  DeceasedPerson,
  DeathOccurrence,
  Declarant,
  DeathReportingPathway,
  DeathPlaceCategory,
  DeathCircumstanceCategory,
} from "@/domain/crvs/types";

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
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function deceasedDisplayName(deceased: DeceasedPerson): string {
  if (deceased.identityStatus === "IDENTITY_UNKNOWN") return "Unidentified person";
  return [deceased.firstName, deceased.middleName, deceased.lastName].filter(Boolean).join(" ") || "Unnamed";
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const emptyDeceased = (): DeceasedPerson => ({
  identityStatus: "KNOWN",
  sex: "UNKNOWN",
  verification: "NOT_VERIFIED",
});

export const emptyOccurrence = (): DeathOccurrence => ({
  dateOfDeath: "",
  placeCategory: "HEALTH_FACILITY",
  location: "",
  adminLocation: "",
  jurisdiction: "",
  circumstanceCategory: "UNKNOWN",
});

export const emptyDeathDeclarant = (): Declarant => ({
  relationship: "",
  documentType: "NONE",
  firstName: "",
  lastName: "",
  verification: "NOT_VERIFIED",
});

export const PATHWAY_LABELS: Record<DeathReportingPathway, string> = {
  HEALTH_FACILITY: "Health-facility death",
  COMMUNITY: "Community / non-facility death",
  LATE: "Late registration",
  MEDICO_LEGAL: "Medico-legal case",
  UNIDENTIFIED: "Unidentified deceased person",
};

export const PLACE_CATEGORY_LABELS: Record<DeathPlaceCategory, string> = {
  HEALTH_FACILITY: "Health facility",
  HOME: "Home",
  PUBLIC_PLACE: "Public place",
  TRANSIT: "In transit",
  OTHER: "Other",
};

export const CIRCUMSTANCE_LABELS: Record<DeathCircumstanceCategory, string> = {
  NATURAL_ILLNESS: "Natural / illness",
  ACCIDENT: "Accident",
  SUSPECTED_UNNATURAL: "Suspected unnatural",
  UNKNOWN: "Unknown",
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

export const VERIFICATION_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  UNVERIFIED_PROVIDED: "Provided, unverified",
  MANUAL_REVIEW_REQUIRED: "Manual review required",
};

/** Read-only "can this case still be edited by its officer" gate reused by
 * the details page, edit page and queue alike. */
export function isEditableDeathDraft(deathCase: Pick<DeathRegistrationCase, "status">): boolean {
  return deathCase.status === "DRAFT";
}

export function deathFullName(first?: string, middle?: string, last?: string): string {
  return [first, middle, last].filter(Boolean).join(" ").trim() || "—";
}

export function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
