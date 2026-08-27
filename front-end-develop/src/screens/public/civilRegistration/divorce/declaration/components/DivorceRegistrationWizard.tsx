import { useMemo, useRef, useState } from "react";
import WizardShell, { WizardStep } from "@/screens/dashboard/crvs/components/WizardShell";
import Button from "@/components/button";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import WarningModal from "@/components/crvs/modals/WarningModal";
import SubmissionSourceStep from "./steps/SubmissionSourceStep";
import ApplicantStep from "./steps/ApplicantStep";
import ExistingMarriageStep from "./steps/ExistingMarriageStep";
import FormerSpouseStep from "./steps/FormerSpouseStep";
import CourtDecisionStep from "./steps/CourtDecisionStep";
import SupportingDocumentsStep from "./steps/SupportingDocumentsStep";
import IdentityChecksStep from "./steps/IdentityChecksStep";
import ProcessingOfficeStep from "./steps/ProcessingOfficeStep";
import ReviewDeclarationStep from "./steps/ReviewDeclarationStep";
import { DivorceFieldError, DivorceWizardStepKey, DivorceWizardStepProps } from "./wizardTypes";
import { allDivorceStepsValid, validateDivorceStep } from "./validation";
import { demoSubmitDivorceRegistration, demoUpdateDivorceRegistrationDraft } from "@/demo/services/crvsDivorceRegistrations";
import { DivorceRegistration } from "@/domain/crvs/types";
import { applicantDisplayName, formatDate, formerSpouseDisplayName, formerSpousesConflict } from "../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

export const DIVORCE_WIZARD_STEPS: (WizardStep & { key: DivorceWizardStepKey })[] = [
  { key: "source", label: "How you are registering" },
  { key: "applicant", label: "About you" },
  { key: "marriage", label: "Existing marriage" },
  { key: "spouse1", label: "Former spouse 1" },
  { key: "spouse2", label: "Former spouse 2" },
  { key: "judgment", label: "Court decision" },
  { key: "documents", label: "Supporting documents" },
  { key: "checks", label: "Identity checks" },
  { key: "office", label: "Processing office" },
  { key: "review", label: "Review & declare" },
];

const STEP_KEYS = DIVORCE_WIZARD_STEPS.map((step) => step.key);

export type DivorceRegistrationWizardProps = {
  registration: DivorceRegistration;
  onCaseChange: (updated: DivorceRegistration) => void;
  onExit: () => void;
  onSubmitted: (id: string) => void;
  /** Renders every step read-only — used when a host wants to show a
   * submitted request without allowing edits. */
  readOnly?: boolean;
  /** Public applicants have no staff session, so the host supplies the actor
   * label recorded against every change. Staff hosts can omit it and pass
   * their own signed-in name instead. */
  actorNameOverride?: string;
  /** Lets the /review route open directly on the final step. */
  initialStepKey?: DivorceWizardStepKey;
};

/**
 * The 10-step divorce-registration wizard, built to run standalone from the
 * public tree: it takes its actor name and its persistence entirely through
 * props and the demo services, with no staff-session coupling.
 *
 * Autosave: edits are buffered into a pending patch and flushed through
 * demoUpdateDivorceRegistrationDraft() on every step change, using the
 * record's own `version` for optimistic concurrency. Steps that call a
 * service which itself bumps the version (identity search, marriage
 * selection, evidence upload) flush first through onPersist and then hand
 * back the persisted record through onCaseSynced.
 */
