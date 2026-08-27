// Physical check-in + civil-ceremony workspace service (spec §6/§7 "Physical
// appearance and witness check-in" / "Civil ceremony and consent"). Each
// ceremony attempt is its own immutable-once-resolved record in the
// top-level db.crvsMarriageCeremonies collection — a postponed/no-show
// attempt is never re-mutated into a later successful one; a fresh
// MarriageCeremony record is created for the next attempt instead.
import { updateDemoData, getDemoData } from "../storage/demoStore";
import { MarriageCeremony, MarriageWitnessCheckIn, PropertyRegime } from "@/domain/crvs/types";
import { assertTransitionMarriageCeremony, assertTransitionMarriageApplication, assertTransitionMarriageAppointment } from "@/domain/crvs/statusMachines";
import { witnessRequirementForSpouse } from "@/domain/crvs/marriagePolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { nextId } from "../seed/fixtures";

export const demoListMarriageCeremonies = (params: { dateFrom?: string; dateTo?: string; officiantId?: string }) => {
  const db = getDemoData();
  let results = db.crvsMarriageCeremonies;
  if (params.officiantId) results = results.filter((c) => c.officiantId === params.officiantId);
  if (params.dateFrom || params.dateTo) {
    const appointmentsById = new Map(db.crvsMarriageAppointments.map((a) => [a.id, a]));
    results = results.filter((c) => {
      const appt = appointmentsById.get(c.appointmentId);
      if (!appt) return false;
      if (params.dateFrom && appt.date < params.dateFrom) return false;
      if (params.dateTo && appt.date > params.dateTo) return false;
      return true;
    });
  }
  return results;
};

export const demoGetMarriageCeremony = (id: string): MarriageCeremony | undefined =>
  getDemoData().crvsMarriageCeremonies.find((c) => c.id === id);

/** Opens the check-in/ceremony workspace for an approved, scheduled
 * appointment — creates a new ceremony attempt record if one doesn't
 * already exist for this appointment. Idempotent per appointment. */
export const demoStartMarriageCheckIn = (applicationId: string, appointmentId: string, actorName: string): MarriageCeremony => {
  let result: MarriageCeremony | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const existing = db.crvsMarriageCeremonies.find((c) => c.appointmentId === appointmentId && c.outcome === "NOT_STARTED");
    if (existing) {
      result = existing;
      return db;
    }
    const appointment = db.crvsMarriageAppointments.find((a) => a.id === appointmentId);
    const attemptNumber = db.crvsMarriageCeremonies.filter((c) => c.applicationId === applicationId).length + 1;
    const ceremony: MarriageCeremony = {
      id: nextId("MCER"),
      applicationId,
      appointmentId,
      attemptNumber,
      officiantId: appointment?.officiantId,
      officiantName: appointment?.officiantName,
      startedAt: new Date().toISOString(),
      applicant1CheckedIn: false,
      applicant2CheckedIn: false,
      witnessCheckIns: app.witnesses.filter((w) => !w.replaced).map<MarriageWitnessCheckIn>((w) => ({ witnessId: w.id, checkedIn: false })),
      requiredDocumentsConfirmed: false,
      consent: { applicant1Consented: false, applicant2Consented: false },
      outcome: "NOT_STARTED",
    };
    db.crvsMarriageCeremonies.unshift(ceremony);
    logCrvsAudit(db, actorName, "started check-in", "crvs.marriage_checkin", app.reference, `Ceremony attempt ${attemptNumber} opened.`);
    result = ceremony;
    return db;
  });
  return result!;
};

