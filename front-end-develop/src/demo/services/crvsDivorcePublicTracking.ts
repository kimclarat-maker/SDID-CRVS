// The ONLY function the unauthenticated public tracking route
// (/civil-registration/divorce/case/:reference) may call — it never returns
// the full DivorceRegistration, only the redacted DivorcePublicTrackingView
// projection (spec §11 "must not display private judgment narrative,
// restricted attachments, internal staff notes, audit metadata, or
// sensitive information about the other former spouse"). Masking is done
// here, in the data shape itself, mirroring crvsMarriagePublicTracking.ts.
import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";
import { DivorcePublicTrackingView } from "@/domain/crvs/types";
import { DIVORCE_REGISTRATION_STATUS_LABELS, DIVORCE_REGISTRATION_TIMELINE_ORDER } from "@/domain/crvs/statusMachines";

const NEXT_ACTION_BY_STATUS: Record<string, string> = {
  DRAFT: "Continue your saved registration request.",
  SUBMITTED: "Your request is queued for review.",
  UNDER_REVIEW: "Your request is being reviewed. No action needed right now.",
  CORRECTION_REQUIRED: "A correction has been requested — check your notification for the response link.",
  RESUBMITTED: "Your corrected request is back in review.",
  JUDGMENT_VERIFICATION: "The court decision is being verified. No action needed right now.",
  FOREIGN_JUDGMENT_REVIEW: "Your foreign decision is under recognition review.",
  EXCEPTION_REVIEW: "Your request needs additional review by a supervisor.",
  APPROVED: "Approved. Final registration is being completed.",
  REJECTED: "This request was not approved. Contact your service office for details.",
  REGISTERED: "Your divorce is registered. You may request a divorce record or certificate.",
  CANCELLED: "This request has been cancelled.",
};

export const demoGetDivorcePublicTrackingView = async (reference: string): Promise<DivorcePublicTrackingView | undefined> => {
  const db = getDemoData();
  const reg = db.crvsDivorceRegistrations.find((r) => r.reference === reference);
  if (!reg) return demoDelay(undefined);

  const timeline = DIVORCE_REGISTRATION_TIMELINE_ORDER.filter((status) => reg.statusHistory.some((h) => h.status === status) || status === reg.status).map((status) => ({
    status,
    label: DIVORCE_REGISTRATION_STATUS_LABELS[status],
    at: reg.statusHistory.find((h) => h.status === status)?.at,
  }));

  const openCorrection = reg.correctionRequests.find((c) => !c.resolvedAt);

  const view: DivorcePublicTrackingView = {
    reference: reg.reference,
    status: reg.status,
    submittedAt: reg.submittedAt,
    processingOfficeName: reg.processingOffice.selectedProcessingOfficeName,
    timeline,
    hasOpenCorrection: !!openCorrection,
    additionalEvidenceRequested: !!openCorrection?.items.some((i) => i.documentsRequired),
    applicantActionRequired: reg.status === "CORRECTION_REQUIRED",
    registrationCompleted: reg.status === "REGISTERED",
    certificateEligible: reg.certificateEligibility?.status === "ELIGIBLE",
    nextAction: NEXT_ACTION_BY_STATUS[reg.status] || "Contact your service office for the latest status.",
  };
  return demoDelay(view);
};
