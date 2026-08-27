import { MarriageApplication } from "@/domain/crvs/types";

export type WizardStepProps = {
  draft: MarriageApplication;
  onChange: (patch: Partial<MarriageApplication>) => void;
  onCaseSynced: (updated: MarriageApplication) => void;
  readOnly?: boolean;
};
