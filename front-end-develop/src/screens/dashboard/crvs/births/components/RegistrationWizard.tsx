import { useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../components/StatusBadge";
import toastMessage from "@/utils/common/toastMessage";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import {
  BirthNotification,
  BirthRegistrationCase,
  ChildDetails,
  Declarant,
  FatherAvailability,
  FatherDetails,
  IdentityDocumentType,
  MotherDetails,
  Sex,
  VerificationState,
  Witness,
} from "@/domain/crvs/types";
import { demoUpdateRegistrationDraft } from "@/demo/services/crvsRegistrations";
import { demoSubmitRegistration } from "@/demo/services/crvsRegistrations";
import { demoRunDuplicateCheck, demoResolveDuplicate } from "@/demo/services/crvsDuplicateCheck";
import { demoAttachEvidence, demoReplaceEvidence, demoRemoveEvidence, AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { requiredEvidenceFor, missingEvidence } from "@/domain/crvs/evidenceRequirements";
import { daysAfterBirth, isLateRegistration, requiresSupervisorReview, LATE_REGISTRATION_THRESHOLD_DAYS } from "@/domain/crvs/lateRegistration";
import {
  getActorName,
  maskDocumentNumber,
  formatDate,
  formatDateTime,
  DOCUMENT_TYPE_LABELS,
  FATHER_AVAILABILITY_LABELS,
  VERIFICATION_LABELS,
  OCCURRENCE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "../shared";

import SdidIdentitySearchModal, { SdidIdentityMatch } from "./modals/SdidIdentitySearchModal";
import IdentityMismatchModal from "./modals/IdentityMismatchModal";
import AddWitnessModal from "./modals/AddWitnessModal";
import RemoveWitnessModal from "./modals/RemoveWitnessModal";
import UploadEvidenceModal from "./modals/UploadEvidenceModal";
import ReplaceEvidenceModal from "./modals/ReplaceEvidenceModal";
import RemoveEvidenceModal from "./modals/RemoveEvidenceModal";
import NotificationDataChangedModal, { NotificationFieldChange } from "./modals/NotificationDataChangedModal";
import RunDuplicateCheckModal from "./modals/RunDuplicateCheckModal";
import DuplicateResultsModal from "./modals/DuplicateResultsModal";
import SubmitRegistrationModal from "./modals/SubmitRegistrationModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";

const STEPS: WizardStep[] = [
  { key: "source", label: "Source & processing" },
  { key: "child", label: "Child" },
  { key: "parents", label: "Parents" },
  { key: "declarant", label: "Declarant & witnesses" },
  { key: "evidence", label: "Evidence" },
  { key: "identity", label: "Identity & duplicate checks" },
  { key: "review", label: "Review & declaration" },
  { key: "submission", label: "Submission" },
];

const DOC_TYPES: IdentityDocumentType[] = ["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE", "OTHER", "NONE"];
const FATHER_AVAILABILITY_OPTIONS: FatherAvailability[] = ["PROVIDED_VERIFIED", "PROVIDED_UNVERIFIED", "NOT_DECLARED", "UNKNOWN", "LEGALLY_UNAVAILABLE"];
const OCCURRENCE_OPTIONS: BirthRegistrationCase["occurrenceType"][] = ["FACILITY", "HOME", "TRANSIT", "OTHER"];

type SdidTarget = "mother" | "father" | "declarant";

export type RegistrationWizardProps = {
  registrationCase: BirthRegistrationCase;
  onCaseChange: (updated: BirthRegistrationCase) => void;
  onExit: () => void;
  onSubmitted: (caseId: string) => void;
  /** Present only for a FROM_NOTIFICATION registration — used to detect and
   * explain edits away from the original notification's child data. */
  originalNotification?: BirthNotification;
};

/** The shared 8-step birth-registration wizard used for the direct-creation
 * flow, the from-notification flow, and edit-mode on an existing draft.
 * Owns a local working copy of the case (`caseDraft`); every "Next" click
 * persists that step's fields through demoUpdateRegistrationDraft before
 * advancing — nothing here ever mutates BirthRegistrationCase fields
 * directly. */
export default function RegistrationWizard({ registrationCase, onCaseChange, onExit, onSubmitted, originalNotification }: RegistrationWizardProps) {
  const actorName = getActorName();
  const [caseDraft, setCaseDraft] = useState<BirthRegistrationCase>(registrationCase);
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [stepError, setStepError] = useState<string | undefined>();
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saving, setSaving] = useState(false);

  // Step 7 declaration checkboxes — two of the four map onto declarationConfirmed.
  const [accuracyChecked, setAccuracyChecked] = useState(registrationCase.declarationConfirmed);
  const [officerChecked, setOfficerChecked] = useState(registrationCase.declarationConfirmed);
  const [declarantChecked, setDeclarantChecked] = useState(registrationCase.declarantConfirmed);
  const [privacyChecked, setPrivacyChecked] = useState(registrationCase.privacyAcknowledged);

  // SDID identity search
  const [sdidTarget, setSdidTarget] = useState<SdidTarget | undefined>();
  const [pendingMismatch, setPendingMismatch] = useState<
    { target: SdidTarget; match: SdidIdentityMatch; documentType: IdentityDocumentType; documentNumber: string; enteredName: string; matchName: string } | undefined
  >();

  // Witnesses
  const [showAddWitness, setShowAddWitness] = useState(false);
  const [witnessToRemove, setWitnessToRemove] = useState<Witness | undefined>();

  // Evidence
  const [showUploadEvidence, setShowUploadEvidence] = useState(false);
  const [evidenceToReplace, setEvidenceToReplace] = useState<string | undefined>();
  const [evidenceToRemove, setEvidenceToRemove] = useState<string | undefined>();
  const [evidenceToPreview, setEvidenceToPreview] = useState<string | undefined>();
  const [evidenceBusy, setEvidenceBusy] = useState(false);

  // Notification value-change tracking
  const [pendingNotificationChanges, setPendingNotificationChanges] = useState<NotificationFieldChange[]>([]);
  const [showNotificationChanged, setShowNotificationChanged] = useState(false);

  // Duplicate check
  const [showRunDuplicate, setShowRunDuplicate] = useState(false);
  const [showDuplicateResults, setShowDuplicateResults] = useState(false);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | undefined>();

  // Submission
  const [showSubmit, setShowSubmit] = useState(false);

  const canEditDraft = caseDraft.status === "DRAFT" && hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT);
  const canAttachEvidence = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EVIDENCE_ATTACH);
  const canRunDuplicateCheck = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DUPLICATE_CHECK_RUN);
  const canResolveDuplicate = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE);
  const canSubmit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_SUBMIT);
  const canSearchSdid = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.SDID_LOOKUP_VERIFY);

  const furthestStepIndex = Math.max(...Array.from(visited));

  const goToStep = (index: number) => {
    setStepIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  const updateChild = (patch: Partial<ChildDetails>) => setCaseDraft((prev) => ({ ...prev, child: { ...prev.child, ...patch } }));
  const updateMother = (patch: Partial<MotherDetails>) => setCaseDraft((prev) => ({ ...prev, mother: { ...prev.mother, ...patch } }));
  const updateFather = (patch: Partial<FatherDetails>) => setCaseDraft((prev) => ({ ...prev, father: { ...prev.father, ...patch } }));
  const updateDeclarant = (patch: Partial<Declarant>) => setCaseDraft((prev) => ({ ...prev, declarant: { ...prev.declarant, ...patch } }));

  const savePatch = async (patch: Partial<BirthRegistrationCase>) => {
    setAutosaveState("saving");
    const updated = demoUpdateRegistrationDraft(caseDraft.id, patch, actorName, caseDraft.version);
    setCaseDraft(updated);
    onCaseChange(updated);
    setAutosaveState("saved");
    return updated;
  };

  const liveDaysLate = daysAfterBirth(caseDraft.dateOfBirth, caseDraft.dateReported);
  const liveIsLate = isLateRegistration(caseDraft.dateOfBirth, caseDraft.dateReported);
  const liveSupervisorReview = requiresSupervisorReview(caseDraft.dateOfBirth, caseDraft.dateReported);

  // ---------- Step 1: Source & processing ----------
  const handleStep1Next = async () => {
    if (!caseDraft.placeOfBirth.trim() || !caseDraft.dateOfBirth || !caseDraft.dateReported) {
      setStepError("Place of birth, date of birth and date reported are required.");
      return;
    }
    if (new Date(caseDraft.dateOfBirth) > new Date()) {
      setStepError("Date of birth cannot be in the future.");
      return;
    }
    setStepError(undefined);
    if (!canEditDraft) { goToStep(1); return; }
    setSaving(true);
    try {
      await savePatch({
        occurrenceType: caseDraft.occurrenceType,
        facilityId: caseDraft.facilityId,
        facilityName: caseDraft.facilityName,
        placeOfBirth: caseDraft.placeOfBirth,
        processingOfficeId: caseDraft.processingOfficeId,
        processingOfficeName: caseDraft.processingOfficeName,
        jurisdiction: caseDraft.jurisdiction,
        dateOfBirth: caseDraft.dateOfBirth,
        dateReported: caseDraft.dateReported,
        delayReason: caseDraft.delayReason,
        directRegistrationReason: caseDraft.directRegistrationReason,
        registrationCategory: caseDraft.registrationCategory,
      });
      goToStep(1);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Step 2: Child ----------
  const notificationFieldChecks = (): NotificationFieldChange[] => {
    if (!originalNotification) return [];
    const orig = originalNotification.child;
    const cur = caseDraft.child;
    const explained = new Set(caseDraft.notificationValueChanges.map((c) => c.field));
    const changes: NotificationFieldChange[] = [];
    const compare = (field: string, o?: string, n?: string) => {
      if ((o || "") !== (n || "") && !explained.has(field)) changes.push({ field, originalValue: o || "", newValue: n || "" });
    };
    compare("First name", orig.firstName, cur.firstName);
    compare("Middle name", orig.middleName, cur.middleName);
    compare("Last name", orig.lastName, cur.lastName);
    compare("Sex", orig.sex, cur.sex);
    compare("Date of birth", orig.dateOfBirth, cur.dateOfBirth);
    compare("Time of birth", orig.timeOfBirth, cur.timeOfBirth);
    compare("Place of birth", orig.placeOfBirth, cur.placeOfBirth);
    compare("Country", orig.country, cur.country);
    compare("Admin place of birth", orig.adminPlaceOfBirth, cur.adminPlaceOfBirth);
    return changes;
  };

  const commitStep2 = async () => {
    setSaving(true);
    try {
      await savePatch({ child: caseDraft.child, notificationValueChanges: caseDraft.notificationValueChanges });
      goToStep(2);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Next = () => {
    const errors: string[] = [];
    if (!caseDraft.child.lastName.trim()) errors.push("Child last name is required.");
    if (caseDraft.child.dateOfBirth && new Date(caseDraft.child.dateOfBirth) > new Date()) errors.push("Child date of birth cannot be in the future.");
    if (caseDraft.child.multipleBirth.isMultiple) {
      const { birthOrder, totalBirths } = caseDraft.child.multipleBirth;
      if (!birthOrder || birthOrder < 1 || !totalBirths || totalBirths < 2 || birthOrder > totalBirths) {
        errors.push("Enter a valid birth order and total births for a multiple birth.");
      }
    }
    if (errors.length) {
      setStepError(errors.join(" "));
      return;
    }
    setStepError(undefined);
    if (!canEditDraft) { goToStep(2); return; }
    const changes = notificationFieldChecks();
    if (changes.length > 0) {
      setPendingNotificationChanges(changes);
      setShowNotificationChanged(true);
      return;
    }
    void commitStep2();
  };

  const handleNotificationChangeCancel = () => {
    if (originalNotification) updateChild({ ...originalNotification.child });
    setShowNotificationChanged(false);
    setPendingNotificationChanges([]);
  };

  const handleNotificationChangeConfirm = async (reason: string) => {
    const now = new Date().toISOString();
    const records = pendingNotificationChanges.map((c) => ({ ...c, reason, at: now, by: actorName }));
    const merged = [...caseDraft.notificationValueChanges, ...records];
    setShowNotificationChanged(false);
    setPendingNotificationChanges([]);
    setSaving(true);
    try {
      await savePatch({ child: caseDraft.child, notificationValueChanges: merged });
      goToStep(2);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Step 3: Parents ----------
  const handleStep3Next = async () => {
    const errors: string[] = [];
    if (!caseDraft.mother.firstName.trim() || !caseDraft.mother.lastName.trim()) errors.push("Mother's first and last name are required.");
    if (
      (caseDraft.father.availability === "PROVIDED_VERIFIED" || caseDraft.father.availability === "PROVIDED_UNVERIFIED") &&
      (!caseDraft.father.firstName?.trim() || !caseDraft.father.lastName?.trim())
    ) {
      errors.push("Enter the father's name, or change availability if details aren't provided.");
    }
    if (errors.length) {
      setStepError(errors.join(" "));
      return;
    }
    setStepError(undefined);
    if (!canEditDraft) { goToStep(3); return; }
    setSaving(true);
    try {
      await savePatch({ mother: caseDraft.mother, father: caseDraft.father });
      goToStep(3);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Step 4: Declarant & witnesses ----------
  const handleStep4Next = async () => {
    if (!caseDraft.declarant.firstName.trim() || !caseDraft.declarant.lastName.trim() || !caseDraft.declarant.relationship.trim()) {
      setStepError("Declarant name and relationship to the child are required.");
      return;
    }
    setStepError(undefined);
    if (!canEditDraft) { goToStep(4); return; }
    setSaving(true);
    try {
      await savePatch({ declarant: caseDraft.declarant });
      goToStep(4);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddWitness = async (witness: Omit<Witness, "id">) => {
    const withId: Witness = { ...witness, id: `WT-${Date.now()}-${Math.round(Math.random() * 1000)}` };
    try {
      await savePatch({ witnesses: [...caseDraft.witnesses, withId] });
      setShowAddWitness(false);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleRemoveWitness = async () => {
    if (!witnessToRemove) return;
    try {
      await savePatch({ witnesses: caseDraft.witnesses.filter((w) => w.id !== witnessToRemove.id) });
      setWitnessToRemove(undefined);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  // ---------- SDID identity search (mother / father / declarant) ----------
  const partyOf = (target: SdidTarget) => (target === "mother" ? caseDraft.mother : target === "father" ? caseDraft.father : caseDraft.declarant);

  const commitIdentityMatch = (target: SdidTarget, match: SdidIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
    const patch: Partial<MotherDetails & FatherDetails & Declarant> = {
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      phone: match.phoneNumber,
      documentType,
      documentNumber,
      verification: "VERIFIED" as VerificationState,
      sdidIdentityId: match.identityId,
    };
    if (target === "mother") updateMother(patch);
    else if (target === "father") updateFather({ ...patch, availability: "PROVIDED_VERIFIED" });
    else updateDeclarant(patch);
  };

  const handleUseMatch = (match: SdidIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
    if (!sdidTarget) return;
    const current = partyOf(sdidTarget);
    const enteredName = `${current.firstName || ""} ${current.lastName || ""}`.trim();
    const matchName = `${match.firstName} ${match.lastName}`.trim();
    if (enteredName && enteredName.toLowerCase() !== matchName.toLowerCase()) {
      setPendingMismatch({ target: sdidTarget, match, documentType, documentNumber, enteredName, matchName });
      setSdidTarget(undefined);
      return;
    }
    commitIdentityMatch(sdidTarget, match, documentType, documentNumber);
    setSdidTarget(undefined);
  };

  const handleManualReview = () => {
    if (!sdidTarget) return;
    if (sdidTarget === "mother") updateMother({ verification: "MANUAL_REVIEW_REQUIRED" });
    else if (sdidTarget === "father") updateFather({ verification: "MANUAL_REVIEW_REQUIRED" });
    else updateDeclarant({ verification: "MANUAL_REVIEW_REQUIRED" });
    setSdidTarget(undefined);
  };

  const handleMismatchCorrect = () => {
    if (!pendingMismatch) return;
    commitIdentityMatch(pendingMismatch.target, pendingMismatch.match, pendingMismatch.documentType, pendingMismatch.documentNumber);
    setPendingMismatch(undefined);
  };

  const handleMismatchManualReview = () => {
    if (!pendingMismatch) return;
    const target = pendingMismatch.target;
    if (target === "mother") updateMother({ verification: "MANUAL_REVIEW_REQUIRED" });
    else if (target === "father") updateFather({ verification: "MANUAL_REVIEW_REQUIRED" });
    else updateDeclarant({ verification: "MANUAL_REVIEW_REQUIRED" });
    setPendingMismatch(undefined);
  };

  // ---------- Evidence ----------
  const currentEvidence = caseDraft.evidence.filter((e) => !e.removed);
  const required = requiredEvidenceFor(caseDraft);
  const missing = missingEvidence(caseDraft);

  const handleUploadEvidence = async (input: AttachEvidenceInput) => {
    setEvidenceBusy(true);
    try {
      const item = demoAttachEvidence(caseDraft.id, input, actorName);
      setCaseDraft((prev) => ({ ...prev, evidence: [...prev.evidence, item], version: prev.version + 1 }));
      setShowUploadEvidence(false);
    } finally {
      setEvidenceBusy(false);
    }
  };

  const handleReplaceEvidence = async (input: AttachEvidenceInput) => {
    if (!evidenceToReplace) return;
    setEvidenceBusy(true);
    try {
      const replacedId = evidenceToReplace;
      const item = demoReplaceEvidence(caseDraft.id, replacedId, input, actorName);
      setCaseDraft((prev) => ({
        ...prev,
        evidence: [...prev.evidence.map((e) => (e.id === replacedId ? { ...e, removed: true } : e)), item],
        version: prev.version + 1,
      }));
      setEvidenceToReplace(undefined);
    } finally {
      setEvidenceBusy(false);
    }
  };

  const handleRemoveEvidence = async () => {
    if (!evidenceToRemove) return;
    setEvidenceBusy(true);
    try {
      demoRemoveEvidence(caseDraft.id, evidenceToRemove, actorName);
      setCaseDraft((prev) => ({ ...prev, evidence: prev.evidence.filter((e) => e.id !== evidenceToRemove), version: prev.version + 1 }));
      setEvidenceToRemove(undefined);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setEvidenceBusy(false);
    }
  };

  // ---------- Duplicate check ----------
  const runDuplicateCheck = async () => {
    setDuplicateBusy(true);
    setDuplicateError(undefined);
    try {
      const result = await demoRunDuplicateCheck(
        caseDraft.id,
        { child: caseDraft.child, mother: caseDraft.mother, facilityId: caseDraft.facilityId, facilityName: caseDraft.facilityName, placeOfBirth: caseDraft.placeOfBirth },
        actorName
      );
      setCaseDraft((prev) => ({ ...prev, duplicateCheck: result, version: prev.version + 1 }));
      setShowRunDuplicate(false);
      setShowDuplicateResults(true);
    } catch (err: any) {
      setDuplicateError(err?.message || "Couldn't run the duplicate check.");
    } finally {
      setDuplicateBusy(false);
    }
  };

  const handleResolveDuplicate = async (resolution: Parameters<typeof demoResolveDuplicate>[1]) => {
    demoResolveDuplicate(caseDraft.id, resolution, actorName);
    setCaseDraft((prev) =>
      prev.duplicateCheck
        ? { ...prev, version: prev.version + 1, duplicateCheck: { ...prev.duplicateCheck, resolution: { ...resolution, resolvedBy: actorName, resolvedAt: new Date().toISOString() } } }
        : prev
    );
  };

  // ---------- Step 7: Review & declaration ----------
  const handleStep7Next = async () => {
    if (!(accuracyChecked && officerChecked && declarantChecked && privacyChecked)) {
      setStepError("All four confirmations are required before continuing.");
      return;
    }
    setStepError(undefined);
    setSaving(true);
    try {
      await savePatch({
        declarationConfirmed: accuracyChecked && officerChecked,
        declarantConfirmed: declarantChecked,
        privacyAcknowledged: privacyChecked,
      });
      goToStep(7);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Step 8: Submission ----------
  const submissionWarnings: string[] = [];
  if (missing.length > 0) submissionWarnings.push(`${missing.length} required evidence item(s) missing: ${missing.map((m) => m.documentType).join(", ")}.`);
  if (!caseDraft.duplicateCheck) submissionWarnings.push("No duplicate check has been run yet.");
  else if (caseDraft.duplicateCheck.overallLevel === "EXACT") submissionWarnings.push("An exact duplicate match blocks submission until resolved.");
  else if (caseDraft.duplicateCheck.overallLevel !== "NONE") submissionWarnings.push(`Duplicate check found a ${caseDraft.duplicateCheck.overallLevel} match — this will route to manual/exception review.`);
  if (caseDraft.isLate) submissionWarnings.push(`Reported ${caseDraft.daysAfterBirth} day(s) after birth — routes to late-registration review${caseDraft.requiresSupervisorReview ? " with supervisor sign-off" : ""}.`);
  if (!caseDraft.declarationConfirmed || !caseDraft.declarantConfirmed || !caseDraft.privacyAcknowledged) submissionWarnings.push("Declaration confirmations are incomplete — return to step 7.");

  const handleSubmit = async () => {
    const updated = demoSubmitRegistration(caseDraft.id, actorName);
    setCaseDraft(updated);
    onCaseChange(updated);
    onSubmitted(updated.id);
  };

  const handleNext = () => {
    switch (stepIndex) {
      case 0:
        return handleStep1Next();
      case 1:
        return handleStep2Next();
      case 2:
        return handleStep3Next();
      case 3:
        return handleStep4Next();
      case 4:
      case 5:
        return goToStep(stepIndex + 1);
      case 6:
        return handleStep7Next();
      default:
        return undefined;
    }
  };

  return (
    <>
      <WizardShell
        steps={STEPS}
        currentStepIndex={stepIndex}
        furthestStepIndex={furthestStepIndex}
        onStepClick={(i) => setStepIndex(i)}
        autosaveState={autosaveState === "idle" ? undefined : autosaveState}
        summary={
          <div>
            <h4 style={{ marginTop: 0 }}>{caseDraft.reference}</h4>
            <StatusBadge kind="registration" status={caseDraft.status} />
            <div className="crvs-form-hint" style={{ marginTop: 10 }}>{SOURCE_TYPE_LABELS[caseDraft.sourceType]}</div>
            <div style={{ marginTop: 10 }}>
              <div className="crvs-form-hint">Child</div>
              <div>{[caseDraft.child.firstName, caseDraft.child.lastName].filter(Boolean).join(" ") || "Not yet named"}</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="crvs-form-hint">Date of birth</div>
              <div>{formatDate(caseDraft.dateOfBirth)}</div>
            </div>
            {caseDraft.isLate && (
              <div className="crvs-status-pill crvs-status-warning crvs-status-icon-label" style={{ marginTop: 10 }}>
                <Icon name="schedule" />
                Late registration
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <div className="crvs-form-hint">Evidence</div>
              <div>{currentEvidence.length} attached{missing.length > 0 ? `, ${missing.length} missing` : ""}</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="crvs-form-hint">Duplicate check</div>
              <div>{caseDraft.duplicateCheck ? caseDraft.duplicateCheck.overallLevel : "Not run"}</div>
            </div>
          </div>
        }
        actions={
          <>
            <Button type="button" text="Back" appearance="ghost" onClick={() => goToStep(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0} testId="wizard-back" />
            <div className="crvs-wizard-actions-right">
              <Button type="button" text="Save & exit" appearance="ghost" onClick={onExit} testId="wizard-save-exit" />
              {stepIndex < STEPS.length - 1 && (
                <Button type="button" text="Next" appearance="primary" loading={saving} onClick={handleNext} testId="wizard-next" />
              )}
              {stepIndex === STEPS.length - 1 && canSubmit && (
                <Button type="button" text="Submit application" appearance="primary" onClick={() => setShowSubmit(true)} testId="wizard-submit" />
              )}
            </div>
          </>
        }
      >
        {stepError && <p className="crvs-form-error">{stepError}</p>}

        {stepIndex === 0 && (
          <section className="crvs-section">
            <h3 className="crvs-section-title">Source & processing</h3>
            {caseDraft.notificationReference && (
              <p className="crvs-form-hint">Converted from notification {caseDraft.notificationReference}.</p>
            )}
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label htmlFor="occurrence-type">Occurrence type</label>
                <select id="occurrence-type" disabled={!canEditDraft} value={caseDraft.occurrenceType} onChange={(e) => setCaseDraft((p) => ({ ...p, occurrenceType: e.target.value as BirthRegistrationCase["occurrenceType"] }))}>
                  {OCCURRENCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{OCCURRENCE_TYPE_LABELS[o]}</option>
                  ))}
                </select>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="facility-name">Facility</label>
                <input id="facility-name" disabled={!canEditDraft} value={caseDraft.facilityName || ""} onChange={(e) => setCaseDraft((p) => ({ ...p, facilityName: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="place-of-birth">Place of birth</label>
                <input id="place-of-birth" disabled={!canEditDraft} value={caseDraft.placeOfBirth} onChange={(e) => setCaseDraft((p) => ({ ...p, placeOfBirth: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="processing-office">Processing office</label>
                <input id="processing-office" disabled={!canEditDraft} value={caseDraft.processingOfficeName} onChange={(e) => setCaseDraft((p) => ({ ...p, processingOfficeName: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="jurisdiction">Jurisdiction</label>
                <input id="jurisdiction" disabled={!canEditDraft} value={caseDraft.jurisdiction} onChange={(e) => setCaseDraft((p) => ({ ...p, jurisdiction: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="registration-category">Registration category</label>
                <input id="registration-category" disabled={!canEditDraft} value={caseDraft.registrationCategory} onChange={(e) => setCaseDraft((p) => ({ ...p, registrationCategory: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="date-of-birth">Date of birth</label>
                <input id="date-of-birth" type="date" disabled={!canEditDraft} value={caseDraft.dateOfBirth} onChange={(e) => setCaseDraft((p) => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="date-reported">Date reported</label>
                <input id="date-reported" type="date" disabled={!canEditDraft} value={caseDraft.dateReported} onChange={(e) => setCaseDraft((p) => ({ ...p, dateReported: e.target.value }))} />
              </div>
            </div>

            {caseDraft.sourceType !== "FROM_NOTIFICATION" && (
              <div className="crvs-form-group" style={{ marginTop: 12 }}>
                <label htmlFor="direct-reason">Reason for direct registration</label>
                <textarea id="direct-reason" rows={2} disabled={!canEditDraft} value={caseDraft.directRegistrationReason || ""} onChange={(e) => setCaseDraft((p) => ({ ...p, directRegistrationReason: e.target.value }))} />
              </div>
            )}

            <div className="crvs-form-hint" style={{ marginTop: 12 }}>
              Days between birth and report: <strong>{liveDaysLate}</strong> (threshold {LATE_REGISTRATION_THRESHOLD_DAYS} days)
            </div>

            {liveIsLate && (
              <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
                <Icon name="schedule" />
                <div>
                  <strong>This is a late registration.</strong>
                  <p style={{ margin: "4px 0 8px" }}>
                    {liveSupervisorReview ? "It requires supervisor sign-off and will route to late-registration review on submission." : "It will route to late-registration review on submission."}
                  </p>
                  <div className="crvs-form-group">
                    <label htmlFor="delay-reason">Delay reason</label>
                    <textarea id="delay-reason" rows={2} disabled={!canEditDraft} value={caseDraft.delayReason || ""} onChange={(e) => setCaseDraft((p) => ({ ...p, delayReason: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {stepIndex === 1 && (
          <section className="crvs-section">
            <h3 className="crvs-section-title">Child</h3>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label htmlFor="child-first">First name (optional)</label>
                <input id="child-first" disabled={!canEditDraft} value={caseDraft.child.firstName || ""} onChange={(e) => updateChild({ firstName: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-middle">Middle name</label>
                <input id="child-middle" disabled={!canEditDraft} value={caseDraft.child.middleName || ""} onChange={(e) => updateChild({ middleName: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-last">Last name</label>
                <input id="child-last" disabled={!canEditDraft} value={caseDraft.child.lastName} onChange={(e) => updateChild({ lastName: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-sex">Sex</label>
                <select id="child-sex" disabled={!canEditDraft} value={caseDraft.child.sex} onChange={(e) => updateChild({ sex: e.target.value as Sex })}>
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-dob">Date of birth</label>
                <input id="child-dob" type="date" disabled={!canEditDraft} value={caseDraft.child.dateOfBirth} onChange={(e) => updateChild({ dateOfBirth: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-tob">Time of birth</label>
                <input id="child-tob" type="time" disabled={!canEditDraft} value={caseDraft.child.timeOfBirth || ""} onChange={(e) => updateChild({ timeOfBirth: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-country">Country</label>
                <input id="child-country" disabled={!canEditDraft} value={caseDraft.child.country || ""} onChange={(e) => updateChild({ country: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="child-admin-place">Administrative place of birth</label>
                <input id="child-admin-place" disabled={!canEditDraft} value={caseDraft.child.adminPlaceOfBirth || ""} onChange={(e) => updateChild({ adminPlaceOfBirth: e.target.value })} />
              </div>
            </div>

            <div className="crvs-form-group" style={{ marginTop: 12 }}>
              <label>
                <input
                  type="checkbox"
                  disabled={!canEditDraft}
                  checked={caseDraft.child.multipleBirth.isMultiple}
                  onChange={(e) => updateChild({ multipleBirth: { ...caseDraft.child.multipleBirth, isMultiple: e.target.checked } })}
                  style={{ marginRight: 8 }}
                />
                This is part of a multiple birth
              </label>
            </div>
            {caseDraft.child.multipleBirth.isMultiple && (
              <div className="crvs-form-grid">
                <div className="crvs-form-group">
                  <label htmlFor="birth-order">Birth order</label>
                  <input
                    id="birth-order"
                    type="number"
                    min={1}
                    disabled={!canEditDraft}
                    value={caseDraft.child.multipleBirth.birthOrder || ""}
                    onChange={(e) => updateChild({ multipleBirth: { ...caseDraft.child.multipleBirth, birthOrder: Number(e.target.value) || undefined } })}
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="total-births">Total births</label>
                  <input
                    id="total-births"
                    type="number"
                    min={2}
                    disabled={!canEditDraft}
                    value={caseDraft.child.multipleBirth.totalBirths || ""}
                    onChange={(e) => updateChild({ multipleBirth: { ...caseDraft.child.multipleBirth, totalBirths: Number(e.target.value) || undefined } })}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {stepIndex === 2 && (
          <>
            <section className="crvs-section">
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>Mother</h3>
                {canSearchSdid && (
                  <Button type="button" text="Search SDID" size="sm" startIcon="search" appearance="ghost" onClick={() => setSdidTarget("mother")} testId="search-sdid-mother" />
                )}
              </div>
              <div className="crvs-form-grid">
                <div className="crvs-form-group">
                  <label htmlFor="mother-doc-type">Document type</label>
                  <select id="mother-doc-type" disabled={!canEditDraft} value={caseDraft.mother.documentType} onChange={(e) => updateMother({ documentType: e.target.value as IdentityDocumentType })}>
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-doc-number">Document number</label>
                  <input id="mother-doc-number" disabled={!canEditDraft} value={caseDraft.mother.documentNumber || ""} onChange={(e) => updateMother({ documentNumber: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-first">First name</label>
                  <input id="mother-first" disabled={!canEditDraft} value={caseDraft.mother.firstName} onChange={(e) => updateMother({ firstName: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-last">Last name</label>
                  <input id="mother-last" disabled={!canEditDraft} value={caseDraft.mother.lastName} onChange={(e) => updateMother({ lastName: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-dob">Date of birth</label>
                  <input id="mother-dob" type="date" disabled={!canEditDraft} value={caseDraft.mother.dateOfBirth || ""} onChange={(e) => updateMother({ dateOfBirth: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-nationality">Nationality</label>
                  <input id="mother-nationality" disabled={!canEditDraft} value={caseDraft.mother.nationality} onChange={(e) => updateMother({ nationality: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-residence">Residence</label>
                  <input id="mother-residence" disabled={!canEditDraft} value={caseDraft.mother.residence || ""} onChange={(e) => updateMother({ residence: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-phone">Phone</label>
                  <input id="mother-phone" disabled={!canEditDraft} value={caseDraft.mother.phone || ""} onChange={(e) => updateMother({ phone: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="mother-email">Email</label>
                  <input id="mother-email" disabled={!canEditDraft} value={caseDraft.mother.email || ""} onChange={(e) => updateMother({ email: e.target.value })} />
                </div>
              </div>
              <span className={`crvs-status-pill crvs-status-icon-label ${caseDraft.mother.verification === "VERIFIED" ? "crvs-status-success" : caseDraft.mother.verification === "MANUAL_REVIEW_REQUIRED" ? "crvs-status-danger" : "crvs-status-neutral"}`} style={{ marginTop: 8 }}>
                <Icon name="verified" />
                {VERIFICATION_LABELS[caseDraft.mother.verification]}
              </span>
            </section>

            <section className="crvs-section">
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>Father</h3>
                {canSearchSdid && caseDraft.father.availability !== "NOT_DECLARED" && caseDraft.father.availability !== "UNKNOWN" && caseDraft.father.availability !== "LEGALLY_UNAVAILABLE" && (
                  <Button type="button" text="Search SDID" size="sm" startIcon="search" appearance="ghost" onClick={() => setSdidTarget("father")} testId="search-sdid-father" />
                )}
              </div>
              <div className="crvs-form-group">
                <label htmlFor="father-availability">Availability</label>
                <select id="father-availability" disabled={!canEditDraft} value={caseDraft.father.availability} onChange={(e) => updateFather({ availability: e.target.value as FatherAvailability })}>
                  {FATHER_AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>{FATHER_AVAILABILITY_LABELS[a]}</option>
                  ))}
                </select>
              </div>
              {(caseDraft.father.availability === "PROVIDED_VERIFIED" || caseDraft.father.availability === "PROVIDED_UNVERIFIED") && (
                <div className="crvs-form-grid" style={{ marginTop: 8 }}>
                  <div className="crvs-form-group">
                    <label htmlFor="father-doc-type">Document type</label>
                    <select id="father-doc-type" disabled={!canEditDraft} value={caseDraft.father.documentType || "NONE"} onChange={(e) => updateFather({ documentType: e.target.value as IdentityDocumentType })}>
                      {DOC_TYPES.map((t) => (
                        <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-doc-number">Document number</label>
                    <input id="father-doc-number" disabled={!canEditDraft} value={caseDraft.father.documentNumber || ""} onChange={(e) => updateFather({ documentNumber: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-first">First name</label>
                    <input id="father-first" disabled={!canEditDraft} value={caseDraft.father.firstName || ""} onChange={(e) => updateFather({ firstName: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-last">Last name</label>
                    <input id="father-last" disabled={!canEditDraft} value={caseDraft.father.lastName || ""} onChange={(e) => updateFather({ lastName: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-dob">Date of birth</label>
                    <input id="father-dob" type="date" disabled={!canEditDraft} value={caseDraft.father.dateOfBirth || ""} onChange={(e) => updateFather({ dateOfBirth: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-nationality">Nationality</label>
                    <input id="father-nationality" disabled={!canEditDraft} value={caseDraft.father.nationality || ""} onChange={(e) => updateFather({ nationality: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-residence">Residence</label>
                    <input id="father-residence" disabled={!canEditDraft} value={caseDraft.father.residence || ""} onChange={(e) => updateFather({ residence: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-phone">Phone</label>
                    <input id="father-phone" disabled={!canEditDraft} value={caseDraft.father.phone || ""} onChange={(e) => updateFather({ phone: e.target.value })} />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="father-email">Email</label>
                    <input id="father-email" disabled={!canEditDraft} value={caseDraft.father.email || ""} onChange={(e) => updateFather({ email: e.target.value })} />
                  </div>
                </div>
              )}
              {caseDraft.father.verification && (
                <span className={`crvs-status-pill crvs-status-icon-label ${caseDraft.father.verification === "VERIFIED" ? "crvs-status-success" : caseDraft.father.verification === "MANUAL_REVIEW_REQUIRED" ? "crvs-status-danger" : "crvs-status-neutral"}`} style={{ marginTop: 8 }}>
                  <Icon name="verified" />
                  {VERIFICATION_LABELS[caseDraft.father.verification]}
                </span>
              )}
            </section>
          </>
        )}

        {stepIndex === 3 && (
          <>
            <section className="crvs-section">
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>Declarant</h3>
                {canSearchSdid && (
                  <Button type="button" text="Search SDID" size="sm" startIcon="search" appearance="ghost" onClick={() => setSdidTarget("declarant")} testId="search-sdid-declarant" />
                )}
              </div>
              <div className="crvs-form-grid">
                <div className="crvs-form-group">
                  <label htmlFor="declarant-relationship">Relationship to child</label>
                  <input id="declarant-relationship" disabled={!canEditDraft} value={caseDraft.declarant.relationship} onChange={(e) => updateDeclarant({ relationship: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-doc-type">Document type</label>
                  <select id="declarant-doc-type" disabled={!canEditDraft} value={caseDraft.declarant.documentType} onChange={(e) => updateDeclarant({ documentType: e.target.value as IdentityDocumentType })}>
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-doc-number">Document number</label>
                  <input id="declarant-doc-number" disabled={!canEditDraft} value={caseDraft.declarant.documentNumber || ""} onChange={(e) => updateDeclarant({ documentNumber: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-first">First name</label>
                  <input id="declarant-first" disabled={!canEditDraft} value={caseDraft.declarant.firstName} onChange={(e) => updateDeclarant({ firstName: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-last">Last name</label>
                  <input id="declarant-last" disabled={!canEditDraft} value={caseDraft.declarant.lastName} onChange={(e) => updateDeclarant({ lastName: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-phone">Phone</label>
                  <input id="declarant-phone" disabled={!canEditDraft} value={caseDraft.declarant.phone || ""} onChange={(e) => updateDeclarant({ phone: e.target.value })} />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="declarant-email">Email</label>
                  <input id="declarant-email" disabled={!canEditDraft} value={caseDraft.declarant.email || ""} onChange={(e) => updateDeclarant({ email: e.target.value })} />
                </div>
              </div>
              <span className={`crvs-status-pill crvs-status-icon-label ${caseDraft.declarant.verification === "VERIFIED" ? "crvs-status-success" : caseDraft.declarant.verification === "MANUAL_REVIEW_REQUIRED" ? "crvs-status-danger" : "crvs-status-neutral"}`} style={{ marginTop: 8 }}>
                <Icon name="verified" />
                {VERIFICATION_LABELS[caseDraft.declarant.verification]}
              </span>
            </section>

            <section className="crvs-section">
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>Witnesses</h3>
                {canEditDraft && (
                  <Button type="button" text="Add witness" size="sm" startIcon="person_add" appearance="ghost" onClick={() => setShowAddWitness(true)} testId="add-witness-open" />
                )}
              </div>
              {caseDraft.witnesses.length === 0 && <p className="crvs-form-hint">No witnesses recorded yet.</p>}
              {caseDraft.witnesses.map((w) => (
                <div key={w.id} className="crvs-case-card" style={{ marginBottom: 8 }}>
                  <div className="crvs-case-card-header">
                    <strong>{w.firstName} {w.lastName}</strong>
                    <span className="crvs-form-hint">{w.relationship}</span>
                  </div>
                  <span className="crvs-form-hint">Document: {maskDocumentNumber(w.documentNumber)}</span>
                  {canEditDraft && (
                    <Button type="button" text="Remove" size="sm" appearance="ghost" color="red" onClick={() => setWitnessToRemove(w)} testId={`remove-witness-${w.id}`} />
                  )}
                </div>
              ))}
            </section>
          </>
        )}

        {stepIndex === 4 && (
          <section className="crvs-section">
            <div className="crvs-review-section-header">
              <h3 className="crvs-section-title" style={{ margin: 0 }}>Evidence</h3>
              {canAttachEvidence && canEditDraft && (
                <Button type="button" text="Upload evidence" size="sm" startIcon="upload_file" appearance="primary" onClick={() => setShowUploadEvidence(true)} testId="upload-evidence-open" />
              )}
            </div>
            <div className="crvs-form-hint" style={{ marginBottom: 12 }}>
              Required for this case: {required.map((r) => r.documentType).join(", ") || "None"}
            </div>
            {missing.length > 0 && (
              <div className="crvs-banner crvs-banner-warning">
                <Icon name="warning" />
                <span>Still missing: {missing.map((m) => m.documentType).join(", ")}.</span>
              </div>
            )}
            <div className="crvs-card-grid" style={{ marginTop: 12 }}>
              {currentEvidence.map((e) => (
                <div key={e.id} className="crvs-case-card">
                  <div className="crvs-case-card-header">
                    <strong>{e.documentType}</strong>
                    <span className={`crvs-status-pill ${e.verification === "VERIFIED" ? "crvs-status-success" : "crvs-status-neutral"}`}>{VERIFICATION_LABELS[e.verification]}</span>
                  </div>
                  <span className="crvs-form-hint">{e.fileName} · {e.fileType} · {e.fileSizeKb} KB</span>
                  <span className="crvs-form-hint">Uploaded {formatDateTime(e.uploadedAt)} by {e.uploadedBy}</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <Button type="button" text="Preview" size="sm" appearance="ghost" onClick={() => setEvidenceToPreview(e.id)} testId={`preview-evidence-${e.id}`} />
                    {canAttachEvidence && (
                      <Button type="button" text="Replace" size="sm" appearance="ghost" onClick={() => setEvidenceToReplace(e.id)} testId={`replace-evidence-${e.id}`} />
                    )}
                    {canAttachEvidence && canEditDraft && (
                      <Button type="button" text="Remove" size="sm" appearance="ghost" color="red" onClick={() => setEvidenceToRemove(e.id)} testId={`remove-evidence-${e.id}`} />
                    )}
                  </div>
                </div>
              ))}
              {currentEvidence.length === 0 && <p className="crvs-form-hint">No evidence attached yet.</p>}
            </div>
          </section>
        )}

        {stepIndex === 5 && (
          <section className="crvs-section">
            <h3 className="crvs-section-title">Identity & duplicate checks</h3>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label>Mother</label>
                <span>{VERIFICATION_LABELS[caseDraft.mother.verification]}</span>
              </div>
              <div className="crvs-form-group">
                <label>Father</label>
                <span>{caseDraft.father.verification ? VERIFICATION_LABELS[caseDraft.father.verification] : "N/A"}</span>
              </div>
              <div className="crvs-form-group">
                <label>Declarant</label>
                <span>{VERIFICATION_LABELS[caseDraft.declarant.verification]}</span>
              </div>
              <div className="crvs-form-group">
                <label>Witnesses verified</label>
                <span>{caseDraft.witnesses.filter((w) => w.verification === "VERIFIED").length} / {caseDraft.witnesses.length}</span>
              </div>
            </div>

            <div className="crvs-section" style={{ marginTop: 16 }}>
              <div className="crvs-review-section-header">
                <h3 className="crvs-section-title" style={{ margin: 0 }}>Duplicate check</h3>
                {canRunDuplicateCheck && canEditDraft && (
                  <Button type="button" text="Run duplicate check" size="sm" startIcon="search" appearance="primary" onClick={() => setShowRunDuplicate(true)} testId="run-duplicate-open" />
                )}
              </div>
              {caseDraft.duplicateCheck ? (
                <>
                  <p className="crvs-form-hint">
                    Last checked {formatDateTime(caseDraft.duplicateCheck.checkedAt)} by {caseDraft.duplicateCheck.checkedBy} — result: <strong>{caseDraft.duplicateCheck.overallLevel}</strong>
                  </p>
                  <Button type="button" text="View results" size="sm" appearance="ghost" onClick={() => setShowDuplicateResults(true)} testId="view-duplicate-results" />
                </>
              ) : (
                <p className="crvs-form-hint">No duplicate check has been run yet. This is required before submission.</p>
              )}
            </div>
          </section>
        )}

        {stepIndex === 6 && (
          <section className="crvs-section">
            <h3 className="crvs-section-title">Review & declaration</h3>
            <div className="crvs-review-section-header">
              <strong>Source & processing</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(0)} testId="review-edit-source" />
            </div>
            <p className="crvs-form-hint">{caseDraft.registrationCategory} · {caseDraft.placeOfBirth} · DOB {formatDate(caseDraft.dateOfBirth)}, reported {formatDate(caseDraft.dateReported)}</p>

            <div className="crvs-review-section-header">
              <strong>Child</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(1)} testId="review-edit-child" />
            </div>
            <p className="crvs-form-hint">{[caseDraft.child.firstName, caseDraft.child.middleName, caseDraft.child.lastName].filter(Boolean).join(" ")} · {caseDraft.child.sex}</p>

            <div className="crvs-review-section-header">
              <strong>Parents</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(2)} testId="review-edit-parents" />
            </div>
            <p className="crvs-form-hint">
              Mother: {caseDraft.mother.firstName} {caseDraft.mother.lastName} ({maskDocumentNumber(caseDraft.mother.documentNumber)}) ·
              Father: {FATHER_AVAILABILITY_LABELS[caseDraft.father.availability]}
            </p>

            <div className="crvs-review-section-header">
              <strong>Declarant & witnesses</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(3)} testId="review-edit-declarant" />
            </div>
            <p className="crvs-form-hint">{caseDraft.declarant.firstName} {caseDraft.declarant.lastName} ({caseDraft.declarant.relationship}) · {caseDraft.witnesses.length} witness(es)</p>

            <div className="crvs-review-section-header">
              <strong>Evidence</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(4)} testId="review-edit-evidence" />
            </div>
            <p className="crvs-form-hint">{currentEvidence.length} attached{missing.length > 0 ? `, ${missing.length} still missing` : ""}</p>

            <div className="crvs-review-section-header">
              <strong>Identity & duplicate checks</strong>
              <Button type="button" text="Edit" size="sm" appearance="ghost" onClick={() => goToStep(5)} testId="review-edit-identity" />
            </div>
            <p className="crvs-form-hint">Duplicate check: {caseDraft.duplicateCheck ? caseDraft.duplicateCheck.overallLevel : "Not run"}</p>

            <div className="crvs-section" style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={accuracyChecked} onChange={(e) => setAccuracyChecked(e.target.checked)} style={{ marginRight: 8 }} />
                I confirm the information in this application is accurate to the best of my knowledge.
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={officerChecked} onChange={(e) => setOfficerChecked(e.target.checked)} style={{ marginRight: 8 }} />
                As the processing officer, I have reviewed this application against the supporting evidence.
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={declarantChecked} onChange={(e) => setDeclarantChecked(e.target.checked)} style={{ marginRight: 8 }} />
                The declarant has reviewed and confirmed the details in this application.
              </label>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)} style={{ marginRight: 8 }} />
                I acknowledge the privacy notice: identity data is used solely for civil registration and national identity purposes.
              </label>
            </div>
          </section>
        )}

        {stepIndex === 7 && (
          <section className="crvs-section">
            <h3 className="crvs-section-title">Submission</h3>
            <p className="crvs-form-hint">Review the summary below before submitting this application.</p>
            {submissionWarnings.length === 0 ? (
              <div className="crvs-banner crvs-banner-info">
                <Icon name="check_circle" />
                <span>No outstanding warnings. This application is ready to submit.</span>
              </div>
            ) : (
              <div className="crvs-banner crvs-banner-warning">
                <Icon name="warning" />
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {submissionWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {!canSubmit && (
              <p className="crvs-form-hint" style={{ marginTop: 12 }}>You don't have permission to submit this application.</p>
            )}
          </section>
        )}
      </WizardShell>

      {sdidTarget && (
        <SdidIdentitySearchModal
          show={!!sdidTarget}
          onClose={() => setSdidTarget(undefined)}
          title={`Search SDID — ${sdidTarget}`}
          initialDocumentType={partyOf(sdidTarget).documentType}
          initialDocumentNumber={partyOf(sdidTarget).documentNumber}
          actorName={actorName}
          caseReference={caseDraft.reference}
          onUseMatch={handleUseMatch}
          onManualReview={handleManualReview}
        />
      )}

      {pendingMismatch && (
        <IdentityMismatchModal
          show={!!pendingMismatch}
          fieldLabel={pendingMismatch.target}
          sdidValue={pendingMismatch.matchName}
          enteredValue={pendingMismatch.enteredName}
          onCorrectEntry={handleMismatchCorrect}
          onRequestManualReview={handleMismatchManualReview}
          onClose={() => setPendingMismatch(undefined)}
        />
      )}

      <AddWitnessModal
        show={showAddWitness}
        onClose={() => setShowAddWitness(false)}
        existingDocumentNumbers={caseDraft.witnesses.map((w) => w.documentNumber).filter(Boolean) as string[]}
        onAdd={handleAddWitness}
      />

      <RemoveWitnessModal
        show={!!witnessToRemove}
        witness={witnessToRemove}
        remainingAfterRemoval={Math.max(0, caseDraft.witnesses.length - 1)}
        onClose={() => setWitnessToRemove(undefined)}
        onConfirm={handleRemoveWitness}
      />

      <UploadEvidenceModal show={showUploadEvidence} onClose={() => setShowUploadEvidence(false)} requiredTypes={required} busy={evidenceBusy} onUpload={handleUploadEvidence} />

      <ReplaceEvidenceModal
        show={!!evidenceToReplace}
        evidence={currentEvidence.find((e) => e.id === evidenceToReplace)}
        busy={evidenceBusy}
        onClose={() => setEvidenceToReplace(undefined)}
        onReplace={handleReplaceEvidence}
      />

      <RemoveEvidenceModal
        show={!!evidenceToRemove}
        evidence={currentEvidence.find((e) => e.id === evidenceToRemove)}
        busy={evidenceBusy}
        onClose={() => setEvidenceToRemove(undefined)}
        onConfirm={handleRemoveEvidence}
      />

      <DocumentPreviewModal show={!!evidenceToPreview} evidence={currentEvidence.find((e) => e.id === evidenceToPreview)} onClose={() => setEvidenceToPreview(undefined)} />

      <NotificationDataChangedModal
        show={showNotificationChanged}
        changes={pendingNotificationChanges}
        onCancel={handleNotificationChangeCancel}
        onConfirm={handleNotificationChangeConfirm}
      />

      <RunDuplicateCheckModal show={showRunDuplicate} busy={duplicateBusy} error={duplicateError} onClose={() => setShowRunDuplicate(false)} onRun={runDuplicateCheck} />

      <DuplicateResultsModal
        show={showDuplicateResults}
        result={caseDraft.duplicateCheck}
        canResolve={canResolveDuplicate}
        busy={duplicateBusy}
        onClose={() => setShowDuplicateResults(false)}
        onReturnAndCorrect={() => {
          setShowDuplicateResults(false);
          goToStep(2);
        }}
        onResolve={handleResolveDuplicate}
      />

      <SubmitRegistrationModal show={showSubmit} warnings={submissionWarnings} onClose={() => setShowSubmit(false)} onSubmit={handleSubmit} />
    </>
  );
}
