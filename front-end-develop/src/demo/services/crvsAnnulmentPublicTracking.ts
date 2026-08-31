// The ONLY function the unauthenticated public tracking route
// (/civil-registration/marriage-annulment/case/:reference) may call — it
// never returns the full AnnulmentRegistration, only the redacted
// AnnulmentPublicTrackingView projection (spec §12 "must never reveal
// restricted decision details, internal legal classifications before
// confirmation, restricted attachments, staff notes, audit metadata, or
// sensitive information about the other affected party"). Masking is done
// here, in the data shape itself, mirroring crvsDivorcePublicTracking.ts.
import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";
import { AnnulmentPublicTrackingView } from "@/domain/crvs/types";
import { ANNULMENT_REGISTRATION_STATUS_LABELS, ANNULMENT_REGISTRATION_TIMELINE_ORDER } from "@/domain/crvs/statusMachines";

const NEXT_ACTION_BY_STATUS: Record<string, string> = {
  DRAFT: "Continue your saved registration request.",
  SUBMITTED: "Your request is queued for review.",
  UNDER_REVIEW: "Your request is being reviewed. No action needed right now.",
  CORRECTION_REQUIRED: "A correction has been requested — check your notification for the response link.",
  RESUBMITTED: "Your corrected request is back in review.",
  DECISION_VERIFICATION: "The court decision is being verified. No action needed right now.",
  LEGAL_EFFECT_REVIEW: "The legal effect of the decision is under classification review.",
  FOREIGN_DECISION_REVIEW: "Your foreign decision is under recognition review.",
  EXCEPTION_REVIEW: "Your request needs additional review by a supervisor.",
  APPROVED: "Approved. Final registration is being completed.",
  REJECTED: "This request was not approved. Contact your service office for details.",
  REGISTERED: "Your marriage annulment is registered. You may request an annulment record or certificate.",
  CANCELLED: "This request has been cancelled.",
};

export const demoGetAnnulmentPublicTrackingView = async (reference: string): Promise<AnnulmentPublicTrackingView | undefined> => {
  const db = getDemoData();
  const reg = db.crvsAnnulmentRegistrations.find((r) => r.reference === reference);
  if (!reg) return demoDelay(undefined);

  const timeline = ANNULMENT_REGISTRATION_TIMELINE_ORDER.filter((status) => reg.statusHistory.some((h) => h.status === status) || status === reg.status).map((status) => ({
    status,
    label: ANNULMENT_REGISTRATION_STATUS_LABELS[status],
    at: reg.statusHistory.find((h) => h.status === status)?.at,
  }));

  const openCorrection = reg.correctionRequests.find((c) => !c.resolvedAt);

  const view: AnnulmentPublicTrackingView = {
    reference: reg.reference,
    status: reg.status,
    submittedAt: reg.submittedAt,
    processingOfficeName: reg.processingOffice.selectedProcessingOfficeName,
    timeline,
    hasOpenCorrection: !!openCorrection,
    additionalEvidenceRequested: !!openCorrection?.items.some((i) => i.documentsRequired),
    applicantActionRequired: reg.status === "CORRECTION_REQUIRED",
    registrationCompleted: reg.status === "REGISTERED",
    recordEligible: reg.recordEligibility?.status === "ELIGIBLE",
    certificateEligible: reg.certificateEligibility?.status === "ELIGIBLE",
    nextAction: NEXT_ACTION_BY_STATUS[reg.status] || "Contact your service office for the latest status.",
  };
  return demoDelay(view);
};
