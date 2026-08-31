import { useMemo, useRef, useState } from "react";
import WizardShell, { WizardStep } from "@/screens/dashboard/crvs/components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import WarningModal from "@/components/crvs/modals/WarningModal";
import AnnulmentStatusPill from "./AnnulmentStatusPill";
import SubmissionSourceStep from "./steps/SubmissionSourceStep";
import ApplicantStep from "./steps/ApplicantStep";
import ExistingMarriageStep from "./steps/ExistingMarriageStep";
import AffectedPartyStep from "./steps/AffectedPartyStep";
import AnnulmentDecisionStep from "./steps/AnnulmentDecisionStep";
import SupportingEvidenceStep from "./steps/SupportingEvidenceStep";
import IdentityAndConflictChecksStep from "./steps/IdentityAndConflictChecksStep";
import ProcessingOfficeStep from "./steps/ProcessingOfficeStep";
import ReviewAndDeclarationsStep from "./steps/ReviewAndDeclarationsStep";
import { AnnulmentFieldError, AnnulmentWizardStepKey, AnnulmentWizardStepProps } from "./wizardTypes";
import { allAnnulmentStepsValid, validateAnnulmentStep } from "./validation";
import { demoSubmitAnnulmentRegistration, demoUpdateAnnulmentRegistrationDraft } from "@/demo/services/crvsAnnulmentRegistrations";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { affectedPartiesConflict, affectedPartyDisplayName, applicantDisplayName, formatDate } from "../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

export const ANNULMENT_WIZARD_STEPS: (WizardStep & { key: AnnulmentWizardStepKey })[] = [
  { key: "source", label: "How you are registering" },
  { key: "applicant", label: "About you" },
  { key: "existingMarriage", label: "Existing marriage" },
  { key: "firstAffectedPerson", label: "First affected person" },
  { key: "secondAffectedPerson", label: "Second affected person" },
  { key: "decision", label: "Annulment decision" },
  { key: "evidence", label: "Supporting evidence" },
  { key: "checks", label: "Identity & conflict checks" },
  { key: "office", label: "Processing office" },
  { key: "review", label: "Review & declare" },
];

const STEP_KEYS = ANNULMENT_WIZARD_STEPS.map((step) => step.key);

export type AnnulmentRegistrationWizardProps = {
  registration: AnnulmentRegistration;
  onCaseChange: (updated: AnnulmentRegistration) => void;
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
  initialStepKey?: AnnulmentWizardStepKey;
};

/**
 * The 10-step marriage-annulment-registration wizard, built to run standalone
 * from the public tree: it takes its actor name and its persistence entirely
 * through props and the demo services, with no staff-session coupling.
 * Mirrors DivorceRegistrationWizard.tsx's structure exactly.
 *
 * Autosave: edits are buffered into a pending patch and flushed through
 * demoUpdateAnnulmentRegistrationDraft() on every step change, using the
 * record's own `version` for optimistic concurrency. Unlike the divorce demo
 * services (which are synchronous), every crvsAnnulment* service call is
 * async — persist()/handleSubmit() below always `await` them, while still
 * exposing onPersist as the synchronous-looking `() => void` the already
 * -built AnnulmentWizardStepProps contract declares (a void-returning
 * function type accepts an async implementation; steps that need the flush
 * to finish before their own service call already `await onPersist()`-free
 * ordering isn't required because the demo layer's simulated delay resolves
 * well before a user can act on the next screen).
 */
