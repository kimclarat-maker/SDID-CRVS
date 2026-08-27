import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import DivorceIdentityLookupModal, { DivorceIdentityMatch } from "../modals/DivorceIdentityLookupModal";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { FormerSpouse, IdentityDocumentType, Sex } from "@/domain/crvs/types";
import { DIVORCE_IDENTITY_CONFIDENCE_LABELS, DOCUMENT_TYPE_LABELS, formerSpousesConflict } from "../../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

type FormerSpouseStepProps = DivorceWizardStepProps & {
  spouseKey: "SPOUSE1" | "SPOUSE2";
};

const CIVIL_STATUS_OPTIONS: NonNullable<FormerSpouse["currentCivilStatus"]>[] = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

const CIVIL_STATUS_LABELS: Record<NonNullable<FormerSpouse["currentCivilStatus"]>, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

/** Wizard steps 4 and 5 — one former spouse each. Rendered twice by the
 * wizard host rather than forked into two near-identical files, exactly as
 * the marriage wizard does for its two applicants.
 *
 * Step 5 additionally guards against both former spouses resolving to the
 * same person: the wizard blocks Continue and raises a warning modal rather
 * than silently accepting an impossible pair (spec §3 Step 5).
 */
export default function FormerSpouseStep({ draft, onChange, onCaseSynced, onPersist, actorName, errors, readOnly, spouseKey }: FormerSpouseStepProps) {
  const [showLookup, setShowLookup] = useState(false);

  const isSpouse1 = spouseKey === "SPOUSE1";
  const spouse = isSpouse1 ? draft.formerSpouse1 : draft.formerSpouse2;
  const label = isSpouse1 ? "Former spouse 1" : "Former spouse 2";
  const idPrefix = isSpouse1 ? "divorce-spouse1" : "divorce-spouse2";
  const target = isSpouse1 ? "formerSpouse1" : "formerSpouse2";

  const setSpouse = (patch: Partial<FormerSpouse>) => {
    const next: FormerSpouse = { ...spouse, ...patch };
    onChange(isSpouse1 ? { formerSpouse1: next } : { formerSpouse2: next });
  };

  const conflictsWithOther = !isSpouse1 && formerSpousesConflict(draft.formerSpouse1, draft.formerSpouse2);

  const selectedMarriage = draft.existingMarriage.selected;
  const nameFromMarriage = selectedMarriage ? (isSpouse1 ? selectedMarriage.spouse1Name : selectedMarriage.spouse2Name) : undefined;

  const resyncAfterSearch = async () => {
    const fresh = await demoGetDivorceRegistration(draft.id);
    if (fresh) onCaseSynced(fresh);
  };

  const handleOpenLookup = () => {
    onPersist();
    setShowLookup(true);
  };

  const handleMatched = (match: DivorceIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
    setSpouse({
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      sdidIdentityId: match.identityId,
      documentType,
      documentNumber,
      nin: documentType === "NATIONAL_ID" ? documentNumber : spouse.nin,
    });
    toastMessage("success", `${label}'s identity record linked.`);
  };

  const applyNameFromMarriage = () => {
    if (!nameFromMarriage) return;
    const parts = nameFromMarriage.trim().split(/\s+/);
    setSpouse({
      firstName: parts[0] || spouse.firstName,
      lastName: parts.length > 1 ? parts[parts.length - 1] : spouse.lastName,
      linkedToSelectedMarriage: true,
    });
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">{label}</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        Give the details of this former spouse as they appear on the marriage record and the court decision. Only the
        information needed to identify the person and update their civil status is collected — nothing about the reasons
        for the divorce.
      </p>

      {nameFromMarriage && (
        <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
          <Icon name="link" />
          <div style={{ flex: 1 }}>
            The marriage record you selected lists <strong>{nameFromMarriage}</strong> here.
            {!readOnly && (
              <Button
                text="Use this name"
                size="sm"
                appearance="ghost"
                type="button"
                onClick={applyNameFromMarriage}
                testId={`${idPrefix}-use-marriage-name`}
                styles={{ marginLeft: 8 }}
              />
            )}
          </div>
        </div>
      )}

      {!readOnly && (
        <Button
          text={`Look up ${label.toLowerCase()}'s identity record`}
          appearance="ghost"
          startIcon="search"
          type="button"
          onClick={handleOpenLookup}
          testId={`${idPrefix}-lookup`}
          styles={{ marginTop: 12 }}
        />
      )}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-document-type`}>Identity document type</label>
          <select
            id={`${idPrefix}-document-type`}
            value={spouse.documentType || "NONE"}
            disabled={readOnly}
            onChange={(e) => setSpouse({ documentType: e.target.value as IdentityDocumentType })}
            data-testid={`${idPrefix}-document-type`}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, optionLabel]) => (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-document-number`}>Document or NIN number</label>
          <input
            id={`${idPrefix}-document-number`}
            value={spouse.documentNumber || ""}
            disabled={readOnly || (spouse.documentType || "NONE") === "NONE"}
            onChange={(e) =>
              setSpouse({
                documentNumber: e.target.value,
                nin: spouse.documentType === "NATIONAL_ID" ? e.target.value : spouse.nin,
              })
            }
            data-testid={`${idPrefix}-document-number`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-first-name`}>First name</label>
          <input
            id={`${idPrefix}-first-name`}
            value={spouse.firstName || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ firstName: e.target.value })}
            data-testid={`${idPrefix}-first-name`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-middle-name`}>Middle name (optional)</label>
          <input
            id={`${idPrefix}-middle-name`}
            value={spouse.middleName || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ middleName: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-last-name`}>Last name</label>
          <input
            id={`${idPrefix}-last-name`}
            value={spouse.lastName || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ lastName: e.target.value })}
            data-testid={`${idPrefix}-last-name`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-sex`}>Sex</label>
          <select
            id={`${idPrefix}-sex`}
            value={spouse.sex}
            disabled={readOnly}
            onChange={(e) => setSpouse({ sex: e.target.value as Sex })}
            data-testid={`${idPrefix}-sex`}
          >
            <option value="UNKNOWN">Prefer not to say</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-dob`}>Date of birth</label>
          <input
            id={`${idPrefix}-dob`}
            type="date"
            value={spouse.dateOfBirth?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ dateOfBirth: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-nationality`}>Nationality</label>
          <input
            id={`${idPrefix}-nationality`}
            value={spouse.nationality || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ nationality: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-civil-status`}>Civil status currently on record</label>
          <select
            id={`${idPrefix}-civil-status`}
            value={spouse.currentCivilStatus || "MARRIED"}
            disabled={readOnly}
            onChange={(e) => setSpouse({ currentCivilStatus: e.target.value as FormerSpouse["currentCivilStatus"] })}
          >
            {CIVIL_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {CIVIL_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-phone`}>Phone number (optional)</label>
          <input
            id={`${idPrefix}-phone`}
            value={spouse.phone || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ phone: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-email`}>Email address (optional)</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            value={spouse.email || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ email: e.target.value })}
          />
        </div>
      </div>

      <div className="divorce-check-row" style={{ marginTop: 16 }}>
        <div className="divorce-check-row-label">
          <strong>Identity match for {label.toLowerCase()}</strong>
          <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
            {DIVORCE_IDENTITY_CONFIDENCE_LABELS[spouse.identityMatchConfidence]}
          </p>
        </div>
        <StatusBadge kind="verification" status={spouse.identityVerification} />
      </div>

      {conflictsWithOther && (
        <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 12, alignItems: "flex-start" }} role="alert">
          <Icon name="error" />
          <div>
            <strong>These two former spouses are the same person</strong>
            <p style={{ margin: "6px 0 0" }}>
              Former spouse 1 and former spouse 2 share an identity record or document number. A divorce always concerns
              two different people — correct the identity details on one of the two steps before continuing.
            </p>
          </div>
        </div>
      )}

      <DivorceIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target={target}
        subjectLabel={label.toLowerCase()}
        actorName={actorName}
        initialDocumentType={spouse.documentType}
        initialDocumentNumber={spouse.documentNumber}
        onMatched={handleMatched}
        onSearched={resyncAfterSearch}
      />
    </div>
  );
}