const maybePromoteToReadyForCeremony = (
  db: ReturnType<typeof getDemoData>,
  ceremony: MarriageCeremony,
  actorName: string
): void => {
  const app = db.crvsMarriageApplications.find((a) => a.id === ceremony.applicationId);
  if (!app || app.status !== "APPOINTMENT_SCHEDULED") return;
  const rule = witnessRequirementForSpouse();
  const witnesses1 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced).map((w) => w.id);
  const witnesses2 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced).map((w) => w.id);
  const checkedInIds = new Set(ceremony.witnessCheckIns.filter((w) => w.checkedIn).map((w) => w.witnessId));
  const witnesses1Ready = witnesses1.filter((id) => checkedInIds.has(id)).length >= rule.minimum;
  const witnesses2Ready = witnesses2.filter((id) => checkedInIds.has(id)).length >= rule.minimum;

  if (ceremony.applicant1CheckedIn && ceremony.applicant2CheckedIn && witnesses1Ready && witnesses2Ready) {
    assertTransitionMarriageApplication(app.status, "READY_FOR_CEREMONY");
    const now = new Date().toISOString();
    app.status = "READY_FOR_CEREMONY";
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: "READY_FOR_CEREMONY", at: now, by: actorName });
    logCrvsAudit(db, actorName, "ready for ceremony", "crvs.marriage_checkin", app.reference, "Both applicants and required witnesses checked in.");
  }
};

export const demoCheckInMarriageApplicant = (ceremonyId: string, spouseRole: "APPLICANT1" | "APPLICANT2", actorName: string): MarriageCeremony => {
  let result: MarriageCeremony | undefined;
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    const now = new Date().toISOString();
    if (spouseRole === "APPLICANT1") {
      ceremony.applicant1CheckedIn = true;
      ceremony.applicant1CheckedInAt = now;
    } else {
      ceremony.applicant2CheckedIn = true;
      ceremony.applicant2CheckedInAt = now;
    }
    logCrvsAudit(db, actorName, "checked in applicant", "crvs.marriage_checkin", ceremony.applicationId, `${spouseRole} checked in.`);
    maybePromoteToReadyForCeremony(db, ceremony, actorName);
    result = ceremony;
    return db;
  });
  return result!;
};

export const demoCheckInMarriageWitness = (ceremonyId: string, witnessId: string, actorName: string): MarriageCeremony => {
  let result: MarriageCeremony | undefined;
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    const entry = ceremony.witnessCheckIns.find((w) => w.witnessId === witnessId);
    if (!entry) throw new NotFoundError("Witness check-in record");
    entry.checkedIn = true;
    entry.checkedInAt = new Date().toISOString();
    entry.checkedInBy = actorName;
    logCrvsAudit(db, actorName, "checked in witness", "crvs.marriage_checkin", ceremony.applicationId, `Witness ${witnessId} checked in.`);
    maybePromoteToReadyForCeremony(db, ceremony, actorName);
    result = ceremony;
    return db;
  });
  return result!;
};

export const demoConfirmMarriageCeremonyDocuments = (ceremonyId: string, actorName: string): MarriageCeremony =>
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    ceremony.requiredDocumentsConfirmed = true;
    logCrvsAudit(db, actorName, "confirmed required documents", "crvs.marriage_ceremony", ceremony.applicationId, "Required documents confirmed present at ceremony.");
    return db;
  }).crvsMarriageCeremonies.find((c) => c.id === ceremonyId)!;

export const demoRecordMarriageCeremonyRechecks = (
  ceremonyId: string,
  input: { eligibilityRecheckPassed: boolean; existingMarriageRecheckPassed: boolean },
  actorName: string
): MarriageCeremony =>
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    ceremony.eligibilityRecheckPassed = input.eligibilityRecheckPassed;
    ceremony.existingMarriageRecheckPassed = input.existingMarriageRecheckPassed;
    logCrvsAudit(db, actorName, "recorded eligibility recheck", "crvs.marriage_ceremony", ceremony.applicationId, `Eligibility: ${input.eligibilityRecheckPassed}; existing-marriage: ${input.existingMarriageRecheckPassed}.`);
    return db;
  }).crvsMarriageCeremonies.find((c) => c.id === ceremonyId)!;

