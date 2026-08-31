// Foreign-annulment-decision recognition review (spec §6D/§20) — a frontend
// policy workflow only; never claims to make a binding legal determination
// beyond this configured demo process. Mirrors crvsDivorceForeignReview.ts's
// shape closely; requirements (translation, authentication/legalization,
// exequatur/recognition) read from annulmentPolicyConfig, never hardcoded
// here.
import { updateDemoData } from "../storage/demoStore";
import { AnnulmentRegistration, AnnulmentRegistrationStatus, ForeignAnnulmentRecognition } from "@/domain/crvs/types";
import { assertTransitionAnnulmentRegistration } from "@/domain/crvs/statusMachines";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoInitializeAnnulmentForeignRecognition = async (
  registrationId: string,
  input: Pick<ForeignAnnulmentRecognition, "country" | "foreignCourtOrAuthority" | "party1Nationality" | "party2Nationality">,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.foreignRecognition = {
      status: "PENDING",
      country: input.country,
      foreignCourtOrAuthority: input.foreignCourtOrAuthority,
      jurisdiction: reg.foreignRecognition.jurisdiction,
      party1Nationality: input.party1Nationality,
      party2Nationality: input.party2Nationality,
      translationRequired: annulmentPolicyConfig.foreignDecision.translationRequiredByDefault,
      translationProvided: false,
      authenticationRequired: annulmentPolicyConfig.foreignDecision.authenticationRequiredByDefault,
      authenticationProvided: false,
      exequaturOrRecognitionRequired: annulmentPolicyConfig.foreignDecision.exequaturOrRecognitionRequiredByDefault,
      exequaturOrRecognitionProvided: false,
      missingRequirements: [],
    };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "started foreign-decision recognition review", "crvs.annulment_foreign_review", reg.reference, `${input.country} — ${input.foreignCourtOrAuthority}`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

const computeMissingRequirements = (recognition: ForeignAnnulmentRecognition): string[] => {
  const missing: string[] = [];
  if (recognition.translationRequired && !recognition.translationProvided) missing.push("Certified translation");
  if (recognition.authenticationRequired && !recognition.authenticationProvided) missing.push("Authentication/legalization");
  if (recognition.exequaturOrRecognitionRequired && !recognition.exequaturOrRecognitionProvided) missing.push("Exequatur or recognition decision");
  return missing;
};

export const demoRequestAnnulmentForeignEvidence = async (registrationId: string, note: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.foreignRecognition.missingRequirements = computeMissingRequirements(reg.foreignRecognition);
    reg.foreignRecognition.supervisorNotes = note;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "requested foreign evidence", "crvs.annulment_foreign_review", reg.reference, note);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

export const demoConfirmAnnulmentForeignRequirementsSatisfied = async (registrationId: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    const missing = computeMissingRequirements(reg.foreignRecognition);
    if (missing.length > 0) {
      throw new Error(`Cannot confirm recognition requirements: still missing ${missing.join(", ")}.`);
    }
    reg.foreignRecognition.status = "REQUIREMENTS_SATISFIED";
    reg.foreignRecognition.missingRequirements = [];
    reg.foreignRecognition.reviewedBy = actorName;
    reg.foreignRecognition.reviewedAt = new Date().toISOString();
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "confirmed foreign recognition requirements", "crvs.annulment_foreign_review", reg.reference, "All configured requirements satisfied.");
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

export const demoRouteAnnulmentForeignToLegalReview = async (registrationId: string, note: string, actorName: string): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.foreignRecognition.status = "REQUIRES_LEGAL_REVIEW";
    reg.foreignRecognition.supervisorNotes = note;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "routed to legal/manual review", "crvs.annulment_foreign_review", reg.reference, note);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

export const demoApproveAnnulmentForeignRecognition = async (
  registrationId: string,
  nextStatus: AnnulmentRegistrationStatus,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    if (reg.foreignRecognition.status !== "REQUIREMENTS_SATISFIED") {
      throw new Error("Foreign-decision recognition requirements must be satisfied before this verification can be approved.");
    }
    assertTransitionAnnulmentRegistration(reg.status, nextStatus);
    const now = new Date().toISOString();
    reg.status = nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: nextStatus, at: now, by: actorName, note: "Foreign-decision verification approved." });
    logCrvsAudit(db, actorName, "approved foreign-decision verification", "crvs.annulment_foreign_review", reg.reference, `Now ${nextStatus}.`);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};

export const demoRejectAnnulmentForeignRecognition = async (
  registrationId: string,
  reason: string,
  actorId: string,
  actorName: string
): Promise<AnnulmentRegistration> => {
  return updateDemoData((db) => {
    const reg = db.crvsAnnulmentRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Annulment registration");
    reg.foreignRecognition.status = "REJECTED";
    assertTransitionAnnulmentRegistration(reg.status, "REJECTED");
    const now = new Date().toISOString();
    reg.status = "REJECTED";
    reg.rejectedAt = now;
    reg.rejectedBy = actorId;
    reg.rejectionReason = { reason: "Foreign-decision recognition requirements not met.", explanation: reason, evidenceRefs: [], applicantsNotified: false };
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "rejected foreign-decision verification", "crvs.annulment_foreign_review", reg.reference, reason);
    return db;
  }).crvsAnnulmentRegistrations.find((r) => r.id === registrationId)!;
};
