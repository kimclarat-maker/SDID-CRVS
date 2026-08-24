import { useRef, useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import StatusBadge from "../../components/StatusBadge";
import OccurrenceStep from "./steps/OccurrenceStep";
import DeceasedStep from "./steps/DeceasedStep";
import MedicalCertificationStep from "./steps/MedicalCertificationStep";
import DeclarantNextOfKinStep from "./steps/DeclarantNextOfKinStep";
import WitnessesStep from "./steps/WitnessesStep";
import EvidenceStep from "./steps/EvidenceStep";
import IdentityDuplicateStep from "./steps/IdentityDuplicateStep";
import ReviewDeclarationStep from "./steps/ReviewDeclarationStep";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import { demoUpdateDeathRegistrationDraft, demoSubmitDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { witnessRequirementFor } from "@/domain/crvs/crvsPolicyConfig";
import { getCurrentActorName } from "@/utils/workspace";
import { deceasedDisplayName, PATHWAY_LABELS, formatDate } from "../../deathShared";
import toastMessage from "@/utils/common/toastMessage";

const STEPS: WizardStep[] = [
  { key: "occurrence", label: "Occurrence" },
  { key: "deceased", label: "Deceased" },
  { key: "medical", label: "Medical certification" },
  { key: "declarant", label: "Declarant & next of kin" },
  { key: "witnesses", label: "Witnesses" },
  { key: "evidence", label: "Evidence" },
  { key: "identity", label: "Identity & duplicate checks" },
  { key: "review", label: "Review & declaration" },
];

export type DeathRegistrationWizardProps = {
  registrationCase: DeathRegistrationCase;
  onCaseChange: (updated: DeathRegistrationCase) => void;
  onExit: () => void;
  onSubmitted: (id: string) => void;
  readOnly?: boolean;
  // Public reporters have no staff session — getCurrentActorName() would
  // otherwise resolve to "Unknown staff member". The public wizard host
  // passes an explicit "Public reporter" label here; staff hosts omit it.
  actorNameOverride?: string;
};

/** Hosts the 8-step death-registration wizard on WizardShell — the same
 * shell birth's notification/registration wizards use. Also reused, as-is,
 * by the public death-report wizard (see decision #6/#7 in the module
 * plan) since it carries no staff-auth coupling. */
export default function DeathRegistrationWizard({ registrationCase, onCaseChange, onExit, onSubmitted, readOnly, actorNameOverride }: DeathRegistrationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const actorName = actorNameOverride || getCurrentActorName();
  // Field edits land here immediately (handleChange) but only reach the
  // demo store on the next persist() call (step change / save & exit) — the
  // wizard is deliberately not persisting on every keystroke. Tracked
  // separately from `registrationCase` itself so persist() always sends the
  // real accumulated diff rather than an empty object.
  const pendingPatch = useRef<Partial<DeathRegistrationCase>>({});

  const persist = () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = demoUpdateDeathRegistrationDraft(registrationCase.id, pendingPatch.current, actorName, registrationCase.version);
      pendingPatch.current = {};
      onCaseChange(updated);
      setAutosaveState("saved");
      setDirty(false);
    } catch (err) {
      toastMessage("error", err);
      setAutosaveState("idle");
    }
  };

  const handleChange = (patch: Partial<DeathRegistrationCase>) => {
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    onCaseChange({ ...registrationCase, ...patch });
    setDirty(true);
  };

  const goToStep = (index: number) => {
    persist();
    setStepIndex(index);
    setFurthestStep((f) => Math.max(f, index));
  };

  const handleNext = () => {
    persist();
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
    }
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsaved(true);
      return;
    }
    onExit();
  };

  const witnessRequirement = witnessRequirementFor(registrationCase.pathway);
  const witnessesSatisfied = !witnessRequirement.required || registrationCase.witnesses.length >= witnessRequirement.minimum;
  const canSubmit =
    !!registrationCase.occurrence.dateOfDeath &&
    !!registrationCase.occurrence.location &&
    witnessesSatisfied &&
    registrationCase.declarationConfirmed &&
    registrationCase.declarantConfirmed &&
    registrationCase.privacyAcknowledged &&
    registrationCase.duplicateCheck?.overallLevel !== "EXACT";

  const handleSubmit = async () => {
    const updated = demoSubmitDeathRegistration(registrationCase.id, actorName);
    onCaseChange(updated);
    setShowSubmit(false);
    toastMessage("success", `${updated.reference} submitted — now ${updated.status.replace(/_/g, " ").toLowerCase()}.`);
    onSubmitted(updated.id);
  };

  // Bypasses pendingPatch entirely — the case returned here is already
  // durably persisted (see EvidenceStep), so this only needs to resync the
  // wizard's local copy (in particular `version`) with the server's.
  const handleCaseSynced = (updated: DeathRegistrationCase) => onCaseChange(updated);

  const stepProps = { draft: registrationCase, onChange: handleChange, onCaseSynced: handleCaseSynced, readOnly };

  const renderStep = () => {
    switch (STEPS[stepIndex].key) {
      case "occurrence":
        return <OccurrenceStep {...stepProps} />;
      case "deceased":
        return <DeceasedStep {...stepProps} />;
      case "medical":
        return <MedicalCertificationStep {...stepProps} />;
      case "declarant":
        return <DeclarantNextOfKinStep {...stepProps} />;
      case "witnesses":
        return <WitnessesStep {...stepProps} />;
      case "evidence":
        return <EvidenceStep {...stepProps} />;
      case "identity":
        return <IdentityDuplicateStep {...stepProps} />;
      case "review":
      default:
        return <ReviewDeclarationStep {...stepProps} />;
    }
  };

  return (
    <>
      <WizardShell
        steps={STEPS}
        currentStepIndex={stepIndex}
        furthestStepIndex={furthestStep}
        onStepClick={goToStep}
        autosaveState={autosaveState === "idle" ? undefined : autosaveState}
        summary={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <strong>{registrationCase.reference}</strong>
              <div className="crvs-form-hint">{PATHWAY_LABELS[registrationCase.pathway]}</div>
            </div>
            <StatusBadge kind="deathRegistration" status={registrationCase.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Deceased</dt>
              <dd style={{ margin: "0 0 6px" }}>{deceasedDisplayName(registrationCase.deceased)}</dd>
              <dt>Date of death</dt>
              <dd style={{ margin: 0 }}>{formatDate(registrationCase.dateOfDeath || registrationCase.occurrence.dateOfDeath)}</dd>
            </dl>
            {!witnessesSatisfied && <div className="crvs-banner crvs-banner-warning">Witness requirement not yet met.</div>}
          </div>
        }
        actions={
          <>
            <Button text="Save & exit" appearance="ghost" type="button" onClick={handleExitClick} testId="wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="wizard-back" />}
            {stepIndex < STEPS.length - 1 ? (
              <Button text="Next" appearance="primary" type="button" onClick={handleNext} testId="wizard-next" />
            ) : (
              !readOnly && (
                <Button
                  text="Submit registration"
                  appearance="primary"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => setShowSubmit(true)}
                  testId="wizard-submit"
                />
              )
            )}
          </>
        }
      >
        {renderStep()}
      </WizardShell>

      <ConfirmActionModal
        show={showSubmit}
        onClose={() => setShowSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit death registration"
        description={registrationCase.reference}
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        testId="submit-death-registration-modal"
      >
        <p style={{ margin: 0 }}>
          Submitting sends this case for Civil Registrar review
          {registrationCase.isLate || registrationCase.pathway === "MEDICO_LEGAL" || registrationCase.pathway === "UNIDENTIFIED"
            ? " and will route directly to exception review given its pathway/timing."
            : "."}
        </p>
      </ConfirmActionModal>

      <UnsavedChangesModal
        show={showUnsaved}
        onStay={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false);
          onExit();
        }}
        onSaveDraftAndLeave={async () => {
          persist();
          setShowUnsaved(false);
          onExit();
        }}
        testId="wizard-unsaved-changes"
      />
    </>
  );
}
