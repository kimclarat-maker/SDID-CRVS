import { useRef, useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import StatusBadge from "../../components/StatusBadge";
import ApplicantStep from "./steps/ApplicantStep";
import ExistingMarriageStep from "./steps/ExistingMarriageStep";
import FormerSpouseStep from "./steps/FormerSpouseStep";
import CourtDecisionStep from "./steps/CourtDecisionStep";
import EvidenceStep from "./steps/EvidenceStep";
import ProcessingOfficeStep from "./steps/ProcessingOfficeStep";
import ReviewDeclarationsStep from "./steps/ReviewDeclarationsStep";
import { DivorceRegistration } from "@/domain/crvs/types";
import { demoSubmitDivorceRegistration, demoUpdateDivorceRegistrationDraft } from "@/demo/services/crvsDivorceRegistrations";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate, formerSpousesLabel, marriageReferenceLabel } from "../../divorceShared";

const STEPS: WizardStep[] = [
  { key: "applicant", label: "Applicant & authority" },
  { key: "marriage", label: "Existing marriage" },
  { key: "spouse1", label: "Former spouse 1" },
  { key: "spouse2", label: "Former spouse 2" },
  { key: "court", label: "Court decision" },
  { key: "evidence", label: "Evidence" },
  { key: "office", label: "Processing office" },
  { key: "review", label: "Review & declarations" },
];

export type DivorceRegistrationWizardProps = {
  registration: DivorceRegistration;
  onCaseChange: (updated: DivorceRegistration) => void;
  onExit: () => void;
  onSubmitted: (id: string) => void;
  readOnly?: boolean;
};

/**
 * Hosts the 8-step staff-assisted divorce-registration wizard on the same
 * WizardShell birth/death/marriage use, with the same buffered-patch +
 * optimistic-`version` persistence model MarriageApplicationWizard uses:
 * edits accumulate in a ref and are flushed on every step change, so a
 * concurrent edit surfaces as a ConcurrencyError rather than silently
 * clobbering someone else's work.
 */
