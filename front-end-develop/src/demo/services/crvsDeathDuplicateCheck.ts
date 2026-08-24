import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DeathDuplicateCandidateInput, findDeathDuplicateCandidates, overallDeathMatchLevel } from "@/domain/crvs/deathDuplicateDetection";
import { DeathRegistrationCase, DeathDuplicateCheckResult, DuplicateResolution } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoRunDeathDuplicateCheck = async (
  caseId: string,
  input: DeathDuplicateCandidateInput,
  actorName: string
): Promise<DeathDuplicateCheckResult> => {
  await demoDelay(null, 500);

  let result: DeathDuplicateCheckResult | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");

    const candidates = findDeathDuplicateCandidates(input, db.crvsDeathRegistrations, caseId);
    const overallLevel = overallDeathMatchLevel(candidates);
    result = { checkedAt: new Date().toISOString(), checkedBy: actorName, candidates, overallLevel };
    deathCase.duplicateCheck = result;
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran duplicate check",
      "crvs.death_duplicate_check",
      deathCase.reference,
      `Result: ${overallLevel} (${candidates.length} candidate${candidates.length === 1 ? "" : "s"}).`
    );
    return db;
  });

  return result!;
};

export const demoResolveDeathDuplicate = (
  caseId: string,
  resolution: Omit<DuplicateResolution, "resolvedBy" | "resolvedAt">,
  actorName: string
): DeathRegistrationCase => {
  let result: DeathRegistrationCase | undefined;
  updateDemoData((db) => {
    const deathCase = db.crvsDeathRegistrations.find((c) => c.id === caseId);
    if (!deathCase) throw new NotFoundError("Death registration case");
    if (!deathCase.duplicateCheck) throw new Error("No duplicate check has been run for this case.");
    deathCase.duplicateCheck.resolution = {
      ...resolution,
      resolvedBy: actorName,
      resolvedAt: new Date().toISOString(),
    };
    deathCase.updatedAt = new Date().toISOString();
    deathCase.version += 1;
    logCrvsAudit(db, actorName, "resolved duplicate", "crvs.death_duplicate_check", deathCase.reference, `${resolution.type}: ${resolution.reason}`);
    result = deathCase;
    return db;
  });
  return result!;
};
