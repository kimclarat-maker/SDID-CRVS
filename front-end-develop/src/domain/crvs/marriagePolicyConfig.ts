// Centralized policy config for the marriage-declaration / eligibility /
// appointment / ceremony workflow — sibling to crvsPolicyConfig.ts rather
// than a merged key on it. Death's config file justifies its own existence
// as "isolated here so the wizard/review/services all read the same
// numbers" scoped to death; marriage's rule surface (advance notice, age +
// exception, jurisdiction, residence, witnesses-per-spouse, nationality x
// civil-status document matrix, special-day fees/capacity, payment,
// appointment capacity, ceremony requirements, objection handling,
// civil-status categories, property regimes, exception triggers) is much
// larger, so it gets its own file rather than crowding two unrelated
// domains' rationale comments into one export. All user-facing rule
// messages must read from here — never hardcode numbers in components
// (spec requirement). Values below are demo-plausible defaults loosely
// modeled on Rwandan civil-marriage practice (advance notice period,
// mandatory physical appearance of both spouses) — this is a demo, not a
// legally authoritative rules engine.
import { CivilStatusCategory, NationalityCategory } from "./types";

export const marriagePolicyConfig = {
  notice: {
    // Days that must elapse between application approval and the earliest
    // permissible ceremony date — a public-notice / objection window.
    minAdvanceNoticeDays: 21,
    maxAdvanceBookingDays: 180,
  },

  age: {
    minimumAge: 21,
    exceptionAllowed: true,
    // An underage case never auto-approves — it always routes to supervisor
    // exception review rather than being silently waived.
    exceptionRequiresSupervisorReview: true,
  },

  jurisdiction: {
    rule: "OFFICE_OF_RESIDENCE_OR_OCCURRENCE" as const,
    permittedOfficeTypes: ["DISTRICT_SECTOR_OFFICE", "EMBASSY_CONSULATE"] as const,
    embassyRequiresBothPartiesForeign: false,
  },

  residence: {
    minResidenceDaysAtSector: 30,
    foreignerRequiresProofOfLegalStay: true,
  },

  witnesses: {
    minimumPerSpouse: 1,
    maximumPerSpouse: 2,
    minimumWitnessAge: 18,
    witnessMustNotBeOtherSpouse: true,
    allowWitnessSharedAcrossBothSpouses: false,
  },

  // Nationality x civil-status document matrix — a 2D lookup, unlike
  // crvsPolicyConfig's 1D per-pathway shape, because marriage's required
  // evidence genuinely varies along both axes at once.
  requiredDocuments: {
    CITIZEN: {
      SINGLE: ["NATIONAL_ID", "PROOF_OF_RESIDENCE", "BIRTH_CERTIFICATE"],
      DIVORCED: ["NATIONAL_ID", "PROOF_OF_RESIDENCE", "DIVORCE_CERTIFICATE"],
      WIDOWED: ["NATIONAL_ID", "PROOF_OF_RESIDENCE", "DECEASED_SPOUSE_DEATH_CERTIFICATE"],
    },
    FOREIGN_NATIONAL: {
      SINGLE: ["PASSPORT", "PROOF_OF_LEGAL_STAY", "CERTIFICATE_OF_NO_IMPEDIMENT", "BIRTH_CERTIFICATE"],
      DIVORCED: ["PASSPORT", "PROOF_OF_LEGAL_STAY", "CERTIFICATE_OF_NO_IMPEDIMENT", "DIVORCE_CERTIFICATE"],
      WIDOWED: ["PASSPORT", "PROOF_OF_LEGAL_STAY", "CERTIFICATE_OF_NO_IMPEDIMENT", "DECEASED_SPOUSE_DEATH_CERTIFICATE"],
    },
  } satisfies Record<NationalityCategory, Record<CivilStatusCategory, string[]>>,

  specialDay: {
    // Demo-only designated high-volume ceremony dates.
    designatedDates: ["2026-02-14", "2026-08-08"] as string[],
    additionalFeeAmount: 15000,
    requiresAdvanceBookingDays: 30,
    capacityMultiplier: 2,
  },

  payment: {
    required: true,
    currency: "RWF",
    standardFeeAmount: 5000,
    exceptionOrLateFeeAmount: 10000,
    waiverRequiresSupervisorApproval: true,
  },

  appointmentCapacity: {
    standardSlotsPerOfficePerDay: 6,
    specialDaySlotsPerOfficePerDay: 12,
    slotDurationMinutes: 30,
    officeOpenTime: "08:00",
    officeCloseTime: "16:00",
    minBookingLeadDays: 3,
    // Demo-only fixed holiday/blocked dates (office-closure days).
    blockedDates: ["2026-01-01", "2026-07-01", "2026-07-04"] as string[],
  },

  ceremony: {
    bothSpousesMustBePhysicallyPresent: true,
    officiantRequired: true,
    allowRemoteWitnessing: false,
    // Whether the person who conducts/records the ceremony outcome may also
    // give the final registration approval — false enforces a genuine
    // three-party maker-checker chain (officer who prepared the case,
    // officiant who conducted the ceremony, registrar who approves).
    separationOfDutiesRequired: true,
  },

  objection: {
    enabled: true,
    windowDaysAfterNoticePosting: 14,
    requiresSupervisorReview: true,
  },

  civilStatusCategories: ["SINGLE", "DIVORCED", "WIDOWED"] as CivilStatusCategory[],
  propertyRegimes: [
    "COMMUNITY_OF_PROPERTY",
    "SEPARATION_OF_PROPERTY",
    "LIMITED_COMMUNITY_OF_PROPERTY",
  ] as const,

  exceptionTriggers: {
    underageWithoutApprovedException: true,
    foreignDocumentRequiresReview: true,
    advanceNoticeWaived: true,
    existingMarriageConflictFound: true,
    civilStatusMismatch: true,
  },
};

