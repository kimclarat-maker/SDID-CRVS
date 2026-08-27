// Small helpers shared across every marriage-declaration / marriage-
// registration screen (src/screens/dashboard/crvs/marriage*/**, src/screens/
// public/civilRegistration/marriage/**), mirroring deathShared.ts's role for
// the death module.
import { MarriageApplicant, CivilStatusCategory, NationalityCategory } from "@/domain/crvs/types";

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

export function applicantDisplayName(applicant: MarriageApplicant): string {
  return [applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(" ") || "Unnamed applicant";
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const emptyApplicant = (spouseRole: "APPLICANT1" | "APPLICANT2"): MarriageApplicant => ({
  spouseRole,
  nationalityCategory: "CITIZEN",
  documentType: "NONE",
  sex: "UNKNOWN",
  civilStatus: "SINGLE",
  verification: "NOT_VERIFIED",
  partnerConfirmationStatus: spouseRole === "APPLICANT2" ? "PENDING" : "NOT_REQUIRED",
});

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  REFUGEE_ID: "Refugee ID",
  DRIVER_LICENSE: "Driver's license",
  OTHER: "Other",
  NONE: "None provided",
};

export const CIVIL_STATUS_LABELS: Record<CivilStatusCategory, string> = {
  SINGLE: "Single",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

export const NATIONALITY_CATEGORY_LABELS: Record<NationalityCategory, string> = {
  CITIZEN: "Citizen",
  FOREIGN_NATIONAL: "Foreign national",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  UNVERIFIED_PROVIDED: "Provided, unverified",
  MANUAL_REVIEW_REQUIRED: "Manual review required",
};

export const PARTNER_CONFIRMATION_LABELS: Record<MarriageApplicant["partnerConfirmationStatus"], string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
};

export function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function currencyLabel(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}
