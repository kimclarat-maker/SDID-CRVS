// The ONLY function the unauthenticated public tracking route
// (/civil-registration/marriage/application/:reference) may call — it never
// returns the full MarriageApplication, only the redacted
// MarriagePublicTrackingView projection (spec §6 "must NOT reveal the
// partner's protected identity details through an unverified tracking
// session"). Masking is done here, in the data shape itself, not left to a
// UI-layer permission gate — the public site has no permission system at
// all, so gating only at the component would still ship the full record
// over the network.
import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";
import { MarriagePublicTrackingView } from "@/domain/crvs/types";
import { MARRIAGE_APPLICATION_STATUS_LABELS, MARRIAGE_APPLICATION_TIMELINE_ORDER } from "@/domain/crvs/statusMachines";

const maskName = (first?: string, last?: string) => {
  const f = first ? `${first.charAt(0)}.` : "?.";
  const l = last ? `${last.charAt(0)}.` : "?.";
  return `${f} ${l}`;
};

const NEXT_ACTION_BY_STATUS: Record<string, string> = {
  DRAFT: "Continue your saved declaration.",
  PARTNER_VERIFICATION_REQUIRED: "Waiting for the second applicant to confirm participation.",
  SUBMITTED: "Your declaration is queued for eligibility review.",
  ELIGIBILITY_REVIEW: "Your declaration is being reviewed. No action needed right now.",
  CORRECTION_REQUIRED: "A correction has been requested — check your notification for the response link.",
  RESUBMITTED: "Your corrected declaration is back in review.",
  PAYMENT_PENDING: "A fee payment is required before approval can proceed.",
  PAID: "Payment received — awaiting final approval.",
  APPROVED: "Approved. An appointment will be scheduled shortly.",
  REJECTED: "This declaration was not approved. Contact your service office for details.",
  APPOINTMENT_SCHEDULED: "An appointment has been scheduled — see your appointment details.",
  READY_FOR_CEREMONY: "Both applicants are checked in and ready for the ceremony.",
  CEREMONY_COMPLETED: "The ceremony is complete — registration is being finalized.",
  NO_SHOW: "The appointment was missed. Contact your service office to reschedule.",
  POSTPONED: "The ceremony was postponed. Contact your service office to reschedule.",
  CANCELLED: "This declaration has been cancelled.",
  REGISTERED: "Your marriage is registered. You may request a marriage certificate.",
};

export const demoGetMarriagePublicTrackingView = async (reference: string): Promise<MarriagePublicTrackingView | undefined> => {
  const db = getDemoData();
  const app = db.crvsMarriageApplications.find((a) => a.reference === reference);
  if (!app) return demoDelay(undefined);

  const appointment = app.appointmentId ? db.crvsMarriageAppointments.find((a) => a.id === app.appointmentId) : undefined;

  const timeline = MARRIAGE_APPLICATION_TIMELINE_ORDER.filter(
    (status) => app.statusHistory.some((h) => h.status === status) || status === app.status
  ).map((status) => ({
    status,
    label: MARRIAGE_APPLICATION_STATUS_LABELS[status],
    at: app.statusHistory.find((h) => h.status === status)?.at,
  }));

  const view: MarriagePublicTrackingView = {
    reference: app.reference,
    status: app.status,
    submittedAt: app.submittedAt,
    officeName: app.officeName,
    maskedSpouseSummary: `${maskName(app.applicant1.firstName, app.applicant1.lastName)} & ${maskName(app.applicant2.firstName, app.applicant2.lastName)}`,
    timeline,
    hasOpenCorrection: app.correctionRequests.some((c) => !c.resolvedAt),
    hasOpenObjection: app.objection?.status === "PENDING",
    appointment: appointment ? { date: appointment.date, timeSlot: appointment.timeSlot, officeName: appointment.officeName } : undefined,
    nextAction: NEXT_ACTION_BY_STATUS[app.status] || "Contact your service office for the latest status.",
    certificateEligible: app.certificateEligibility?.status === "ELIGIBLE",
  };
  return demoDelay(view);
};