export const demoConfirmMarriagePropertyRegime = (ceremonyId: string, regime: PropertyRegime, actorName: string): MarriageCeremony =>
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    ceremony.propertyRegime = regime;
    const app = db.crvsMarriageApplications.find((a) => a.id === ceremony.applicationId);
    if (app) app.propertyRegime = regime;
    logCrvsAudit(db, actorName, "confirmed marriage regime", "crvs.marriage_ceremony", ceremony.applicationId, regime);
    return db;
  }).crvsMarriageCeremonies.find((c) => c.id === ceremonyId)!;

/**
 * Records both spouses' consent. If either declines, this immediately
 * records CONSENT_DECLINED on the ceremony and REJECTED on the application
 * (spec §7: "if either applicant declines consent, the interface must block
 * registration and record CONSENT_DECLINED") — no separate "record outcome"
 * step is needed for this branch since consent decline is itself terminal.
 */
export const demoRecordMarriageConsent = (
  ceremonyId: string,
  input: { applicant1Consented: boolean; applicant2Consented: boolean; declinedBy?: "APPLICANT1" | "APPLICANT2"; declineReason?: string },
  actorName: string
): MarriageCeremony => {
  let result: MarriageCeremony | undefined;
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    const now = new Date().toISOString();
    ceremony.consent = {
      applicant1Consented: input.applicant1Consented,
      applicant1ConsentedAt: input.applicant1Consented ? now : undefined,
      applicant2Consented: input.applicant2Consented,
      applicant2ConsentedAt: input.applicant2Consented ? now : undefined,
      declinedBy: input.declinedBy,
      declineReason: input.declineReason,
      declinedAt: input.declinedBy ? now : undefined,
    };

    if (!input.applicant1Consented || !input.applicant2Consented) {
      assertTransitionMarriageCeremony(ceremony.outcome, "CONSENT_DECLINED");
      ceremony.outcome = "CONSENT_DECLINED";
      ceremony.completedAt = now;

      const app = db.crvsMarriageApplications.find((a) => a.id === ceremony.applicationId);
      if (app) {
        assertTransitionMarriageApplication(app.status, "REJECTED");
        app.status = "REJECTED";
        app.rejectedAt = now;
        app.rejectionReason = {
          reason: "Consent declined at the ceremony.",
          explanation: input.declineReason || "One spouse did not confirm voluntary consent at the ceremony.",
          evidenceRefs: [],
          applicantsNotified: true,
          ceremonyConsentDeclined: true,
        };
        app.statusHistory.push({ status: "REJECTED", at: now, by: actorName, note: "Consent declined at ceremony." });
        app.updatedAt = now;
        app.version += 1;
      }
      logCrvsAudit(db, actorName, "consent declined", "crvs.marriage_ceremony", ceremony.applicationId, input.declineReason || "Consent declined at ceremony.");
    } else {
      logCrvsAudit(db, actorName, "recorded consent", "crvs.marriage_ceremony", ceremony.applicationId, "Both applicants confirmed voluntary consent.");
    }
    result = ceremony;
    return db;
  });
  return result!;
};

export type MarriageCeremonyOutcomeInput = "COMPLETED" | "POSTPONED" | "NO_SHOW" | "CANCELLED";

const APPLICATION_STATUS_FOR_OUTCOME: Record<MarriageCeremonyOutcomeInput, "CEREMONY_COMPLETED" | "POSTPONED" | "NO_SHOW" | "CANCELLED"> = {
  COMPLETED: "CEREMONY_COMPLETED",
  POSTPONED: "POSTPONED",
  NO_SHOW: "NO_SHOW",
  CANCELLED: "CANCELLED",
};

/**
 * Records the ceremony outcome. COMPLETED requires both applicants checked
 * in, required witnesses checked in, documents confirmed, both rechecks
 * passed, and both consents given — the frontend must never allow COMPLETED
 * to be selected otherwise, but the service re-validates regardless (spec
 * §7 "both applicants must be physically recorded as present ... required
 * witnesses checked in").
 */
