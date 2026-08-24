import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import Icon from "@/components/icon";
import toastMessage from "@/utils/common/toastMessage";
import { cfg } from "@/constants/cfg";
import { getCurrentAccountId } from "@/utils/workspace";
import {
  demoCreateNotificationDraft,
  demoUpdateNotificationDraft,
  NotificationDraftInput,
} from "@/demo/services/crvsNotifications";
import { DEMO_FACILITY_ID, DEMO_FACILITY_NAME } from "@/demo/seed/crvsAccounts";
import {
  BirthNotification,
  ChildDetails,
  FatherAvailability,
  FatherDetails,
  IdentityDocumentType,
  MotherDetails,
  OccurrenceType,
  Sex,
} from "@/domain/crvs/types";
import UnsavedChangesModal from "@/components/crvs/modals/UnsavedChangesModal";
import SuccessModal from "@/components/crvs/modals/SuccessModal";
import SaveDraftModal from "./modals/SaveDraftModal";
import SubmitNotificationModal from "./modals/SubmitNotificationModal";
import CancelNotificationModal from "./modals/CancelNotificationModal";

/** Reads the same session shape src/demo/session.ts writes (see
 * src/utils/workspace/index.ts's readSession()) — there is no exported
 * "current actor name" helper in that module yet, so this reads the
 * identical storage key/shape locally rather than reaching into a file
 * outside this feature's edit scope. */
export function getActorName(): string {
  try {
    const raw = sessionStorage.getItem(cfg.VITE_APP_NAME || "SDID-ENROLLMENT");
    if (!raw) return "Unknown user";
    const session = JSON.parse(raw);
    const first = session?.account?.firstName || session?.firstName;
    const last = session?.account?.lastName || session?.lastName;
    const full = [first, last].filter(Boolean).join(" ");
    return full || session?.email || "Unknown user";
  } catch {
    return "Unknown user";
  }
}

/** First name is optional on a child record — never fabricate a
 * placeholder, render "Unnamed <lastName>" wherever a name is displayed. */
export function childFullName(child: ChildDetails): string {
  if (!child.firstName) return `Unnamed ${child.lastName || ""}`.trim() || "Unnamed child";
  return [child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ");
}

/** Never show a full identity document number outside a privileged view —
 * mask everything but the last 4 characters. */
export function maskDocumentNumber(num?: string): string {
  if (!num) return "Not provided";
  return num.length <= 4 ? "•".repeat(num.length) : `••••${num.slice(-4)}`;
}

export const OCCURRENCE_TYPE_LABELS: Record<OccurrenceType, string> = {
  FACILITY: "Health facility",
  HOME: "Home",
  TRANSIT: "In transit",
  OTHER: "Other",
};

export const DOCUMENT_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  REFUGEE_ID: "Refugee ID",
  DRIVER_LICENSE: "Driver's license",
  OTHER: "Other",
  NONE: "None",
};

export const FATHER_AVAILABILITY_LABELS: Record<FatherAvailability, string> = {
  PROVIDED_VERIFIED: "Provided and verified",
  PROVIDED_UNVERIFIED: "Provided, not yet verified",
  NOT_DECLARED: "Not declared",
  UNKNOWN: "Unknown",
  LEGALLY_UNAVAILABLE: "Legally unavailable",
};

export const SEX_LABELS: Record<Sex, string> = {
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "Unknown",
};

const emptyChild = (): ChildDetails => ({
  lastName: "",
  sex: "UNKNOWN",
  dateOfBirth: "",
  placeOfBirth: DEMO_FACILITY_NAME,
  multipleBirth: { isMultiple: false },
});

const emptyMother = (): MotherDetails => ({
  firstName: "",
  lastName: "",
  documentType: "NONE",
  nationality: "",
  verification: "NOT_VERIFIED",
});

const emptyFather = (): FatherDetails => ({ availability: "NOT_DECLARED" });

const STEPS: WizardStep[] = [
  { key: "source", label: "Birth source" },
  { key: "child", label: "Child details" },
  { key: "parents", label: "Parent details" },
  { key: "review", label: "Review & submit" },
];

