// Late-registration classification. Kept deliberately simple/deterministic —
// this is a demo, not a jurisdiction-configurable rules engine — but isolated
// here so the wizard and services agree on one calculation.

// Registrations reported more than this many days after birth are classified late.
export const LATE_REGISTRATION_THRESHOLD_DAYS = 30;

// Beyond this many days late, supervisor escalation (EXCEPTION_REVIEW routing
// in addition to LATE_REGISTRATION_REVIEW) is required rather than a routine
// supervisor sign-off.
export const EXCEPTION_ESCALATION_THRESHOLD_DAYS = 90;

export function daysAfterBirth(dateOfBirth: string, dateReported: string): number {
  const dob = new Date(dateOfBirth).getTime();
  const reported = new Date(dateReported).getTime();
  if (Number.isNaN(dob) || Number.isNaN(reported)) return 0;
  return Math.max(0, Math.round((reported - dob) / (1000 * 60 * 60 * 24)));
}

export function isLateRegistration(dateOfBirth: string, dateReported: string): boolean {
  return daysAfterBirth(dateOfBirth, dateReported) > LATE_REGISTRATION_THRESHOLD_DAYS;
}

export function requiresSupervisorReview(dateOfBirth: string, dateReported: string): boolean {
  return isLateRegistration(dateOfBirth, dateReported);
}

export function requiresExceptionEscalation(dateOfBirth: string, dateReported: string): boolean {
  return daysAfterBirth(dateOfBirth, dateReported) > EXCEPTION_ESCALATION_THRESHOLD_DAYS;
}