export type MarriagePolicyConfig = typeof marriagePolicyConfig;

export function daysUntilCeremony(fromDate: string, ceremonyDate: string): number {
  const from = new Date(fromDate).getTime();
  const ceremony = new Date(ceremonyDate).getTime();
  if (Number.isNaN(from) || Number.isNaN(ceremony)) return 0;
  return Math.round((ceremony - from) / (1000 * 60 * 60 * 24));
}

/** Advance-notice rule: the proposed ceremony date must be at least
 * minAdvanceNoticeDays after the reference date (application submission or
 * approval, depending on caller) and no further out than
 * maxAdvanceBookingDays. */
export function isAdvanceNoticeSatisfied(referenceDate: string, ceremonyDate: string): boolean {
  const days = daysUntilCeremony(referenceDate, ceremonyDate);
  return days >= marriagePolicyConfig.notice.minAdvanceNoticeDays && days <= marriagePolicyConfig.notice.maxAdvanceBookingDays;
}

export function meetsMinimumAge(dateOfBirth: string | undefined, ceremonyDate: string): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const ceremony = new Date(ceremonyDate || new Date().toISOString());
  if (Number.isNaN(dob.getTime()) || Number.isNaN(ceremony.getTime())) return false;
  let age = ceremony.getFullYear() - dob.getFullYear();
  const monthDiff = ceremony.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ceremony.getDate() < dob.getDate())) age -= 1;
  return age >= marriagePolicyConfig.age.minimumAge;
}

export function witnessRequirementForSpouse(): { minimum: number; maximum: number; minimumAge: number } {
  return {
    minimum: marriagePolicyConfig.witnesses.minimumPerSpouse,
    maximum: marriagePolicyConfig.witnesses.maximumPerSpouse,
    minimumAge: marriagePolicyConfig.witnesses.minimumWitnessAge,
  };
}

export function requiredDocumentsFor(nationality: NationalityCategory, civilStatus: CivilStatusCategory): string[] {
  return marriagePolicyConfig.requiredDocuments[nationality][civilStatus];
}

export function isSpecialDay(date: string): boolean {
  return marriagePolicyConfig.specialDay.designatedDates.includes((date || "").slice(0, 10));
}

export function isBlockedDate(date: string): boolean {
  return marriagePolicyConfig.appointmentCapacity.blockedDates.includes((date || "").slice(0, 10));
}

export function feeFor(date: string, isExceptionCase: boolean): number {
  const base = isExceptionCase ? marriagePolicyConfig.payment.exceptionOrLateFeeAmount : marriagePolicyConfig.payment.standardFeeAmount;
  return isSpecialDay(date) ? base + marriagePolicyConfig.specialDay.additionalFeeAmount : base;
}

export function capacityFor(date: string): number {
  return isSpecialDay(date)
    ? marriagePolicyConfig.appointmentCapacity.specialDaySlotsPerOfficePerDay
    : marriagePolicyConfig.appointmentCapacity.standardSlotsPerOfficePerDay;
}
