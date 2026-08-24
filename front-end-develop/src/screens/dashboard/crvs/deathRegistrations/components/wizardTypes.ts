import { DeathRegistrationCase } from "@/domain/crvs/types";

/** The mutable slice of a DeathRegistrationCase every wizard step edits.
 * Shared between the staff wizard host and the public death-report wizard
 * host so both read/write the exact same shape against the exact same
 * step components (see decision #6/#7 in the module plan). */
export type WizardStepProps = {
  draft: DeathRegistrationCase;
  onChange: (patch: Partial<DeathRegistrationCase>) => void;
  // For steps (Evidence) whose actions persist to the demo store
  // immediately rather than queuing into the wizard's own autosave patch —
  // swaps the wizard's local case for the server's authoritative copy so a
  // later autosave's expectedVersion never goes stale. Optional because
  // most steps only ever queue edits through onChange.
  onCaseSynced?: (updated: DeathRegistrationCase) => void;
  readOnly?: boolean;
};
