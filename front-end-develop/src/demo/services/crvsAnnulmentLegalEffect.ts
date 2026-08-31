// The one genuinely new concern annulment has that divorce doesn't (spec
// §2/§17): the "legal-effect classification" the application never
// determines itself. proposeAnnulmentLegalEffectClassification computes a
// SUGGESTION only, derived from the raw void/voidable fact captured off the
// decision (annulmentPolicyConfig.proposedClassificationFromDecision) —
// authorized staff (annulment.legal_effect.classify) always make the final
// call via demoConfirmAnnulmentLegalEffectClassification. Once the case is
// APPROVED (legalEffect.lockedAt set by demoApproveAnnulmentRegistration),
// the classification can never be silently changed — confirm throws rather
// than allowing a quiet overwrite.
import { updateDemoData } from "../storage/demoStore";
import { AnnulmentRegistration, AnnulmentLegalEffectClassification } from "@/domain/crvs/types";
import { assertTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import { proposedClassificationFromDecision, sdidConsequenceFor, certificateConsequenceFor } from "@/domain/crvs/annulmentPolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

/** Computes (but never confirms) the proposed classification plus a preview
 * of what SDID/certificate/marriage-status consequence that proposal would
 * carry if later confirmed as-is — display-only, purely informative. */
export const demoProposeAnnulmentLegalEffectClassification = async (registrationId: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");

    const proposed = proposedClassificationFromDecision(reg.decision.describesMarriageAs);
    reg.legalEffect.wordingFromDecision = reg.legalEffect.wordingFromDecision || reg.decision.legalEffectWording;
    reg.legalEffect.proposedClassification = proposed;

    const party1Consequence = sdidConsequenceFor(proposed);
    const party2Consequence = sdidConsequenceFor(proposed);
    reg.legalEffect.proposedSdid = {
      party1: { proposedCivilStatus: party1Consequence.proposedCivilStatus, rationale: party1Consequence.rationale },
      party2: { proposedCivilStatus: party2Consequence.proposedCivilStatus, rationale: party2Consequence.rationale },
    };
    reg.legalEffect.certificateConsequence = certificateConsequenceFor(proposed);
    reg.legalEffect.marriageStatusResult = proposed === "EFFECT_REQUIRES_MANUAL_REVIEW" || proposed === "OTHER_AUTHORIZED_EFFECT" ? "REQUIRES_MANUAL_REVIEW" : "ANNULLED";

    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "proposed legal-effect classification", "crvs.annulment_legal_effect", reg.reference, `Proposed: ${proposed} (not yet confirmed).`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

/** The one place a classification becomes authoritative. Throws if the
 * legal effect has already been locked (case APPROVED) — spec "must not
 * allow the classification to be silently changed after approval." */
export const demoConfirmAnnulmentLegalEffectClassification = async (
  registrationId: string,
  classification: AnnulmentLegalEffectClassification,
  actorName: string,
  note?: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.legalEffect.lockedAt) {
      throw new Error("The legal-effect classification is locked and cannot be changed after approval.");
    }

    const now = new Date().toISOString();
    reg.legalEffect.confirmedClassification = classification;
    reg.legalEffect.classificationHistory.push({ classification, setBy: actorName, setAt: now, note });

    const party1Consequence = sdidConsequenceFor(classification);
    const party2Consequence = sdidConsequenceFor(classification);
    reg.legalEffect.proposedSdid = {
      party1: { proposedCivilStatus: party1Consequence.proposedCivilStatus, rationale: party1Consequence.rationale },
      party2: { proposedCivilStatus: party2Consequence.proposedCivilStatus, rationale: party2Consequence.rationale },
    };
    reg.legalEffect.certificateConsequence = certificateConsequenceFor(classification);
    reg.legalEffect.marriageStatusResult =
      classification === "EFFECT_REQUIRES_MANUAL_REVIEW" || classification === "OTHER_AUTHORIZED_EFFECT" ? "REQUIRES_MANUAL_REVIEW" : "ANNULLED";
    reg.legalEffect.reviewingOfficerName = actorName;

    reg.updatedAt = now;
    reg.version += 1;
    logCrvsAudit(db, actorName, "confirmed legal-effect classification", "crvs.annulment_legal_effect", reg.reference, `Confirmed: ${classification}.`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

/** Stamps a manual-review proposal without confirming it, and routes the
 * case status into LEGAL_EFFECT_REVIEW if it isn't already there. */
export const demoRouteAnnulmentLegalEffectManualReview = async (registrationId: string, reason: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const now = new Date().toISOString();

    reg.legalEffect.proposedClassification = "EFFECT_REQUIRES_MANUAL_REVIEW";

    if (reg.status !== "LEGAL_EFFECT_REVIEW") {
      assertTransitionAnnulmentRegistration(reg.status, "LEGAL_EFFECT_REVIEW");
      reg.status = "LEGAL_EFFECT_REVIEW";
      reg.statusHistory.push({ status: "LEGAL_EFFECT_REVIEW", at: now, by: actorName, note: reason });
    }

    reg.updatedAt = now;
    reg.version += 1;
    logCrvsAudit(db, actorName, "routed legal effect to manual review", "crvs.annulment_legal_effect", reg.reference, reason);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};
