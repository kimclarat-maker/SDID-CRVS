// Derives the spec's display-only MarriageCivilStatus (spec §8) from
// additive annotation fields on MarriageApplication — never a new
// MarriageApplicationStatus value. Mirrors how the divorce module already
// leaves `status` at "REGISTERED" forever and records the real-world change
// via the `dissolution` annotation instead; annulment does the same via the
// `annulment` annotation. Pure, no side effects, no writes.
import { AnnulmentRegistration, MarriageApplication, MarriageCivilStatus } from "./types";

// Registration statuses in which an annulment case is still "in flight"
// against the marriage — terminal statuses (REJECTED, REGISTERED, CANCELLED)
// are excluded since REGISTERED is handled via the `annulment` annotation
// itself and the other two mean no annulment is actually pending.
const PENDING_ANNULMENT_STATUSES = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "RESUBMITTED",
  "DECISION_VERIFICATION",
  "LEGAL_EFFECT_REVIEW",
  "FOREIGN_DECISION_REVIEW",
  "EXCEPTION_REVIEW",
  "APPROVED",
]);

export type MarriageCivilStatusContext = {
  // Only needed to detect ANNULMENT_PENDING — every other branch reads
  // fields already present on the marriage record itself.
  annulmentRegistrations?: AnnulmentRegistration[];
};

/** JUDICIALLY_SEPARATED / CORRECTION_PENDING read seed-only marker fields —
 * this application does not implement those workflows (see the documented
 * scope boundary in annulmentPolicyConfig.ts); the markers exist solely so
 * the annulment module's conflict detectors have something real to find. */
export function deriveMarriageCivilStatus(marriage: MarriageApplication, ctx: MarriageCivilStatusContext = {}): MarriageCivilStatus {
  const hasAnnulment = !!marriage.annulment;
  const hasDissolution = !!marriage.dissolution;

  // Defensive: both annotations present at once should never happen in
  // practice (registering an annulment against an already-dissolved
  // marriage is blocked by EXISTING_DIVORCE_CONFLICT before it ever reaches
  // REGISTERED) — surfaced as a review flag rather than silently picking one.
  if (hasAnnulment && hasDissolution) return "STATUS_REQUIRES_REVIEW";
  if (hasAnnulment) return "ANNULLED";
  if (hasDissolution) return "DISSOLVED_BY_DIVORCE";

  const hasPendingAnnulment = (ctx.annulmentRegistrations ?? []).some(
    (reg) => reg.existingMarriage.selected?.marriageApplicationId === marriage.id && PENDING_ANNULMENT_STATUSES.has(reg.status)
  );
  if (hasPendingAnnulment) return "ANNULMENT_PENDING";

  if (marriage.judicialSeparation) return "JUDICIALLY_SEPARATED";
  if (marriage.correctionPending) return "CORRECTION_PENDING";

  return "ACTIVE";
}
