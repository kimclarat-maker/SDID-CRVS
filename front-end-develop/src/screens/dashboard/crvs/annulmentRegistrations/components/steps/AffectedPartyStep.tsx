import { useState } from "react";
import Button from "@/components/button";
import StatusBadge from "../../../components/StatusBadge";
import AnnulmentIdentityLookupModal from "../modals/AnnulmentIdentityLookupModal";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import { AffectedParty, AffectedPartyKey, IdentityDocumentType, Sex } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS, IDENTITY_MATCH_CONFIDENCE_LABELS } from "../../../annulmentShared";

type AffectedPartyStepProps = AnnulmentWizardStepProps & { partyKey: AffectedPartyKey; label: string };

/** Wizard steps 3 and 4 (spec §11 Steps 4/5): each affected party's identity,
 * rendered twice by the wizard host rather than forked into two near-identical
 * files — mirrors the divorce module's FormerSpouseStep exactly, scoped to
 * annulment's `affectedParty1`/`affectedParty2` pair. */
export default function AffectedPartyStep({ draft, onChange, onCaseSynced, partyKey, label, readOnly }: AffectedPartyStepProps) {
  const key = partyKey === "PARTY_1" ? "affectedParty1" : "affectedParty2";
  const party = draft[key];
  const [showLookup, setShowLookup] = useState(false);

  const setParty = (patch: Partial<AffectedParty>) => onChange({ [key]: { ...party, ...patch } });

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">{label}</h2>

      {!readOnly && <Button text="Look up identity" appearance="ghost" startIcon="search" type="button" onClick={() => setShowLookup(true)} testId={`annulment-wizard-lookup-${partyKey}`} />}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-doctype`}>Identity document type</label>
          <select id={`${partyKey}-doctype`} value={party.documentType || "NONE"} disabled={readOnly} onChange={(e) => setParty({ documentType: e.target.value as IdentityDocumentType })}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, l]) => (
              <option key={value} value={value}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-docnum`}>Document / NIN number</label>
          <input
            id={`${partyKey}-docnum`}
            value={party.documentNumber || ""}
            disabled={readOnly}
            onChange={(e) => setParty({ documentNumber: e.target.value, nin: party.documentType === "NATIONAL_ID" ? e.target.value : party.nin })}
            data-testid={`annulment-${partyKey}-docnum`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-first`}>First name</label>
          <input id={`${partyKey}-first`} value={party.firstName || ""} disabled={readOnly} onChange={(e) => setParty({ firstName: e.target.value })} data-testid={`annulment-${partyKey}-first`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-middle`}>Middle name</label>
          <input id={`${partyKey}-middle`} value={party.middleName || ""} disabled={readOnly} onChange={(e) => setParty({ middleName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-last`}>Last name</label>
          <input id={`${partyKey}-last`} value={party.lastName || ""} disabled={readOnly} onChange={(e) => setParty({ lastName: e.target.value })} data-testid={`annulment-${partyKey}-last`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-sex`}>Sex</label>
          <select id={`${partyKey}-sex`} value={party.sex} disabled={readOnly} onChange={(e) => setParty({ sex: e.target.value as Sex })}>
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-dob`}>Date of birth</label>
          <input id={`${partyKey}-dob`} type="date" value={party.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setParty({ dateOfBirth: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-nationality`}>Nationality</label>
          <input id={`${partyKey}-nationality`} value={party.nationality || ""} disabled={readOnly} onChange={(e) => setParty({ nationality: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-phone`}>Phone</label>
          <input id={`${partyKey}-phone`} value={party.phone || ""} disabled={readOnly} onChange={(e) => setParty({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-email`}>Email</label>
          <input id={`${partyKey}-email`} type="email" value={party.email || ""} disabled={readOnly} onChange={(e) => setParty({ email: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${partyKey}-civil-status`}>Civil status currently on record</label>
          <select id={`${partyKey}-civil-status`} value={party.currentCivilStatus || "MARRIED"} disabled={readOnly} onChange={(e) => setParty({ currentCivilStatus: e.target.value as AffectedParty["currentCivilStatus"] })}>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <span className="crvs-form-hint">Identity verification:</span>
        <StatusBadge kind="verification" status={party.identityVerification} />
        <span className="crvs-form-hint">Match confidence:</span>
        <span className={`crvs-status-pill crvs-status-${party.identityMatchConfidence === "CONFIRMED" ? "success" : party.identityMatchConfidence === "PROBABLE" ? "info" : "warning"}`}>
          {IDENTITY_MATCH_CONFIDENCE_LABELS[party.identityMatchConfidence]}
        </span>
        <span className="crvs-form-hint">Linked to the selected marriage:</span>
        <span className={`crvs-status-pill crvs-status-${party.linkedToSelectedMarriage ? "success" : "warning"}`}>{party.linkedToSelectedMarriage ? "Yes" : "Not linked"}</span>
      </div>

      {!party.linkedToSelectedMarriage && draft.existingMarriage.status === "MATCHED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          This person is not yet linked to the selected marriage record. A reviewer will treat that as a marriage-identity mismatch unless it is resolved.
        </div>
      )}

      <AnnulmentIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target={partyKey === "PARTY_1" ? "party1" : "party2"}
        targetLabel={label}
        onSearched={(updated) => onCaseSynced(updated)}
      />
    </div>
  );
}
