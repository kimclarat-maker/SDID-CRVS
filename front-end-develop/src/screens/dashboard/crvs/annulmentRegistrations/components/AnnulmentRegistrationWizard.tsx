import { useRef, useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import StatusBadge from "../../components/StatusBadge";
import ApplicantStep from "./steps/ApplicantStep";
import ExistingMarriageStep from "./steps/ExistingMarriageStep";
import AffectedPartyStep from "./steps/AffectedPartyStep";
import AnnulmentDecisionStep from "./steps/AnnulmentDecisionStep";
import EvidenceStep from "./steps/EvidenceStep";
import ProcessingOfficeStep from "./steps/ProcessingOfficeStep";
import ReviewDeclarationsStep from "./steps/ReviewDeclarationsStep";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { demoSubmitAnnulmentRegistration, demoUpdateAnnulmentRegistrationDraft } from "@/demo/services/crvsAnnulmentRegistrations";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { affectedPartiesLabel, formatDate, marriageReferenceLabel } from "../../annulmentShared";

const STEPS: WizardStep[] = [
  { key: "applicant", label: "Applicant & authority" },
  { key: "marriage", label: "Existing marriage" },
  { key: "party1", label: "Affected party 1" },
  { key: "party2", label: "Affected party 2" },
  { key: "decision", label: "Annulment decision" },
  { key: "evidence", label: "Evidence" },
  { key: "office", label: "Processing office" },
  { key: "review", label: "Review & declarations" },
];

export type AnnulmentRegistrationWizardProps = {
  registration: AnnulmentRegistration;
  onCaseChange: (updated: AnnulmentRegistration) => void;
  onExit: () => void;
  onSubmitted: (id: string) => void;
  readOnly?: boolean;
};

/**
 * Hosts the 8-step staff-assisted annulment-registration wizard (7 distinct
 * step components — the affected-party step is reused twice via a `partyKey`
 * prop) on the same WizardShell birth/death/marriage/divorce use, with the
 * same buffered-patch + optimistic-`version` persistence model
 * DivorceRegistrationWizard uses: edits accumulate in a ref and are flushed
 * on every step change, so a concurrent edit surfaces as a ConcurrencyError
 * rather than silently clobbering someone else's work. Unlike
 * DivorceRegistrationWizard, the underlying draft/submit service calls here
 * are async, so persist()/handleSubmit() await them.
 */
export default function AnnulmentRegistrationWizard({ registration, onCaseChange, onExit, onSubmitted, readOnly }: AnnulmentRegistrationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const actorName = getCurrentActorName();
  const pendingPatch = useRef<Partial<AnnulmentRegistration>>({});

  const persist = async () => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    setAutosaveState("saving");
    try {
      const updated = await demoUpdateAnnulmentRegistrationDraft(registration.id, pendingPatch.current, actorName, registration.version);
      pendingPatch.current = {};
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
    onCaseChange({ ...registration, ...patch });
    setDirty(true);
  };

  /** For service calls that already wrote to the store (evidence, identity
   * search, marriage selection) — resyncs `version` without re-writing. */
  const handleCaseSynced = (updated: AnnulmentRegistration) => onCaseChange(updated);

  const goToStep = async (index: number) => {
    await persist();
    setStepIndex(index);
    setFurthestStep((f) => Math.max(f, index));
  };

  const handleNext = async () => {
    await persist();
    if (stepIndex < STEPS.length - 1) await goToStep(stepIndex + 1);
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsaved(true);
      return;
    }
    onExit();
  };

  const missingDecisionFields = annulmentPolicyConfig.requiredDecisionFields.filter((field) => !registration.decision[field]);

  const submitBlockers: string[] = [];
  if (registration.existingMarriage.status !== "MATCHED" && registration.existingMarriage.status !== "NOT_FOUND") {
    submitBlockers.push("Search for the existing marriage and either select it or record that it cannot be found.");
  }
  if (!registration.affectedParty1.firstName || !registration.affectedParty1.lastName) submitBlockers.push("Affected party 1 needs a first and last name.");
  if (!registration.affectedParty2.firstName || !registration.affectedParty2.lastName) submitBlockers.push("Affected party 2 needs a first and last name.");
  if (missingDecisionFields.length > 0) submitBlockers.push(`Annulment decision is missing: ${missingDecisionFields.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.`);
  if (!registration.processingOffice.selectedProcessingOfficeName) submitBlockers.push("Select a processing office.");
  if (
    !registration.accuracyDeclarationConfirmed ||
    !registration.authorityToSubmitConfirmed ||
    !registration.authoritativeDecisionExistsConfirmed ||
    !registration.decisionCompleteConfirmed ||
    !registration.privacyAcknowledged ||
    !registration.electronicSubmissionConfirmed
  ) {
    submitBlockers.push("Confirm every declaration on the final step.");
  }

  const canSubmit = submitBlockers.length === 0;

  const handleSubmit = async () => {
    await persist();
    try {
      const updated = await demoSubmitAnnulmentRegistration(registration.id, actorName);
      onCaseChange(updated);
      setShowSubmit(false);
      toastMessage("success", `${updated.reference} submitted — now ${updated.status.replace(/_/g, " ").toLowerCase()}.`);
      onSubmitted(updated.id);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const stepProps = { draft: registration, onChange: handleChange, onCaseSynced: handleCaseSynced, readOnly };

  const renderStep = () => {
    switch (STEPS[stepIndex].key) {
      case "applicant":
        return <ApplicantStep {...stepProps} />;
      case "marriage":
        return <ExistingMarriageStep {...stepProps} />;
      case "party1":
        return <AffectedPartyStep {...stepProps} partyKey="PARTY_1" label="Affected party 1" />;
      case "party2":
        return <AffectedPartyStep {...stepProps} partyKey="PARTY_2" label="Affected party 2" />;
      case "decision":
        return <AnnulmentDecisionStep {...stepProps} />;
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
            <StatusBadge kind="annulmentRegistration" status={registration.status} />
            <dl className="crvs-form-hint" style={{ margin: 0 }}>
              <dt>Affected persons</dt>
              <dd style={{ margin: "0 0 6px" }}>{affectedPartiesLabel(registration)}</dd>
              <dt>Marriage</dt>
              <dd style={{ margin: "0 0 6px" }}>{marriageReferenceLabel(registration)}</dd>
              <dt>Decision</dt>
              <dd style={{ margin: "0 0 6px" }}>{registration.decision.decisionNumber || "Not recorded"}</dd>
              <dt>Final on</dt>
              <dd style={{ margin: 0 }}>{registration.decision.finalityDate ? formatDate(registration.decision.finalityDate) : "Not reported"}</dd>
            </dl>
            {registration.decision.isForeign && <div className="crvs-banner crvs-banner-warning">Foreign decision — recognition requirements apply.</div>}
            {registration.existingMarriage.status === "NOT_FOUND" && <div className="crvs-banner crvs-banner-warning">Marriage record not found — this case is in exception review.</div>}
          </div>
        }
        actions={
          <>
            <Button text="Save & exit" appearance="ghost" type="button" onClick={handleExitClick} testId="annulment-wizard-save-exit" />
            {stepIndex > 0 && <Button text="Back" appearance="ghost" type="button" onClick={() => goToStep(stepIndex - 1)} testId="annulment-wizard-back" />}
            {stepIndex < STEPS.length - 1 ? (
              <Button text="Next" appearance="primary" type="button" onClick={handleNext} testId="annulment-wizard-next" />
            ) : (
              !readOnly && (
                <Button
                  text={registration.status === "CORRECTION_REQUIRED" ? "Resubmit registration" : "Submit registration"}
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
        title={registration.status === "CORRECTION_REQUIRED" ? "Resubmit annulment registration" : "Submit annulment registration"}
        description={registration.reference}
        confirmLabel={registration.status === "CORRECTION_REQUIRED" ? "Resubmit" : "Submit"}
        cancelLabel="Keep editing"
        testId="submit-annulment-registration-modal"
      >
        <p style={{ margin: 0 }}>
          This sends {registration.reference} for Civil Registrar review. It does not register the annulment or determine its legal effect — registration is a separate final step taken only after
          approval and legal-effect classification.
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
          await persist();
          setShowUnsaved(false);
          onExit();
        }}
        testId="annulment-wizard-unsaved-changes"
      />
    </>
  );
}