export const demoRecordMarriageCeremonyOutcome = (
  ceremonyId: string,
  outcome: MarriageCeremonyOutcomeInput,
  detail: { postponedReason?: string; noShowNote?: string; cancellationReason?: string },
  actorName: string
): MarriageCeremony => {
  let result: MarriageCeremony | undefined;
  updateDemoData((db) => {
    const ceremony = db.crvsMarriageCeremonies.find((c) => c.id === ceremonyId);
    if (!ceremony) throw new NotFoundError("Marriage ceremony");
    const app = db.crvsMarriageApplications.find((a) => a.id === ceremony.applicationId);
    if (!app) throw new NotFoundError("Marriage application");

    if (outcome === "COMPLETED") {
      const rule = witnessRequirementForSpouse();
      const witnesses1 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT1" && !w.replaced).map((w) => w.id);
      const witnesses2 = app.witnesses.filter((w) => w.spouseRole === "APPLICANT2" && !w.replaced).map((w) => w.id);
      const checkedInIds = new Set(ceremony.witnessCheckIns.filter((w) => w.checkedIn).map((w) => w.witnessId));
      const witnessesReady =
        witnesses1.filter((id) => checkedInIds.has(id)).length >= rule.minimum &&
        witnesses2.filter((id) => checkedInIds.has(id)).length >= rule.minimum;
      if (
        !ceremony.applicant1CheckedIn ||
        !ceremony.applicant2CheckedIn ||
        !witnessesReady ||
        !ceremony.requiredDocumentsConfirmed ||
        !ceremony.eligibilityRecheckPassed ||
        !ceremony.existingMarriageRecheckPassed ||
        !ceremony.consent.applicant1Consented ||
        !ceremony.consent.applicant2Consented
      ) {
        throw new Error("The ceremony cannot be completed until both applicants and required witnesses are checked in, documents and rechecks are confirmed, and both applicants have consented.");
      }
    }

    assertTransitionMarriageCeremony(ceremony.outcome, outcome);
    const now = new Date().toISOString();
    ceremony.outcome = outcome;
    ceremony.completedAt = now;
    if (outcome === "POSTPONED") ceremony.postponedReason = detail.postponedReason;
    if (outcome === "NO_SHOW") ceremony.noShowNote = detail.noShowNote;
    if (outcome === "CANCELLED") ceremony.cancellationReason = detail.cancellationReason;

    const nextAppStatus = APPLICATION_STATUS_FOR_OUTCOME[outcome];
    assertTransitionMarriageApplication(app.status, nextAppStatus);
    app.status = nextAppStatus;
    app.updatedAt = now;
    app.version += 1;
    app.statusHistory.push({ status: nextAppStatus, at: now, by: actorName, note: detail.postponedReason || detail.noShowNote || detail.cancellationReason });

    if (outcome !== "COMPLETED") {
      const appointment = db.crvsMarriageAppointments.find((a) => a.id === ceremony.appointmentId);
      if (appointment) {
        assertTransitionMarriageAppointment(appointment.status, outcome === "NO_SHOW" ? "NO_SHOW" : "COMPLETED");
        appointment.status = outcome === "NO_SHOW" ? "NO_SHOW" : "COMPLETED";
      }
    } else {
      const appointment = db.crvsMarriageAppointments.find((a) => a.id === ceremony.appointmentId);
      if (appointment) {
        assertTransitionMarriageAppointment(appointment.status, "COMPLETED");
        appointment.status = "COMPLETED";
      }
    }

    logCrvsAudit(db, actorName, "recorded ceremony outcome", "crvs.marriage_ceremony", app.reference, `${outcome}${detail.postponedReason || detail.noShowNote || detail.cancellationReason ? `: ${detail.postponedReason || detail.noShowNote || detail.cancellationReason}` : ""}`);
    result = ceremony;
    return db;
  });
  return result!;
};