export default function DivorceRegistrationWizard({
  registration,
  onCaseChange,
  onExit,
  onSubmitted,
  readOnly,
  actorNameOverride,
  initialStepKey,
}: DivorceRegistrationWizardProps) {
  const initialIndex = Math.max(0, STEP_KEYS.indexOf(initialStepKey || "source"));

  const [stepIndex, setStepIndex] = useState(initialIndex);
  const [furthestStep, setFurthestStep] = useState(initialIndex);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [errors, setErrors] = useState<DivorceFieldError[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [showSpouseConflict, setShowSpouseConflict] = useState(false);

  const actorName = actorNameOverride || registration.officerName || "Public applicant";
  const pendingPatch = useRef<Partial<DivorceRegistration>>({});
  const latestRef = useRef<DivorceRegistration>(registration);
  latestRef.current = registration;

  const currentStep = DIVORCE_WIZARD_STEPS[stepIndex];

  /** Flushes buffered edits. Safe to call when nothing is pending. */
  const persist = () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = demoUpdateDivorceRegistrationDraft(latestRef.current.id, pendingPatch.current, actorName, latestRef.current.version);
      pendingPatch.current = {};
      latestRef.current = updated;
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
    const next = { ...latestRef.current, ...patch };
    latestRef.current = next;
    onCaseChange(next);
    setDirty(true);
  };

  /** Accepts a record a demo service has already persisted; clears the
   * pending patch because that service call has superseded it. */
  const handleCaseSynced = (updated: DivorceRegistration) => {
    pendingPatch.current = {};
    latestRef.current = updated;
    onCaseChange(updated);
    setDirty(false);
    setAutosaveState("saved");
  };

  const goToStep = (index: number) => {
    persist();
    setErrors([]);
    setStepIndex(index);
    setFurthestStep((furthest) => Math.max(furthest, index));
  };

  const handleContinue = () => {
    const stepErrors = validateDivorceStep(currentStep.key, latestRef.current);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      // The two former spouses resolving to one person is not an ordinary
      // "fill this in" problem — it is explained in its own modal so it can
      // never be skimmed past (spec §3 Step 5).
      if (currentStep.key === "spouse2" && formerSpousesConflict(latestRef.current.formerSpouse1, latestRef.current.formerSpouse2)) {
        setShowSpouseConflict(true);
      }
      return;
    }
    setErrors([]);
    if (stepIndex < DIVORCE_WIZARD_STEPS.length - 1) goToStep(stepIndex + 1);
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsaved(true);
      return;
    }
    onExit();
  };

  const canSubmit = useMemo(() => !readOnly && allDivorceStepsValid(registration, STEP_KEYS), [registration, readOnly]);

  const handleSubmit = async () => {
    persist();
    const updated = demoSubmitDivorceRegistration(latestRef.current.id, actorName);
    latestRef.current = updated;
    onCaseChange(updated);
    setShowSubmit(false);
    setDirty(false);
    toastMessage("success", `${updated.reference} submitted for review.`);
    onSubmitted(updated.id);
  };

  const stepProps: DivorceWizardStepProps = {
    draft: registration,
    onChange: handleChange,
    onCaseSynced: handleCaseSynced,
    onPersist: persist,
    actorName,
    errors,
    readOnly,
  };

  const renderStep = () => {
    switch (currentStep.key) {
      case "source":
        return <SubmissionSourceStep {...stepProps} />;
      case "applicant":
        return <ApplicantStep {...stepProps} />;
      case "marriage":
        return <ExistingMarriageStep {...stepProps} />;
      case "spouse1":
        return <FormerSpouseStep {...stepProps} spouseKey="SPOUSE1" />;
      case "spouse2":
        return <FormerSpouseStep {...stepProps} spouseKey="SPOUSE2" />;
      case "judgment":
        return <CourtDecisionStep {...stepProps} />;
      case "documents":
        return <SupportingDocumentsStep {...stepProps} />;
      case "checks":
        return <IdentityChecksStep {...stepProps} />;
      case "office":
        return <ProcessingOfficeStep {...stepProps} />;
      case "review":
      default:
        return (
          <ReviewDeclarationStep
            {...stepProps}
            onEditStep={(key) => {
              const index = STEP_KEYS.indexOf(key);
              if (index >= 0) goToStep(index);
            }}
          />
        );
    }
  };

  const isResubmission = registration.status === "CORRECTION_REQUIRED";

  return (
    <>
      <WizardShell
        steps={DIVORCE_WIZARD_STEPS}
        currentStepIndex={stepIndex}
        furthestStepIndex={furthestStep}
        onStepClick={goToStep}
        autosaveState={autosaveState === "idle" ? undefined : autosaveState}
        summary={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <strong>{registration.reference}</strong>
              <div className="crvs-form-hint">{registration.processingOffice.selectedProcessingOfficeName || "No office chosen yet"}</div>
            </div>
            <StatusBadge kind="divorceRegistration" status={registration.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Applicant</dt>
              <dd style={{ margin: "0 0 6px" }}>{applicantDisplayName(registration.applicant)}</dd>
              <dt>Former spouses</dt>
              <dd style={{ margin: "0 0 6px" }}>
                {formerSpouseDisplayName(registration.formerSpouse1)} · {formerSpouseDisplayName(registration.formerSpouse2)}
              </dd>
              <dt>Judgment date</dt>
              <dd style={{ margin: 0 }}>{formatDate(registration.judgment.judgmentDate)}</dd>
            </dl>
            <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
              This registers a divorce a court has already granted. It does not start court proceedings.
            </div>
          </div>
        }
        actions={
          <>
            <Button text="Save and exit" appearance="ghost" type="button" onClick={handleExitClick} testId="divorce-wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="divorce-wizard-back" />}
            {stepIndex < DIVORCE_WIZARD_STEPS.length - 1 ? (
              <Button text="Continue" appearance="primary" type="button" onClick={handleContinue} testId="divorce-wizard-continue" />
            ) : (
              !readOnly && (
                <Button
                  text={isResubmission ? "Resubmit request" : "Submit registration request"}
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
      </WizardShell>

      <ConfirmActionModal
        show={showSubmit}
        onClose={() => setShowSubmit(false)}
        onConfirm={handleSubmit}
        title={isResubmission ? "Resubmit this registration request" : "Submit this registration request"}
        description={registration.reference}
        confirmLabel={isResubmission ? "Resubmit" : "Submit request"}
        cancelLabel="Keep editing"
        testId="divorce-wizard-submit-modal"
      >
        <p style={{ margin: 0 }}>
          Your request goes to a registration officer for review. Submitting registers nothing on its own — the divorce
          is entered in the register only after the officer has verified the court decision and approved the request.
          After you submit you can only change your details if a correction is requested.
        </p>
      </ConfirmActionModal>

      <WarningModal
        show={showSpouseConflict}
        onClose={() => setShowSpouseConflict(false)}
        title="Both former spouses look like the same person"
        primaryLabel="Go back and correct this"
        onPrimary={() => setShowSpouseConflict(false)}
        testId="divorce-wizard-spouse-conflict-modal"
      >
        <p style={{ margin: 0 }}>
          The identity record or document number entered for former spouse 2 matches the one entered for former spouse 1.
          A divorce always concerns two different people, so this request cannot continue until one of them is corrected.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          Check the document numbers on steps 4 and 5 against the marriage record and the court decision. If both numbers
          really are correct, contact a service centre before submitting — the registry cannot resolve this
          automatically.
        </p>
      </WarningModal>

      <UnsavedChangesModal
        show={showUnsaved}
        onStay={() => setShowUnsaved(false)}
        onDiscard={() => {
          pendingPatch.current = {};
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
