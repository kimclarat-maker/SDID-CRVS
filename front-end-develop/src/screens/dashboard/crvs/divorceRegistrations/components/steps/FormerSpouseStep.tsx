import { useState } from "react";
import Button from "@/components/button";
import StatusBadge from "../../../components/StatusBadge";
import DivorceIdentityLookupModal from "../modals/DivorceIdentityLookupModal";
import { DivorceWizardStepProps } from "../wizardTypes";
import { FormerSpouse, IdentityDocumentType, Sex } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS, IDENTITY_MATCH_CONFIDENCE_LABELS } from "../../../divorceShared";

type FormerSpouseStepProps = DivorceWizardStepProps & { spouseKey: "SPOUSE1" | "SPOUSE2"; label: string };

/** Wizard steps 3 and 4 (spec §3): each former spouse's identity, rendered
 * twice by the wizard host rather than forked into two near-identical files
 * — same approach marriage's ApplicantStep takes. */
export default function FormerSpouseStep({ draft, onChange, onCaseSynced, spouseKey, label, readOnly }: FormerSpouseStepProps) {
  const key = spouseKey === "SPOUSE1" ? "formerSpouse1" : "formerSpouse2";
  const spouse = draft[key];
  const [showLookup, setShowLookup] = useState(false);

  const setSpouse = (patch: Partial<FormerSpouse>) => onChange({ [key]: { ...spouse, ...patch } });

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">{label}</h2>

      {!readOnly && <Button text="Look up identity" appearance="ghost" startIcon="search" type="button" onClick={() => setShowLookup(true)} testId={`divorce-wizard-lookup-${spouseKey}`} />}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-doctype`}>Identity document type</label>
          <select id={`${spouseKey}-doctype`} value={spouse.documentType || "NONE"} disabled={readOnly} onChange={(e) => setSpouse({ documentType: e.target.value as IdentityDocumentType })}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, l]) => (
              <option key={value} value={value}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-docnum`}>Document / NIN number</label>
          <input
            id={`${spouseKey}-docnum`}
            value={spouse.documentNumber || ""}
            disabled={readOnly}
            onChange={(e) => setSpouse({ documentNumber: e.target.value, nin: spouse.documentType === "NATIONAL_ID" ? e.target.value : spouse.nin })}
            data-testid={`divorce-${spouseKey}-docnum`}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-first`}>First name</label>
          <input id={`${spouseKey}-first`} value={spouse.firstName || ""} disabled={readOnly} onChange={(e) => setSpouse({ firstName: e.target.value })} data-testid={`divorce-${spouseKey}-first`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-middle`}>Middle name</label>
          <input id={`${spouseKey}-middle`} value={spouse.middleName || ""} disabled={readOnly} onChange={(e) => setSpouse({ middleName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-last`}>Last name</label>
          <input id={`${spouseKey}-last`} value={spouse.lastName || ""} disabled={readOnly} onChange={(e) => setSpouse({ lastName: e.target.value })} data-testid={`divorce-${spouseKey}-last`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-sex`}>Sex</label>
          <select id={`${spouseKey}-sex`} value={spouse.sex} disabled={readOnly} onChange={(e) => setSpouse({ sex: e.target.value as Sex })}>
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-dob`}>Date of birth</label>
          <input id={`${spouseKey}-dob`} type="date" value={spouse.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setSpouse({ dateOfBirth: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-nationality`}>Nationality</label>
          <input id={`${spouseKey}-nationality`} value={spouse.nationality || ""} disabled={readOnly} onChange={(e) => setSpouse({ nationality: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-phone`}>Phone</label>
          <input id={`${spouseKey}-phone`} value={spouse.phone || ""} disabled={readOnly} onChange={(e) => setSpouse({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-email`}>Email</label>
          <input id={`${spouseKey}-email`} type="email" value={spouse.email || ""} disabled={readOnly} onChange={(e) => setSpouse({ email: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseKey}-civil-status`}>Civil status currently on record</label>
          <select
            id={`${spouseKey}-civil-status`}
            value={spouse.currentCivilStatus || "MARRIED"}
            disabled={readOnly}
            onChange={(e) => setSpouse({ currentCivilStatus: e.target.value as FormerSpouse["currentCivilStatus"] })}
          >
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <span className="crvs-form-hint">Identity verification:</span>
        <StatusBadge kind="verification" status={spouse.identityVerification} />
        <span className="crvs-form-hint">Match confidence:</span>
        <span className={`crvs-status-pill crvs-status-${spouse.identityMatchConfidence === "CONFIRMED" ? "success" : spouse.identityMatchConfidence === "PROBABLE" ? "info" : "warning"}`}>
          {IDENTITY_MATCH_CONFIDENCE_LABELS[spouse.identityMatchConfidence]}
        </span>
        <span className="crvs-form-hint">Linked to the selected marriage:</span>
        <span className={`crvs-status-pill crvs-status-${spouse.linkedToSelectedMarriage ? "success" : "warning"}`}>{spouse.linkedToSelectedMarriage ? "Yes" : "Not linked"}</span>
      </div>

      {!spouse.linkedToSelectedMarriage && draft.existingMarriage.status === "MATCHED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          This person is not yet linked to the selected marriage record. A reviewer will treat that as a marriage-identity mismatch unless it is resolved.
        </div>
      )}

      <DivorceIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target={spouseKey === "SPOUSE1" ? "formerSpouse1" : "formerSpouse2"}
        targetLabel={label}
        onSearched={(updated) => onCaseSynced(updated)}
      />
    </div>
  );
}