export type NotificationWizardProps = {
  mode: "create" | "edit";
  /** Required (and expected to be DRAFT or RETURNED) when mode === "edit". */
  notification?: BirthNotification;
  /** Called after the notification is submitted, or the user chooses "Save
   * and close" / "Discard changes" — the caller decides where to navigate. */
  onDone: (notification?: BirthNotification) => void;
};

/** The shared 4-step birth-notification wizard used by both the "new" and
 * "edit" routes. Owns all draft persistence (create/update/submit) so the
 * two host pages only need to load a notification (or not) and decide
 * where to go once the wizard reports back. */
export default function NotificationWizard({ mode, notification, onDone }: NotificationWizardProps) {
  const navigate = useNavigate();

  const [notificationId, setNotificationId] = useState<string | undefined>(notification?.id);
  const [version, setVersion] = useState<number | undefined>(notification?.version);
  const [reference, setReference] = useState<string | undefined>(notification?.reference);
  const [status, setStatus] = useState(notification?.status);

  const [sourceReference, setSourceReference] = useState(notification?.sourceReference || "");
  const [occurrenceType, setOccurrenceType] = useState<OccurrenceType>(notification?.occurrenceType || "FACILITY");
  const [child, setChild] = useState<ChildDetails>(notification?.child || emptyChild());
  const [mother, setMother] = useState<MotherDetails>(notification?.mother || emptyMother());
  const [father, setFather] = useState<FatherDetails>(notification?.father || emptyFather());

  const buildPatch = (): NotificationDraftInput => ({
    facilityId: DEMO_FACILITY_ID,
    facilityName: DEMO_FACILITY_NAME,
    sourceReference: sourceReference.trim() || undefined,
    occurrenceType,
    child,
    mother,
    father,
  });

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => JSON.stringify(buildPatch()));
  const dirty = JSON.stringify(buildPatch()) !== lastSavedSnapshot;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [furthestStepIndex, setFurthestStepIndex] = useState(mode === "edit" ? STEPS.length - 1 : 0);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | undefined>(undefined);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);

  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const currentSaved = (): BirthNotification | undefined =>
    notificationId
      ? {
          id: notificationId,
          reference: reference || "",
          status: status || "DRAFT",
          facilityId: DEMO_FACILITY_ID,
          facilityName: DEMO_FACILITY_NAME,
          sourceReference: sourceReference.trim() || undefined,
          occurrenceType,
          child,
          mother,
          father,
          notifierId: notification?.notifierId || getCurrentAccountId() || "",
          notifierName: notification?.notifierName || getActorName(),
          createdAt: notification?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: notification?.statusHistory || [],
          version: version ?? 1,
        }
      : undefined;

  const persist = async (): Promise<BirthNotification> => {
    const actorName = getActorName();
    const actorId = getCurrentAccountId() || actorName;
    const patch = buildPatch();
    setAutosaveState("saving");
    try {
      let result: BirthNotification;
      if (!notificationId) {
        result = demoCreateNotificationDraft(patch, actorId, actorName);
      } else {
        result = demoUpdateNotificationDraft(notificationId, patch, actorName, version);
      }
      setNotificationId(result.id);
      setVersion(result.version);
      setReference(result.reference);
      setStatus(result.status);
      setLastSavedSnapshot(JSON.stringify(patch));
      setAutosaveState("saved");
      window.setTimeout(() => setAutosaveState((s) => (s === "saved" ? "idle" : s)), 2000);
      return result;
    } catch (err) {
      setAutosaveState("idle");
      throw err;
    }
  };

  const validateStep = (index: number): string[] => {
    const errors: string[] = [];
    if (index === 0) {
      if (!child.dateOfBirth) errors.push("Date of birth is required.");
      if (!child.placeOfBirth.trim()) errors.push("Place of birth is required.");
      if (child.multipleBirth.isMultiple && !child.multipleBirth.birthOrder) {
        errors.push("Birth order is required for a multiple birth.");
      }
    }
    if (index === 1) {
      if (!child.lastName.trim()) errors.push("Child's last name is required.");
    }
    if (index === 2) {
      if (!mother.firstName.trim()) errors.push("Mother's first name is required.");
      if (!mother.lastName.trim()) errors.push("Mother's last name is required.");
      if (!mother.nationality.trim()) errors.push("Mother's nationality is required.");
      if (mother.documentType !== "NONE" && !mother.documentNumber?.trim()) {
        errors.push("Mother's document number is required for the selected document type.");
      }
      if (father.availability === "PROVIDED_VERIFIED" || father.availability === "PROVIDED_UNVERIFIED") {
        if (!father.firstName?.trim()) errors.push("Father's first name is required when father details are provided.");
        if (!father.lastName?.trim()) errors.push("Father's last name is required when father details are provided.");
      }
    }
    return errors;
  };

  const handleContinue = async () => {
    const errors = validateStep(currentStepIndex);
    setStepErrors(errors);
    if (errors.length > 0) return;
    try {
      await persist();
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      setFurthestStepIndex((f) => Math.max(f, next));
    } catch (err: any) {
      toastMessage("error", err?.message || "Couldn't save your progress.");
    }
  };

  const handleBack = () => {
    setStepErrors([]);
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  };

  const handleStepClick = (index: number) => {
    if (index > furthestStepIndex) return;
    setStepErrors([]);
    setCurrentStepIndex(index);
  };

  const handleSaveDraftClick = async () => {
    try {
      await persist();
      setShowSaveDraftModal(true);
    } catch (err: any) {
      toastMessage("error", err?.message || "Couldn't save the draft.");
    }
  };

  const handleExitClick = () => {
    if (dirty) {
      setShowUnsavedModal(true);
    } else {
      onDone(currentSaved());
    }
  };

  const handleSubmitClick = async () => {
    try {
      await persist();
      setShowSubmitModal(true);
    } catch (err: any) {
      toastMessage("error", err?.message || "Couldn't save the notification before submitting.");
    }
  };

  const isLastStep = currentStepIndex === STEPS.length - 1;
  const saved = currentSaved();
  const canCancelNotification = mode === "edit" && status === "DRAFT" && !!notificationId;

  const summary = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong style={{ fontSize: "var(--font-size-body-sm)" }}>{reference || "Unsaved draft"}</strong>
        {status && <StatusBadge kind="notification" status={status} />}
      </div>
      <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <dt className="crvs-form-hint">Child</dt>
          <dd style={{ margin: 0 }}>{childFullName(child)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Date of birth</dt>
          <dd style={{ margin: 0 }}>{child.dateOfBirth || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Place of birth</dt>
          <dd style={{ margin: 0 }}>{child.placeOfBirth || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Mother</dt>
          <dd style={{ margin: 0 }}>{[mother.firstName, mother.lastName].filter(Boolean).join(" ") || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Father</dt>
          <dd style={{ margin: 0 }}>{FATHER_AVAILABILITY_LABELS[father.availability]}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Facility</dt>
          <dd style={{ margin: 0 }}>{DEMO_FACILITY_NAME}</dd>
        </div>
      </dl>
    </div>
  );

  const actions = (
    <>
      <div className="crvs-wizard-actions-right">
        <Button text="Back to notifications" appearance="ghost" type="button" onClick={handleExitClick} testId="wizard-exit" />
        {currentStepIndex > 0 && (
          <Button text="Back" appearance="ghost" type="button" onClick={handleBack} testId="wizard-back" />
        )}
      </div>
      <div className="crvs-wizard-actions-right">
        {canCancelNotification && (
          <Button
            text="Cancel notification"
            appearance="ghost"
            color="red"
            type="button"
            onClick={() => setShowCancelModal(true)}
            testId="wizard-cancel-notification"
          />
        )}
        <Button text="Save draft" appearance="ghost" type="button" onClick={handleSaveDraftClick} testId="wizard-save-draft" />
        {!isLastStep && <Button text="Continue" appearance="primary" type="button" onClick={handleContinue} testId="wizard-continue" />}
        {isLastStep && (
          <Button
            text="Submit notification"
            appearance="primary"
            type="button"
            disabled={!accuracyConfirmed}
            onClick={handleSubmitClick}
            testId="wizard-submit"
          />
        )}
      </div>
    </>
  );

  return (
    <>
      {notification?.status === "RETURNED" && notification.returnReason && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginBottom: "var(--content-gap-md)" }}>
          <Icon name="undo" />
          <div>
            <strong>Returned for correction:</strong> {notification.returnReason.reason}
            {notification.returnReason.note ? ` — ${notification.returnReason.note}` : ""}
            {notification.returnReason.fields.length > 0 && (
              <div className="crvs-form-hint">Fields to review: {notification.returnReason.fields.join(", ")}</div>
            )}
          </div>
        </div>
      )}

      <WizardShell
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        furthestStepIndex={furthestStepIndex}
        onStepClick={handleStepClick}
        summary={summary}
        autosaveState={autosaveState}
        actions={actions}
      >
        {stepErrors.length > 0 && (
          <div className="crvs-banner crvs-banner-danger" role="alert">
            <Icon name="error" />
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {stepErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {currentStepIndex === 0 && (
          <div className="crvs-section">
            <h2 className="crvs-section-title">Birth source</h2>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label>Assigned facility</label>
                <input value={DEMO_FACILITY_NAME} disabled readOnly data-testid="wizard-facility" />
                <span className="crvs-form-hint">Locked to your facility assignment.</span>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="sourceReference">Notification source reference</label>
                <input
                  id="sourceReference"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="e.g. facility register no."
                  data-testid="wizard-source-reference"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="occurrenceType">Occurrence type</label>
                <select
                  id="occurrenceType"
                  value={occurrenceType}
                  onChange={(e) => setOccurrenceType(e.target.value as OccurrenceType)}
                  data-testid="wizard-occurrence-type"
                >
                  {(Object.keys(OCCURRENCE_TYPE_LABELS) as OccurrenceType[]).map((key) => (
                    <option key={key} value={key}>
                      {OCCURRENCE_TYPE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="dateOfBirth">Date of birth *</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={child.dateOfBirth}
                  onChange={(e) => setChild({ ...child, dateOfBirth: e.target.value })}
                  data-testid="wizard-date-of-birth"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="timeOfBirth">Time of birth</label>
                <input
                  id="timeOfBirth"
                  type="time"
                  value={child.timeOfBirth || ""}
                  onChange={(e) => setChild({ ...child, timeOfBirth: e.target.value })}
                  data-testid="wizard-time-of-birth"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="placeOfBirth">Place of birth *</label>
                <input
                  id="placeOfBirth"
                  value={child.placeOfBirth}
                  onChange={(e) => setChild({ ...child, placeOfBirth: e.target.value })}
                  data-testid="wizard-place-of-birth"
                />
              </div>
            </div>

            <div style={{ marginTop: "var(--content-gap-md)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={child.multipleBirth.isMultiple}
                  onChange={(e) =>
                    setChild({
                      ...child,
                      multipleBirth: { ...child.multipleBirth, isMultiple: e.target.checked },
                    })
                  }
                  data-testid="wizard-multiple-birth"
                />
                This was a multiple birth
              </label>

              {child.multipleBirth.isMultiple && (
                <div className="crvs-form-grid" style={{ marginTop: 10 }}>
                  <div className="crvs-form-group">
                    <label htmlFor="birthOrder">Birth order *</label>
                    <input
                      id="birthOrder"
                      type="number"
                      min={1}
                      value={child.multipleBirth.birthOrder ?? ""}
                      onChange={(e) =>
                        setChild({
                          ...child,
                          multipleBirth: { ...child.multipleBirth, birthOrder: Number(e.target.value) || undefined },
                        })
                      }
                      data-testid="wizard-birth-order"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="totalBirths">Total births</label>
                    <input
                      id="totalBirths"
                      type="number"
                      min={1}
                      value={child.multipleBirth.totalBirths ?? ""}
                      onChange={(e) =>
                        setChild({
                          ...child,
                          multipleBirth: { ...child.multipleBirth, totalBirths: Number(e.target.value) || undefined },
                        })
                      }
                      data-testid="wizard-total-births"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStepIndex === 1 && (
          <div className="crvs-section">
            <h2 className="crvs-section-title">Child details</h2>
            <p className="crvs-form-hint">
              Birth on {child.dateOfBirth || "—"}{child.timeOfBirth ? ` at ${child.timeOfBirth}` : ""} · {child.placeOfBirth || "—"}
              {child.multipleBirth.isMultiple ? ` · Multiple birth (order ${child.multipleBirth.birthOrder ?? "?"})` : ""}
              {" — "}
              <button type="button" className="crvs-tab" style={{ padding: 0, minHeight: "auto" }} onClick={() => setCurrentStepIndex(0)}>
                edit
              </button>
            </p>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label htmlFor="childFirstName">First name (optional)</label>
                <input
                  id="childFirstName"
                  value={child.firstName || ""}
                  onChange={(e) => setChild({ ...child, firstName: e.target.value || undefined })}
                  data-testid="wizard-child-first-name"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="childMiddleName">Middle name (optional)</label>
                <input
                  id="childMiddleName"
                  value={child.middleName || ""}
                  onChange={(e) => setChild({ ...child, middleName: e.target.value || undefined })}
                  data-testid="wizard-child-middle-name"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="childLastName">Last name *</label>
                <input
                  id="childLastName"
                  value={child.lastName}
                  onChange={(e) => setChild({ ...child, lastName: e.target.value })}
                  data-testid="wizard-child-last-name"
                />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="childSex">Sex *</label>
                <select
                  id="childSex"
                  value={child.sex}
                  onChange={(e) => setChild({ ...child, sex: e.target.value as Sex })}
                  data-testid="wizard-child-sex"
                >
                  {(Object.keys(SEX_LABELS) as Sex[]).map((key) => (
                    <option key={key} value={key}>
                      {SEX_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!child.firstName && (
              <p className="crvs-form-hint" style={{ marginTop: 8 }}>
                No first name yet — this record will display as "{childFullName(child)}" until one is added.
              </p>
            )}
          </div>
        )}

        {currentStepIndex === 2 && (
          <>
            <div className="crvs-section">
              <h2 className="crvs-section-title">Mother's details</h2>
              <div className="crvs-form-grid">
                <div className="crvs-form-group">
                  <label htmlFor="motherFirstName">First name *</label>
                  <input
                    id="motherFirstName"
                    value={mother.firstName}
                    onChange={(e) => setMother({ ...mother, firstName: e.target.value })}
                    data-testid="wizard-mother-first-name"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherLastName">Last name *</label>
                  <input
                    id="motherLastName"
                    value={mother.lastName}
                    onChange={(e) => setMother({ ...mother, lastName: e.target.value })}
                    data-testid="wizard-mother-last-name"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherDocType">Document type</label>
                  <select
                    id="motherDocType"
                    value={mother.documentType}
                    onChange={(e) => setMother({ ...mother, documentType: e.target.value as IdentityDocumentType })}
                    data-testid="wizard-mother-document-type"
                  >
                    {(Object.keys(DOCUMENT_TYPE_LABELS) as IdentityDocumentType[]).map((key) => (
                      <option key={key} value={key}>
                        {DOCUMENT_TYPE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherDocNumber">
                    Document number{mother.documentType !== "NONE" ? " *" : ""}
                  </label>
                  <input
                    id="motherDocNumber"
                    value={mother.documentNumber || ""}
                    disabled={mother.documentType === "NONE"}
                    onChange={(e) => setMother({ ...mother, documentNumber: e.target.value })}
                    data-testid="wizard-mother-document-number"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherNationality">Nationality *</label>
                  <input
                    id="motherNationality"
                    value={mother.nationality}
                    onChange={(e) => setMother({ ...mother, nationality: e.target.value })}
                    data-testid="wizard-mother-nationality"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherPhone">Phone</label>
                  <input
                    id="motherPhone"
                    value={mother.phone || ""}
                    onChange={(e) => setMother({ ...mother, phone: e.target.value })}
                    data-testid="wizard-mother-phone"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherEmail">Email</label>
                  <input
                    id="motherEmail"
                    type="email"
                    value={mother.email || ""}
                    onChange={(e) => setMother({ ...mother, email: e.target.value })}
                    data-testid="wizard-mother-email"
                  />
                </div>
                <div className="crvs-form-group">
                  <label htmlFor="motherResidence">Residence</label>
                  <input
                    id="motherResidence"
                    value={mother.residence || ""}
                    onChange={(e) => setMother({ ...mother, residence: e.target.value })}
                    data-testid="wizard-mother-residence"
                  />
                </div>
              </div>
            </div>

            <div className="crvs-section">
              <h2 className="crvs-section-title">Father's details</h2>
              <div className="crvs-form-grid">
                <div className="crvs-form-group">
                  <label htmlFor="fatherAvailability">Availability</label>
                  <select
                    id="fatherAvailability"
                    value={father.availability}
                    onChange={(e) => setFather({ ...father, availability: e.target.value as FatherAvailability })}
                    data-testid="wizard-father-availability"
                  >
                    {(Object.keys(FATHER_AVAILABILITY_LABELS) as FatherAvailability[]).map((key) => (
                      <option key={key} value={key}>
                        {FATHER_AVAILABILITY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(father.availability === "PROVIDED_VERIFIED" || father.availability === "PROVIDED_UNVERIFIED") ? (
                <div className="crvs-form-grid" style={{ marginTop: 10 }}>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherFirstName">First name *</label>
                    <input
                      id="fatherFirstName"
                      value={father.firstName || ""}
                      onChange={(e) => setFather({ ...father, firstName: e.target.value })}
                      data-testid="wizard-father-first-name"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherLastName">Last name *</label>
                    <input
                      id="fatherLastName"
                      value={father.lastName || ""}
                      onChange={(e) => setFather({ ...father, lastName: e.target.value })}
                      data-testid="wizard-father-last-name"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherDocType">Document type</label>
                    <select
                      id="fatherDocType"
                      value={father.documentType || "NONE"}
                      onChange={(e) => setFather({ ...father, documentType: e.target.value as IdentityDocumentType })}
                      data-testid="wizard-father-document-type"
                    >
                      {(Object.keys(DOCUMENT_TYPE_LABELS) as IdentityDocumentType[]).map((key) => (
                        <option key={key} value={key}>
                          {DOCUMENT_TYPE_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherDocNumber">Document number</label>
                    <input
                      id="fatherDocNumber"
                      value={father.documentNumber || ""}
                      onChange={(e) => setFather({ ...father, documentNumber: e.target.value })}
                      data-testid="wizard-father-document-number"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherNationality">Nationality</label>
                    <input
                      id="fatherNationality"
                      value={father.nationality || ""}
                      onChange={(e) => setFather({ ...father, nationality: e.target.value })}
                      data-testid="wizard-father-nationality"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherPhone">Phone</label>
                    <input
                      id="fatherPhone"
                      value={father.phone || ""}
                      onChange={(e) => setFather({ ...father, phone: e.target.value })}
                      data-testid="wizard-father-phone"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherEmail">Email</label>
                    <input
                      id="fatherEmail"
                      type="email"
                      value={father.email || ""}
                      onChange={(e) => setFather({ ...father, email: e.target.value })}
                      data-testid="wizard-father-email"
                    />
                  </div>
                  <div className="crvs-form-group">
                    <label htmlFor="fatherResidence">Residence</label>
                    <input
                      id="fatherResidence"
                      value={father.residence || ""}
                      onChange={(e) => setFather({ ...father, residence: e.target.value })}
                      data-testid="wizard-father-residence"
                    />
                  </div>
                </div>
              ) : (
                <p className="crvs-form-hint" style={{ marginTop: 10 }}>
                  No father details are required for "{FATHER_AVAILABILITY_LABELS[father.availability]}".
                </p>
              )}
            </div>
          </>
        )}

        {currentStepIndex === 3 && (
          <div className="crvs-section">
            <h2 className="crvs-section-title">Review and submit</h2>

            <div className="crvs-review-section">
              <h3 className="crvs-form-hint" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Birth occurrence</h3>
              <p>
                {OCCURRENCE_TYPE_LABELS[occurrenceType]} · {child.dateOfBirth || "—"}
                {child.timeOfBirth ? ` at ${child.timeOfBirth}` : ""} · {child.placeOfBirth || "—"}
                {sourceReference ? ` · Source ref: ${sourceReference}` : ""}
                {child.multipleBirth.isMultiple ? ` · Multiple birth (order ${child.multipleBirth.birthOrder ?? "?"} of ${child.multipleBirth.totalBirths ?? "?"})` : ""}
              </p>
            </div>

            <div className="crvs-review-section">
              <h3 className="crvs-form-hint" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Child</h3>
              <p>{childFullName(child)} · {SEX_LABELS[child.sex]}</p>
            </div>

            <div className="crvs-review-section">
              <h3 className="crvs-form-hint" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Mother</h3>
              <p>
                {mother.firstName} {mother.lastName} · {DOCUMENT_TYPE_LABELS[mother.documentType]}
                {mother.documentType !== "NONE" ? ` (${maskDocumentNumber(mother.documentNumber)})` : ""} · {mother.nationality}
              </p>
            </div>

            <div className="crvs-review-section">
              <h3 className="crvs-form-hint" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Father</h3>
              <p>
                {FATHER_AVAILABILITY_LABELS[father.availability]}
                {(father.availability === "PROVIDED_VERIFIED" || father.availability === "PROVIDED_UNVERIFIED") &&
                  ` · ${father.firstName || ""} ${father.lastName || ""}`}
              </p>
            </div>

            <div className="crvs-review-section">
              <h3 className="crvs-form-hint" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Facility & notifier</h3>
              <p>{DEMO_FACILITY_NAME} · Notified by {getActorName()}</p>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={accuracyConfirmed}
                onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                data-testid="wizard-accuracy-confirm"
                style={{ marginTop: 3 }}
              />
              I confirm the information above is accurate to the best of my knowledge.
            </label>
          </div>
        )}
      </WizardShell>

      <SaveDraftModal
        show={showSaveDraftModal}
        reference={reference}
        onContinueEditing={() => setShowSaveDraftModal(false)}
        onSaveAndClose={() => {
          setShowSaveDraftModal(false);
          onDone(saved);
        }}
      />

      {saved && (
        <SubmitNotificationModal
          show={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          notification={saved}
          onSubmitted={(updated) => {
            setShowSubmitModal(false);
            setStatus(updated.status);
            setShowSuccessModal(true);
          }}
        />
      )}

      <SuccessModal
        show={showSuccessModal}
        onClose={() => onDone(saved)}
        title="Notification submitted"
        primaryLabel="View notification"
        onPrimary={() => notificationId && navigate(`/dashboard/crvs/notifications/${notificationId}`)}
        secondaryLabel="Return to notifications"
        onSecondary={() => onDone(saved)}
        testId="notification-submitted-modal"
      >
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <dt className="crvs-form-hint">Reference</dt>
            <dd style={{ margin: 0 }}>{reference}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Submitted</dt>
            <dd style={{ margin: 0 }}>{new Date().toLocaleString()}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Status</dt>
            <dd style={{ margin: 0 }}><StatusBadge kind="notification" status="SUBMITTED" /></dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Next step</dt>
            <dd style={{ margin: 0 }}>A CRVS Registration Officer will review and accept this notification.</dd>
          </div>
        </dl>
      </SuccessModal>

      {saved && (
        <CancelNotificationModal
          show={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          notification={saved}
          onCancelled={(updated) => {
            setShowCancelModal(false);
            onDone(updated);
          }}
        />
      )}

      <UnsavedChangesModal
        show={showUnsavedModal}
        onStay={() => setShowUnsavedModal(false)}
        onDiscard={() => {
          setShowUnsavedModal(false);
          onDone(saved);
        }}
        onSaveDraftAndLeave={async () => {
          const result = await persist();
          setShowUnsavedModal(false);
          onDone(result);
        }}
        testId="wizard-unsaved-changes"
      />
    </>
  );
}
