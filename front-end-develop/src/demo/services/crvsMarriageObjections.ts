// Objection-handling service — only ever exposed in the UI when
// marriagePolicyConfig.objection.enabled is true (spec §5 "only expose
// objection functionality when enabled by policy"). An open objection
// blocks approval via canApproveMarriageCase(), mirrored here rather than
// as a top-level application-status branch — see statusMachines.ts's
// modeling notes.
import { updateDemoData } from "../storage/demoStore";
import { MarriageApplication } from "@/domain/crvs/types";
import { assertTransitionMarriageObjection } from "@/domain/crvs/statusMachines";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

export type OpenMarriageObjectionInput = {
  raisedBy: string;
  raisedByRelationship?: string;
  reason: string;
  evidenceRefs?: string[];
};

export const demoOpenMarriageObjection = (applicationId: string, input: OpenMarriageObjectionInput, actorName: string): MarriageApplication => {
  if (!marriagePolicyConfig.objection.enabled) {
    throw new Error("Objections are not enabled by current policy configuration.");
  }
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    assertTransitionMarriageObjection("NONE", "PENDING");
    app.objection = {
      id: nextId("MOBJ"),
      raisedBy: input.raisedBy,
      raisedByRelationship: input.raisedByRelationship,
      raisedAt: now,
      reason: input.reason,
      evidenceRefs: input.evidenceRefs,
      status: "PENDING",
    };
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "opened objection", "crvs.marriage_objection", app.reference, input.reason);
    result = app;
    return db;
  });
  return result!;
};

export type ResolveMarriageObjectionInput = { decision: "UPHOLD" | "DISMISS"; reason: string; note?: string };

export const demoResolveMarriageObjection = (applicationId: string, input: ResolveMarriageObjectionInput, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    if (!app.objection) throw new Error("No objection has been raised on this application.");
    const now = new Date().toISOString();
    const nextStatus = input.decision === "UPHOLD" ? "UPHELD" : "DISMISSED";
    assertTransitionMarriageObjection(app.objection.status, nextStatus);
    app.objection.status = nextStatus;
    app.objection.resolution = { type: input.decision, reason: input.reason, note: input.note, resolvedBy: actorName, resolvedAt: now };
    app.updatedAt = now;
    app.version += 1;

    if (input.decision === "UPHOLD") {
      app.rejectionReason = { reason: "Objection upheld.", explanation: input.reason, evidenceRefs: app.objection.evidenceRefs || [], applicantsNotified: true };
    }

    logCrvsAudit(db, actorName, `objection ${nextStatus.toLowerCase()}`, "crvs.marriage_objection", app.reference, input.reason);
    result = app;
    return db;
  });
  return result!;
};

export const demoWithdrawMarriageObjection = (applicationId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    if (!app.objection) throw new Error("No objection has been raised on this application.");
    const now = new Date().toISOString();
    assertTransitionMarriageObjection(app.objection.status, "WITHDRAWN");
    app.objection.status = "WITHDRAWN";
    app.objection.withdrawnAt = now;
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "objection withdrawn", "crvs.marriage_objection", app.reference, "Objection withdrawn.");
    result = app;
    return db;
  });
  return result!;
};
