import { useRef, useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import StatusBadge from "../../components/StatusBadge";
import ServiceJurisdictionStep from "./steps/ServiceJurisdictionStep";
import ApplicantStep from "./steps/ApplicantStep";
import ProposedMarriageStep from "./steps/ProposedMarriageStep";
import EligibilityStep from "./steps/EligibilityStep";
import EvidenceStep from "./steps/EvidenceStep";
import WitnessesStep from "./steps/WitnessesStep";
import ReviewDeclarationsStep from "./steps/ReviewDeclarationsStep";
import { MarriageApplication } from "@/domain/crvs/types";
import { demoUpdateMarriageApplicationDraft, demoSubmitMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { getCurrentActorName } from "@/utils/workspace";
import { applicantDisplayName, formatDate } from "../../marriageShared";
import toastMessage from "@/utils/common/toastMessage";

const STEPS: WizardStep[] = [
  { key: "service", label: "Service & jurisdiction" },
  { key: "applicant1", label: "Applicant 1" },
  { key: "applicant2", label: "Applicant 2" },
  { key: "proposed", label: "Proposed marriage" },
  { key: "eligibility", label: "Eligibility & civil status" },
  { key: "evidence", label: "Evidence" },
  { key: "witnesses", label: "Witnesses" },
  { key: "review", label: "Review & declarations" },
];

export type MarriageApplicationWizardProps = {
  application: MarriageApplication;
  onCaseChange: (updated: MarriageApplication) => void;
  onExit: () => void;
  onSubmitted: (id: string) => void;
  readOnly?: boolean;
  // Public applicants have no staff session — getCurrentActorName() would
  // otherwise resolve to "Unknown staff member". The public declaration host
  // passes an explicit label here; staff hosts omit it.
  actorNameOverride?: string;
};

/** Hosts the 8-step marriage-declaration wizard on the same WizardShell
 * birth/death use. Reused, as-is, by the public declaration flow (no
 * staff-auth coupling) — mirrors DeathRegistrationWizard's approach. */
export default function MarriageApplicationWizard({ application, onCaseChange, onExit, onSubmitted, readOnly, actorNameOverride }: MarriageApplicationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const actorName = actorNameOverride || getCurrentActorName();
  const pendingPatch = useRef<Partial<MarriageApplication>>({});

  const persist = () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = demoUpdateMarriageApplicationDraft(application.id, pendingPatch.current, actorName, application.version);
      pendingPatch.current = {};
      onCaseChange(updated);
      setAutosaveState("saved");
      setDirty(false);
    } catch (err) {
      toastMessage("error", err);
      setAutosaveState("idle");
    }
  };

  const handleChange = (patch: Partial<MarriageApplication>) => {
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    onCaseChange({ ...application, ...patch });
    setDirty(true);
  };

  const goToStep = (index: number) => {
    persist();
    setStepIndex(index);
    setFurthestStep((f) => Math.max(f, index));
  };

  const handleNext = () => {
    persist();
    if (stepIndex < STEPS.length - 1) goToStep(stepIndex + 1);
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsaved(true);
      return;
    }
    onExit();
  };

  // Bypasses pendingPatch entirely — the case returned here (e.g. from
  // evidence attach/remove or partner-verification requests) is already
  // durably persisted, this only resyncs the wizard's local `version`.
  const handleCaseSynced = (updated: MarriageApplication) => onCaseChange(updated);

  const canSubmit =
    !!application.officeName &&
    !!application.proposedMarriageDate &&
    !!application.applicant1.firstName &&
    !!application.applicant1.lastName &&
    !!application.applicant2.firstName &&
    !!application.applicant2.lastName &&
    application.applicant2.partnerConfirmationStatus === "CONFIRMED" &&
    application.declarationConfirmed &&
    application.consentToVerification &&
    application.privacyAcknowledged &&
    application.duplicateCheck?.overallLevel !== "EXACT";

  const handleSubmit = async () => {
    try {
      const updated = demoSubmitMarriageApplication(application.id, actorName);
      onCaseChange(updated);
      setShowSubmit(false);
      toastMessage("success", `${updated.reference} submitted — now ${updated.status.replace(/_/g, " ").toLowerCase()}.`);
      onSubmitted(updated.id);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const stepProps = { draft: application, onChange: handleChange, onCaseSynced: handleCaseSynced, readOnly };

  const renderStep = () => {
    switch (STEPS[stepIndex].key) {
      case "service":
        return <ServiceJurisdictionStep {...stepProps} />;
      case "applicant1":
        return <ApplicantStep {...stepProps} spouseRole="APPLICANT1" label="Applicant 1" />;
      case "applicant2":
        return <ApplicantStep {...stepProps} spouseRole="APPLICANT2" label="Applicant 2" />;
      case "proposed":
        return <ProposedMarriageStep {...stepProps} />;
      case "eligibility":
        return <EligibilityStep {...stepProps} />;
      case "evidence":
        return <EvidenceStep {...stepProps} />;
      case "witnesses":
        return <WitnessesStep {...stepProps} />;
      case "review":
      default:
        return <ReviewDeclarationsStep {...stepProps} />;
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
              <strong>{application.reference}</strong>
              <div className="crvs-form-hint">{application.officeName || "No office selected"}</div>
            </div>
            <StatusBadge kind="marriageApplication" status={application.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Applicant 1</dt>
              <dd style={{ margin: "0 0 6px" }}>{applicantDisplayName(application.applicant1)}</dd>
              <dt>Applicant 2</dt>
              <dd style={{ margin: "0 0 6px" }}>{applicantDisplayName(application.applicant2)}</dd>
              <dt>Proposed date</dt>
              <dd style={{ margin: 0 }}>{formatDate(application.proposedMarriageDate)}</dd>
            </dl>
            {application.applicant2.partnerConfirmationStatus !== "CONFIRMED" && (
              <div className="crvs-banner crvs-banner-warning">Applicant 2 must confirm participation before this can be submitted.</div>
            )}
          </div>
        }
        actions={
          <>
            <Button text="Save & exit" appearance="ghost" type="button" onClick={handleExitClick} testId="marriage-wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="marriage-wizard-back" />}
            {stepIndex < STEPS.length - 1 ? (
              <Button text="Next" appearance="primary" type="button" onClick={handleNext} testId="marriage-wizard-next" />
            ) : (
              !readOnly && (
                <Button
                  text="Submit declaration"
                  appearance="primary"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => setShowSubmit(true)}
                  testId="marriage-wizard-submit"
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
        title="Submit marriage declaration"
        description={application.reference}
        confirmLabel="Submit"
        cancelLabel="Keep editing"
        testId="submit-marriage-declaration-modal"
      >
        <p style={{ margin: 0 }}>
          Submitting sends this declaration for eligibility review. This does not register the marriage — registration only
          happens after a successful ceremony outcome.
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
        testId="marriage-wizard-unsaved-changes"
      />
    </>
  );
}
