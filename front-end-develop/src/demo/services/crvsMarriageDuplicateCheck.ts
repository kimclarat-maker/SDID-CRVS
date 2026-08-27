import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import {
  MarriageDuplicateCandidateInput,
  findMarriageDuplicateCandidates,
  overallMarriageMatchLevel,
} from "@/domain/crvs/marriageDuplicateDetection";
import { MarriageApplication, MarriageDuplicateCheckResult, DuplicateResolution } from "@/domain/crvs/types";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";

export const demoRunMarriageDuplicateCheck = async (
  applicationId: string,
  input: MarriageDuplicateCandidateInput,
  actorName: string
): Promise<MarriageDuplicateCheckResult> => {
  await demoDelay(null, 500);

  let result: MarriageDuplicateCheckResult | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");

    const candidates = findMarriageDuplicateCandidates(input, db.crvsMarriageApplications, applicationId);
    const overallLevel = overallMarriageMatchLevel(candidates);
    result = { checkedAt: new Date().toISOString(), checkedBy: actorName, candidates, overallLevel };
    app.duplicateCheck = result;
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(
      db,
      actorName,
      "ran duplicate check",
      "crvs.marriage_duplicate_check",
      app.reference,
      `Result: ${overallLevel} (${candidates.length} candidate${candidates.length === 1 ? "" : "s"}).`
    );
    return db;
  });

  return result!;
};

export const demoResolveMarriageDuplicate = (
  applicationId: string,
  resolution: Omit<DuplicateResolution, "resolvedBy" | "resolvedAt">,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    if (!app.duplicateCheck) throw new Error("No duplicate check has been run for this application.");
    app.duplicateCheck.resolution = { ...resolution, resolvedBy: actorName, resolvedAt: new Date().toISOString() };
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "resolved duplicate", "crvs.marriage_duplicate_check", app.reference, `${resolution.type}: ${resolution.reason}`);
    result = app;
    return db;
  });
  return result!;
};

export const demoGetMarriageApplications = (): MarriageApplication[] => getDemoData().crvsMarriageApplications;
