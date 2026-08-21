import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DuplicateCandidateInput, findDuplicateCandidates, overallMatchLevel } from "@/domain/crvs/duplicateDetection";
import { DuplicateCheckResult, DuplicateResolution } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoRunDuplicateCheck = async (
  caseId: string,
  input: DuplicateCandidateInput,
  actorName: string
): Promise<DuplicateCheckResult> => {
  await demoDelay(null, 500);

  let result: DuplicateCheckResult | undefined;
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");

    const candidates = findDuplicateCandidates(input, db.crvsRegistrations, caseId);
    const overallLevel = overallMatchLevel(candidates);
    result = { checkedAt: new Date().toISOString(), checkedBy: actorName, candidates, overallLevel };
    registrationCase.duplicateCheck = result;
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran duplicate check",
      "crvs.duplicate_check",
      registrationCase.reference,
      `Result: ${overallLevel} (${candidates.length} candidate${candidates.length === 1 ? "" : "s"}).`
    );
    return db;
  });

  return result!;
};

export const demoResolveDuplicate = (
  caseId: string,
  resolution: Omit<DuplicateResolution, "resolvedBy" | "resolvedAt">,
  actorName: string
) =>
  updateDemoData((db) => {
    const registrationCase = db.crvsRegistrations.find((c) => c.id === caseId);
    if (!registrationCase) throw new NotFoundError("Birth registration case");
    if (!registrationCase.duplicateCheck) throw new Error("No duplicate check has been run for this case.");
    registrationCase.duplicateCheck.resolution = {
      ...resolution,
      resolvedBy: actorName,
      resolvedAt: new Date().toISOString(),
    };
    registrationCase.updatedAt = new Date().toISOString();
    registrationCase.version += 1;
    logCrvsAudit(db, actorName, "resolved duplicate", "crvs.duplicate_check", registrationCase.reference, `${resolution.type}: ${resolution.reason}`);
    return db;
  });
