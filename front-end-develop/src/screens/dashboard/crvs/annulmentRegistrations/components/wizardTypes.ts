import { AnnulmentRegistration } from "@/domain/crvs/types";

export type AnnulmentWizardStepProps = {
  draft: AnnulmentRegistration;
  /** Buffered patch — flushed to demoUpdateAnnulmentRegistrationDraft on step change. */
  onChange: (patch: Partial<AnnulmentRegistration>) => void;
  /** For service calls that already persisted (evidence, identity search,
   * marriage selection): resyncs the wizard's local `version` without
   * re-writing the record. */
  onCaseSynced: (updated: AnnulmentRegistration) => void;
  readOnly?: boolean;
};
