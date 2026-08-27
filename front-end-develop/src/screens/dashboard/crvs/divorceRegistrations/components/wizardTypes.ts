import { DivorceRegistration } from "@/domain/crvs/types";

export type DivorceWizardStepProps = {
  draft: DivorceRegistration;
  /** Buffered patch — flushed to demoUpdateDivorceRegistrationDraft on step change. */
  onChange: (patch: Partial<DivorceRegistration>) => void;
  /** For service calls that already persisted (evidence, identity search,
   * marriage selection): resyncs the wizard's local `version` without
   * re-writing the record. */
  onCaseSynced: (updated: DivorceRegistration) => void;
  readOnly?: boolean;
};
