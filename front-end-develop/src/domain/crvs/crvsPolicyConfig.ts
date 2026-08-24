// Centralized policy config for the death-notification / death-registration
// workflow: filing deadlines, per-pathway evidence/witness requirements,
// identity-match confidence thresholds, and the jurisdiction rule. Birth's
// equivalent rule (lateRegistration.ts) is a single hardcoded constant with
// no per-pathway variation; death genuinely needs one config object because
// five pathways each carry different evidence/witness/review requirements
// (spec §3 "store rules ... in a centralized crvsPolicyConfig object"). Kept
// deliberately simple and deterministic — this is a demo, not a
// jurisdiction-configurable rules engine — but isolated here so the wizard,
// review checklist, and services all read the same numbers.
import { DeathReportingPathway } from "./types";

export const crvsPolicyConfig = {
  deathReporting: {
    // Deaths reported more than this many days after the date of death are
    // classified late and routed to LATE_REGISTRATION_REVIEW.
    filingDeadlineDays: 30,
    lateThresholdDays: 30,
    // Beyond this many days late, the case additionally requires supervisor
    // escalation rather than a routine registration-officer late-filing note.
    escalationThresholdDays: 90,
  },

  // Minimum evidence categories the wizard requires before a case can be
  // submitted for each pathway (spec §5 step 7 "Evidence").
  evidenceRequirements: {
    HEALTH_FACILITY: ["MEDICAL_CERTIFICATE"],
    COMMUNITY: ["IDENTITY_EVIDENCE", "COMMUNITY_OR_BURIAL_CONFIRMATION"],
    LATE: ["IDENTITY_EVIDENCE", "LATE_FILING_SUPPORTING_EVIDENCE"],
    MEDICO_LEGAL: ["AUTHORITY_OR_POLICE_DOCUMENTATION"],
    UNIDENTIFIED: ["AUTHORITY_OR_POLICE_DOCUMENTATION"],
  } satisfies Record<DeathReportingPathway, string[]>,

  // Witnesses are only required for the pathways where there is no medical
  // certification and no police/authority documentation standing in for
  // first-hand confirmation of the death (spec §5 step 6 "required only when
  // policy/pathway requires them").
  witnessRequirements: {
    HEALTH_FACILITY: { required: false, minimum: 0 },
    COMMUNITY: { required: true, minimum: 2 },
    LATE: { required: true, minimum: 1 },
    MEDICO_LEGAL: { required: false, minimum: 0 },
    UNIDENTIFIED: { required: false, minimum: 0 },
  } satisfies Record<DeathReportingPathway, { required: boolean; minimum: number }>,

  // Confidence-score bands the identity-match step uses to decide whether an
  // SDID candidate can be auto-linked, needs a human to confirm, or falls
  // back to manual review (spec §8 "identity-confidence thresholds").
  identityMatchThresholds: {
    autoLink: 0.92,
    manualReview: 0.55,
  },

  // Jurisdiction is resolved from where the death occurred, not the
  // deceased's residence — consistent with how civil registration offices
  // are organized around facilities/administrative areas of occurrence
  // rather than residence.
  jurisdictionRule: "DEATH_LOCATION" as "DEATH_LOCATION" | "RESIDENCE",
};

export type CrvsPolicyConfig = typeof crvsPolicyConfig;

export function daysAfterDeath(dateOfDeath: string, dateReported: string): number {
  const dod = new Date(dateOfDeath).getTime();
  const reported = new Date(dateReported).getTime();
  if (Number.isNaN(dod) || Number.isNaN(reported)) return 0;
  return Math.max(0, Math.round((reported - dod) / (1000 * 60 * 60 * 24)));
}

export function isLateDeathReporting(dateOfDeath: string, dateReported: string): boolean {
  return daysAfterDeath(dateOfDeath, dateReported) > crvsPolicyConfig.deathReporting.lateThresholdDays;
}

export function requiresSupervisorReviewForDeath(dateOfDeath: string, dateReported: string): boolean {
  return isLateDeathReporting(dateOfDeath, dateReported);
}

export function requiresDeathExceptionEscalation(dateOfDeath: string, dateReported: string): boolean {
  return daysAfterDeath(dateOfDeath, dateReported) > crvsPolicyConfig.deathReporting.escalationThresholdDays;
}

export function witnessRequirementFor(pathway: DeathReportingPathway) {
  return crvsPolicyConfig.witnessRequirements[pathway];
}

export function evidenceRequirementFor(pathway: DeathReportingPathway): string[] {
  return crvsPolicyConfig.evidenceRequirements[pathway];
}
