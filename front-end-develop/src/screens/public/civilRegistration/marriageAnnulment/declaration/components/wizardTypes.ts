import { AnnulmentRegistration } from "@/domain/crvs/types";

export type AnnulmentWizardStepKey =
  | "source"
  | "applicant"
  | "existingMarriage"
  | "firstAffectedPerson"
  | "secondAffectedPerson"
  | "decision"
  | "evidence"
  | "checks"
  | "office"
  | "review";

/** One accessible validation problem. `fieldId` is the DOM id the error
 * summary links to, so keyboard and screen-reader users land directly on the
 * control that needs fixing (spec §8 accessibility). */
export type AnnulmentFieldError = {
  fieldId: string;
  message: string;
};

export type AnnulmentWizardStepProps = {
  draft: AnnulmentRegistration;
  /** Buffers a change into the wizard's pending patch — flushed to
   * demoUpdateAnnulmentRegistrationDraft on the next step change. */
  onChange: (patch: Partial<AnnulmentRegistration>) => void;
  /** Accepts an already-persisted registration returned by a demo service
   * (evidence attach, marriage select, identity search, …) and resyncs the
   * wizard's local `version` so optimistic concurrency keeps working. */
  onCaseSynced: (updated: AnnulmentRegistration) => void;
  /** Flushes buffered edits BEFORE a service call that bumps the record's
   * version, so the pending patch is never lost to a ConcurrencyError. */
  onPersist: () => void;
  actorName: string;
  errors: AnnulmentFieldError[];
  readOnly?: boolean;
};
