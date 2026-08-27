// Foreign-divorce-decision recognition review (spec §5D/§19) — a frontend
// policy workflow only; never claims to make a binding legal determination
// beyond this configured demo process. Requirements (translation,
// authentication/legalization, exequatur/recognition) read from
// divorcePolicyConfig, never hardcoded here.
import { updateDemoData } from "../storage/demoStore";
import { DivorceRegistration, ForeignDivorceRecognition } from "@/domain/crvs/types";
import { assertTransitionDivorceRegistration } from "@/domain/crvs/statusMachines";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoInitializeForeignRecognition = (
  registrationId: string,
  input: Pick<ForeignDivorceRecognition, "country" | "foreignCourtOrAuthority" | "spouse1Nationality" | "spouse2Nationality">,
  actorName: string
): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.foreignRecognition = {
      status: "PENDING",
      country: input.country,
      foreignCourtOrAuthority: input.foreignCourtOrAuthority,
      spouse1Nationality: input.spouse1Nationality,
      spouse2Nationality: input.spouse2Nationality,
      translationRequired: divorcePolicyConfig.foreignJudgment.translationRequiredByDefault,
      translationProvided: false,
      authenticationRequired: divorcePolicyConfig.foreignJudgment.authenticationRequiredByDefault,
      authenticationProvided: false,
      exequaturOrRecognitionRequired: divorcePolicyConfig.foreignJudgment.exequaturOrRecognitionRequiredByDefault,
      exequaturOrRecognitionProvided: false,
      missingRequirements: [],
    };
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    result = reg;
    return db;
  });
  return result!;
};

const computeMissingRequirements = (recognition: ForeignDivorceRecognition): string[] => {
  const missing: string[] = [];
  if (recognition.translationRequired && !recognition.translationProvided) missing.push("Certified translation");
  if (recognition.authenticationRequired && !recognition.authenticationProvided) missing.push("Authentication/legalization");
  if (recognition.exequaturOrRecognitionRequired && !recognition.exequaturOrRecognitionProvided) missing.push("Exequatur or recognition judgment");
  return missing;
};

export const demoRequestForeignEvidence = (registrationId: string, note: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.foreignRecognition.missingRequirements = computeMissingRequirements(reg.foreignRecognition);
    reg.foreignRecognition.supervisorNotes = note;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "requested foreign evidence", "crvs.divorce_foreign_review", reg.reference, note);
    result = reg;
    return db;
  });
  return result!;
};

export const demoConfirmForeignRequirementsSatisfied = (registrationId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
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
    logCrvsAudit(db, actorName, "confirmed foreign recognition requirements", "crvs.divorce_foreign_review", reg.reference, "All configured requirements satisfied.");
    result = reg;
    return db;
  });
  return result!;
};

export const demoRouteForeignToLegalReview = (registrationId: string, note: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.foreignRecognition.status = "REQUIRES_LEGAL_REVIEW";
    reg.foreignRecognition.supervisorNotes = note;
    reg.updatedAt = new Date().toISOString();
    reg.version += 1;
    logCrvsAudit(db, actorName, "routed to legal/manual review", "crvs.divorce_foreign_review", reg.reference, note);
    result = reg;
    return db;
  });
  return result!;
};

export const demoApproveForeignRecognition = (registrationId: string, nextStatus: DivorceRegistration["status"], actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    if (reg.foreignRecognition.status !== "REQUIREMENTS_SATISFIED") {
      throw new Error("Foreign-decision recognition requirements must be satisfied before this verification can be approved.");
    }
    assertTransitionDivorceRegistration(reg.status, nextStatus);
    const now = new Date().toISOString();
    reg.status = nextStatus;
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: nextStatus, at: now, by: actorName, note: "Foreign-decision verification approved." });
    logCrvsAudit(db, actorName, "approved foreign-decision verification", "crvs.divorce_foreign_review", reg.reference, `Now ${nextStatus}.`);
    result = reg;
    return db;
  });
  return result!;
};

export const demoRejectForeignRecognition = (registrationId: string, reason: string, actorId: string, actorName: string): DivorceRegistration => {
  let result: DivorceRegistration | undefined;
  updateDemoData((db) => {
    const reg = db.crvsDivorceRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new NotFoundError("Divorce registration");
    reg.foreignRecognition.status = "REJECTED";
    assertTransitionDivorceRegistration(reg.status, "REJECTED");
    const now = new Date().toISOString();
    reg.status = "REJECTED";
    reg.rejectedAt = now;
    reg.rejectedBy = actorId;
    reg.rejectionReason = { reason: "Foreign-decision recognition requirements not met.", explanation: reason, evidenceRefs: [], applicantsNotified: false };
    reg.updatedAt = now;
    reg.version += 1;
    reg.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: reason });
    logCrvsAudit(db, actorName, "rejected foreign-decision verification", "crvs.divorce_foreign_review", reg.reference, reason);
    result = reg;
    return db;
  });
  return result!;
};