export default function DivorceRegistrationWizard({ registration, onCaseChange, onExit, onSubmitted, readOnly }: DivorceRegistrationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const actorName = getCurrentActorName();
  const pendingPatch = useRef<Partial<DivorceRegistration>>({});

  const persist = () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = demoUpdateDivorceRegistrationDraft(registration.id, pendingPatch.current, actorName, registration.version);
      pendingPatch.current = {};
      onCaseChange(updated);
      setAutosaveState("saved");
      setDirty(false);
    } catch (err) {
      toastMessage("error", err);
      setAutosaveState("idle");
    }
  };

  const handleChange = (patch: Partial<DivorceRegistration>) => {
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    onCaseChange({ ...registration, ...patch });
    setDirty(true);
  };

  /** For service calls that already wrote to the store (evidence, identity
   * search, marriage selection) — resyncs `version` without re-writing. */
  const handleCaseSynced = (updated: DivorceRegistration) => onCaseChange(updated);

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

  const missingJudgmentFields = divorcePolicyConfig.requiredJudgmentFields.filter((field) => !registration.judgment[field]);

  const submitBlockers: string[] = [];
  if (registration.existingMarriage.status !== "MATCHED" && registration.existingMarriage.status !== "NOT_FOUND") {
    submitBlockers.push("Search for the existing marriage and either select it or record that it cannot be found.");
  }
  if (!registration.formerSpouse1.firstName || !registration.formerSpouse1.lastName) submitBlockers.push("Former spouse 1 needs a first and last name.");
  if (!registration.formerSpouse2.firstName || !registration.formerSpouse2.lastName) submitBlockers.push("Former spouse 2 needs a first and last name.");
  if (missingJudgmentFields.length > 0) submitBlockers.push(`Court decision is missing: ${missingJudgmentFields.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.`);
  if (!registration.processingOffice.selectedProcessingOfficeName) submitBlockers.push("Select a processing office.");
  if (
    !registration.accuracyDeclarationConfirmed ||
    !registration.authorityToSubmitConfirmed ||
    !registration.judgmentFinalConfirmed ||
    !registration.privacyAcknowledged ||
    !registration.electronicSubmissionConfirmed
  ) {
    submitBlockers.push("Confirm every declaration on the final step.");
  }

  const canSubmit = submitBlockers.length === 0;

  const handleSubmit = async () => {
    persist();
    const updated = demoSubmitDivorceRegistration(registration.id, actorName);
    onCaseChange(updated);
    setShowSubmit(false);
    toastMessage("success", `${updated.reference} submitted — now ${updated.status.replace(/_/g, " ").toLowerCase()}.`);
    onSubmitted(updated.id);
  };

  const stepProps = { draft: registration, onChange: handleChange, onCaseSynced: handleCaseSynced, readOnly };

  const renderStep = () => {
    switch (STEPS[stepIndex].key) {
      case "applicant":
        return <ApplicantStep {...stepProps} />;
      case "marriage":
        return <ExistingMarriageStep {...stepProps} />;
      case "spouse1":
        return <FormerSpouseStep {...stepProps} spouseKey="SPOUSE1" label="Former spouse 1" />;
      case "spouse2":
        return <FormerSpouseStep {...stepProps} spouseKey="SPOUSE2" label="Former spouse 2" />;
      case "court":
        return <CourtDecisionStep {...stepProps} />;
      case "evidence":
        return <EvidenceStep {...stepProps} />;
      case "office":
        return <ProcessingOfficeStep {...stepProps} />;
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
              <strong>{registration.reference}</strong>
              <div className="crvs-form-hint">{registration.processingOffice.selectedProcessingOfficeName || "No processing office selected"}</div>
            </div>
            <StatusBadge kind="divorceRegistration" status={registration.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Former spouses</dt>
              <dd style={{ margin: "0 0 6px" }}>{formerSpousesLabel(registration)}</dd>
              <dt>Marriage</dt>
              <dd style={{ margin: "0 0 6px" }}>{marriageReferenceLabel(registration)}</dd>
              <dt>Judgment</dt>
              <dd style={{ margin: "0 0 6px" }}>{registration.judgment.judgmentNumber || "Not recorded"}</dd>
              <dt>Final on</dt>
              <dd style={{ margin: 0 }}>{registration.judgment.finalityDate ? formatDate(registration.judgment.finalityDate) : "Not reported"}</dd>
            </dl>
            {registration.judgment.isForeign && <div className="crvs-banner crvs-banner-warning">Foreign decision — recognition requirements apply.</div>}
            {registration.existingMarriage.status === "NOT_FOUND" && <div className="crvs-banner crvs-banner-warning">Marriage record not found — this case is in exception review.</div>}
          </div>
        }
        actions={
          <>
            <Button text="Save & exit" appearance="ghost" type="button" onClick={handleExitClick} testId="divorce-wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="divorce-wizard-back" />}
            {stepIndex < STEPS.length - 1 ? (
              <Button text="Next" appearance="primary" type="button" onClick={handleNext} testId="divorce-wizard-next" />
            ) : (
              !readOnly && (
                <Button
                  text={registration.status === "CORRECTION_REQUIRED" ? "Resubmit registration" : "Submit registration"}
                  appearance="primary"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => setShowSubmit(true)}
                  testId="divorce-wizard-submit"
                />
              )
            )}
          </>
        }
      >
        {renderStep()}
        {stepIndex === STEPS.length - 1 && !readOnly && !canSubmit && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
            <strong>Before this can be submitted:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {submitBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        )}
      </WizardShell>

      <ConfirmActionModal
        show={showSubmit}
        onClose={() => setShowSubmit(false)}
        onConfirm={handleSubmit}
        title={registration.status === "CORRECTION_REQUIRED" ? "Resubmit divorce registration" : "Submit divorce registration"}
        description={registration.reference}
        confirmLabel={registration.status === "CORRECTION_REQUIRED" ? "Resubmit" : "Submit"}
        cancelLabel="Keep editing"
        testId="submit-divorce-registration-modal"
      >
        <p style={{ margin: 0 }}>
          This sends {registration.reference} for Civil Registrar review. It does not register the divorce — registration is a separate final step taken only after approval.
        </p>
        <p className="crvs-form-hint" style={{ marginTop: 8 }}>
          An exact duplicate registration blocks submission; if one exists you will be told and the case will stay a draft.
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
        testId="divorce-wizard-unsaved-changes"
      />
    </>
  );
}
