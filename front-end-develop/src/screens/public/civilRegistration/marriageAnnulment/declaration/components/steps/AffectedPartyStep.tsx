import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import AnnulmentIdentityLookupModal, { AnnulmentIdentityMatch } from "../modals/AnnulmentIdentityLookupModal";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { AffectedParty, AffectedPartyKey, IdentityDocumentType, Sex } from "@/domain/crvs/types";
import { ANNULMENT_IDENTITY_CONFIDENCE_LABELS, DOCUMENT_TYPE_LABELS, affectedPartiesConflict } from "../../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

type AffectedPartyStepProps = AnnulmentWizardStepProps & {
  partyKey: AffectedPartyKey;
};

const CIVIL_STATUS_OPTIONS: NonNullable<AffectedParty["currentCivilStatus"]>[] = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

const CIVIL_STATUS_LABELS: Record<NonNullable<AffectedParty["currentCivilStatus"]>, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

/** Wizard steps 4 and 5 — one affected person each (the two people the
 * marriage being annulled was between). Rendered twice by the wizard host
 * rather than forked into two near-identical files, exactly as divorce's
 * FormerSpouseStep is for its two former spouses.
 *
 * Step 5 additionally guards against both affected people resolving to the
 * same person: the wizard blocks Continue and raises a warning modal rather
 * than silently accepting an impossible pair — an annulment always concerns
 * two different people (spec's affectedPartiesConflict, mirroring divorce's
 * formerSpousesConflict).
 */
export default function AffectedPartyStep({ draft, onChange, onCaseSynced, onPersist, actorName, errors, readOnly, partyKey }: AffectedPartyStepProps) {
  const [showLookup, setShowLookup] = useState(false);

  const isParty1 = partyKey === "PARTY_1";
  const party = isParty1 ? draft.affectedParty1 : draft.affectedParty2;
  const label = isParty1 ? "First affected person" : "Second affected person";
  const idPrefix = isParty1 ? "annulment-party1" : "annulment-party2";
  const target = isParty1 ? "party1" : "party2";

  const setParty = (patch: Partial<AffectedParty>) => {
    const next: AffectedParty = { ...party, ...patch };
    onChange(isParty1 ? { affectedParty1: next } : { affectedParty2: next });
  };

  const conflictsWithOther = !isParty1 && affectedPartiesConflict(draft.affectedParty1, draft.affectedParty2);

  const selectedMarriage = draft.existingMarriage.selected;
  const nameFromMarriage = selectedMarriage ? (isParty1 ? selectedMarriage.party1Name : selectedMarriage.party2Name) : undefined;

  const resyncAfterSearch = async () => {
    const fresh = await demoGetAnnulmentRegistration(draft.id);
    if (fresh) onCaseSynced(fresh);
  };

  const handleOpenLookup = () => {
    onPersist();
    setShowLookup(true);
  };

  const handleMatched = (match: AnnulmentIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
    setParty({
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      sdidIdentityId: match.identityId,
      documentType,
      documentNumber,
      nin: documentType === "NATIONAL_ID" ? documentNumber : party.nin,
    });
    toastMessage("success", `${label}'s identity record linked.`);
  };

  const applyNameFromMarriage = () => {
    if (!nameFromMarriage) return;
    const parts = nameFromMarriage.trim().split(/\s+/);
    setParty({
      firstName: parts[0] || party.firstName,
      lastName: parts.length > 1 ? parts[parts.length - 1] : party.lastName,
      linkedToSelectedMarriage: true,
    });
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">{label}</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        Give the details of this affected person as they appear on the marriage record and the annulment decision. Only
        the information needed to identify the person and, once the case is decided, update their identity record is
        collected — nothing about the grounds the marriage was annulled on.
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
            value={party.documentType || "NONE"}
            disabled={readOnly}
            onChange={(e) => setParty({ documentType: e.target.value as IdentityDocumentType })}
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
            value={party.documentNumber || ""}
            disabled={readOnly || (party.documentType || "NONE") === "NONE"}
            onChange={(e) =>
              setParty({
                documentNumber: e.target.value,
                nin: party.documentType === "NATIONAL_ID" ? e.target.value : party.nin,
              })
            }
            data-testid={`${idPrefix}-document-number`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-first-name`}>First name</label>
          <input
            id={`${idPrefix}-first-name`}
            value={party.firstName || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ firstName: e.target.value })}
            data-testid={`${idPrefix}-first-name`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-middle-name`}>Middle name (optional)</label>
          <input
            id={`${idPrefix}-middle-name`}
            value={party.middleName || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ middleName: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-last-name`}>Last name</label>
          <input
            id={`${idPrefix}-last-name`}
            value={party.lastName || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ lastName: e.target.value })}
            data-testid={`${idPrefix}-last-name`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-sex`}>Sex</label>
          <select
            id={`${idPrefix}-sex`}
            value={party.sex}
            disabled={readOnly}
            onChange={(e) => setParty({ sex: e.target.value as Sex })}
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
            value={party.dateOfBirth?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ dateOfBirth: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-nationality`}>Nationality</label>
          <input
            id={`${idPrefix}-nationality`}
            value={party.nationality || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ nationality: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-civil-status`}>Civil status currently on record</label>
          <select
            id={`${idPrefix}-civil-status`}
            value={party.currentCivilStatus || "MARRIED"}
            disabled={readOnly}
            onChange={(e) => setParty({ currentCivilStatus: e.target.value as AffectedParty["currentCivilStatus"] })}
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
          <input id={`${idPrefix}-phone`} value={party.phone || ""} disabled={readOnly} onChange={(e) => setParty({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${idPrefix}-email`}>Email address (optional)</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            value={party.email || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ email: e.target.value })}
          />
        </div>
      </div>

      <div className="annulment-check-row" style={{ marginTop: 16 }}>
        <div className="annulment-check-row-label">
          <strong>Linked to the selected marriage</strong>
          <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
            {party.linkedToSelectedMarriage ? "This person matches a party on the marriage record you selected." : "Not yet confirmed against the marriage record."}
          </p>
        </div>
        <span className={`crvs-status-pill ${party.linkedToSelectedMarriage ? "crvs-status-success" : "crvs-status-neutral"}`}>
          <Icon name={party.linkedToSelectedMarriage ? "check_circle" : "help"} />
          {party.linkedToSelectedMarriage ? "Linked" : "Not linked"}
        </span>
      </div>

      <div className="annulment-check-row" style={{ marginTop: 8 }}>
        <div className="annulment-check-row-label">
          <strong>Identity match for {label.toLowerCase()}</strong>
          <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
            {ANNULMENT_IDENTITY_CONFIDENCE_LABELS[party.identityMatchConfidence]}
          </p>
        </div>
        <StatusBadge kind="verification" status={party.identityVerification} />
      </div>

      {conflictsWithOther && (
        <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 12, alignItems: "flex-start" }} role="alert">
          <Icon name="error" />
          <div>
            <strong>These two affected people are the same person</strong>
            <p style={{ margin: "6px 0 0" }}>
              The first and second affected person share an identity record or document number. An annulment always
              concerns two different people — correct the identity details on one of the two steps before continuing.
            </p>
          </div>
        </div>
      )}

      <AnnulmentIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target={target}
        subjectLabel={label.toLowerCase()}
        actorName={actorName}
        initialDocumentType={party.documentType}
        initialDocumentNumber={party.documentNumber}
        onMatched={handleMatched}
        onSearched={resyncAfterSearch}
      />
    </div>
  );
}