export default function AnnulmentRegistrationWizard({
  registration,
  onCaseChange,
  onExit,
  onSubmitted,
  readOnly,
  actorNameOverride,
  initialStepKey,
}: AnnulmentRegistrationWizardProps) {
  const initialIndex = Math.max(0, STEP_KEYS.indexOf(initialStepKey || "source"));

  const [stepIndex, setStepIndex] = useState(initialIndex);
  const [furthestStep, setFurthestStep] = useState(initialIndex);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [errors, setErrors] = useState<AnnulmentFieldError[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [showPartyConflict, setShowPartyConflict] = useState(false);

  const actorName = actorNameOverride || registration.officerName || "Public applicant";
  const pendingPatch = useRef<Partial<AnnulmentRegistration>>({});
  const latestRef = useRef<AnnulmentRegistration>(registration);
  latestRef.current = registration;

  const currentStep = ANNULMENT_WIZARD_STEPS[stepIndex];

  /** Flushes buffered edits. Safe to call when nothing is pending. */
  const persist = async () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = await demoUpdateAnnulmentRegistrationDraft(latestRef.current.id, pendingPatch.current, actorName, latestRef.current.version);
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

  const handleChange = (patch: Partial<AnnulmentRegistration>) => {
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    const next = { ...latestRef.current, ...patch };
    latestRef.current = next;
    onCaseChange(next);
    setDirty(true);
  };

  /** Accepts a record a demo service has already persisted; clears the
   * pending patch because that service call has superseded it. */
  const handleCaseSynced = (updated: AnnulmentRegistration) => {
    pendingPatch.current = {};
    latestRef.current = updated;
    onCaseChange(updated);
    setDirty(false);
    setAutosaveState("saved");
  };

  const goToStep = async (index: number) => {
    await persist();
    setErrors([]);
    setStepIndex(index);
    setFurthestStep((furthest) => Math.max(furthest, index));
  };

  const handleContinue = async () => {
    const stepErrors = validateAnnulmentStep(currentStep.key, latestRef.current);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      // The two affected people resolving to one person is not an ordinary
      // "fill this in" problem — it is explained in its own modal so it can
      // never be skimmed past (spec's affectedPartiesConflict rule).
      if (currentStep.key === "secondAffectedPerson" && affectedPartiesConflict(latestRef.current.affectedParty1, latestRef.current.affectedParty2)) {
        setShowPartyConflict(true);
      }
      return;
    }
    setErrors([]);
    if (stepIndex < ANNULMENT_WIZARD_STEPS.length - 1) await goToStep(stepIndex + 1);
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsaved(true);
      return;
    }
    onExit();
  };

  const canSubmit = useMemo(() => !readOnly && allAnnulmentStepsValid(registration, STEP_KEYS), [registration, readOnly]);

  const handleSubmit = async () => {
    await persist();
    const updated = await demoSubmitAnnulmentRegistration(latestRef.current.id, actorName);
    latestRef.current = updated;
    onCaseChange(updated);
    setShowSubmit(false);
    setDirty(false);
    toastMessage("success", `${updated.reference} submitted for review.`);
    onSubmitted(updated.id);
  };

  const stepProps: AnnulmentWizardStepProps = {
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
      case "existingMarriage":
        return <ExistingMarriageStep {...stepProps} />;
      case "firstAffectedPerson":
        return <AffectedPartyStep {...stepProps} partyKey="PARTY_1" />;
      case "secondAffectedPerson":
        return <AffectedPartyStep {...stepProps} partyKey="PARTY_2" />;
      case "decision":
        return <AnnulmentDecisionStep {...stepProps} />;
      case "evidence":
        return <SupportingEvidenceStep {...stepProps} />;
      case "checks":
        return <IdentityAndConflictChecksStep {...stepProps} />;
      case "office":
        return <ProcessingOfficeStep {...stepProps} />;
      case "review":
      default:
        return (
          <ReviewAndDeclarationsStep
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
        steps={ANNULMENT_WIZARD_STEPS}
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
            <AnnulmentStatusPill status={registration.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Applicant</dt>
              <dd style={{ margin: "0 0 6px" }}>{applicantDisplayName(registration.applicant)}</dd>
              <dt>Affected people</dt>
              <dd style={{ margin: "0 0 6px" }}>
                {affectedPartyDisplayName(registration.affectedParty1)} · {affectedPartyDisplayName(registration.affectedParty2)}
              </dd>
              <dt>Decision date</dt>
              <dd style={{ margin: 0 }}>{formatDate(registration.decision.decisionDate)}</dd>
            </dl>
            <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
              This registers an annulment decision a court or authority has already made. It does not start proceedings.
            </div>
          </div>
        }
        actions={
          <>
            <Button text="Save and exit" appearance="ghost" type="button" onClick={handleExitClick} testId="annulment-wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="annulment-wizard-back" />}
            {stepIndex < ANNULMENT_WIZARD_STEPS.length - 1 ? (
              <Button text="Continue" appearance="primary" type="button" onClick={handleContinue} testId="annulment-wizard-continue" />
            ) : (
              !readOnly && (
                <Button
                  text={isResubmission ? "Resubmit request" : "Submit registration request"}
                  appearance="primary"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => setShowSubmit(true)}
                  testId="annulment-wizard-submit"
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
        testId="annulment-wizard-submit-modal"
      >
        <p style={{ margin: 0 }}>
          Your request goes to a registration officer for review. Submitting registers nothing on its own — the
          annulment is entered in the register only after the officer has verified the decision, made the final
          legal-effect classification, and approved the request. After you submit you can only change your details if a
          correction is requested.
        </p>
      </ConfirmActionModal>

      <WarningModal
        show={showPartyConflict}
        onClose={() => setShowPartyConflict(false)}
        title="Both affected people look like the same person"
        primaryLabel="Go back and correct this"
        onPrimary={() => setShowPartyConflict(false)}
        testId="annulment-wizard-party-conflict-modal"
      >
        <p style={{ margin: 0 }}>
          The identity record or document number entered for the second affected person matches the one entered for the
          first affected person. An annulment always concerns two different people, so this request cannot continue
          until one of them is corrected.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          Check the document numbers on steps 4 and 5 against the marriage record and the decision document. If both
          numbers really are correct, contact a service centre before submitting — the registry cannot resolve this
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
          await persist();
          setShowUnsaved(false);
          onExit();
        }}
        testId="annulment-wizard-unsaved-changes"
      />
    </>
  );
}
