import { DivorceRegistration } from "@/domain/crvs/types";

export type DivorceWizardStepKey =
  | "source"
  | "applicant"
  | "marriage"
  | "spouse1"
  | "spouse2"
  | "judgment"
  | "documents"
  | "checks"
  | "office"
  | "review";

/** One accessible validation problem. `fieldId` is the DOM id the error
 * summary links to, so keyboard and screen-reader users land directly on the
 * control that needs fixing (spec §8 accessibility). */
export type DivorceFieldError = {
  fieldId: string;
  message: string;
};

export type DivorceWizardStepProps = {
  draft: DivorceRegistration;
  /** Buffers a change into the wizard's pending patch — flushed to
   * demoUpdateDivorceRegistrationDraft on the next step change. */
  onChange: (patch: Partial<DivorceRegistration>) => void;
  /** Accepts an already-persisted registration returned by a demo service
   * (evidence attach, marriage select, …) and resyncs the wizard's local
   * `version` so optimistic concurrency keeps working. */
  onCaseSynced: (updated: DivorceRegistration) => void;
  /** Flushes buffered edits BEFORE a service call that bumps the record's
   * version, so the pending patch is never lost to a ConcurrencyError. */
  onPersist: () => void;
  actorName: string;
  errors: DivorceFieldError[];
  readOnly?: boolean;
};
