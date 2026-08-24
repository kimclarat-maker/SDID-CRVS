import { useState } from "react";
import Button from "@/components/button";
import { WizardStepProps } from "../wizardTypes";
import { DeceasedPerson } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS } from "../../../deathShared";
import IdentityLookupModal from "../modals/IdentityLookupModal";
import IdentityAlreadyDeceasedModal from "../modals/IdentityAlreadyDeceasedModal";
import { getDemoData } from "@/demo/storage/demoStore";

/** Wizard step 2: deceased person — NIN/identity lookup, names/demographics,
 * DOB or estimated age, sex, nationality, residence, identity document, or
 * the "identity unknown" path (spec §5 step 3). */
export default function DeceasedStep({ draft, onChange, readOnly }: WizardStepProps) {
  const deceased = draft.deceased;
  const setDeceased = (patch: Partial<DeceasedPerson>) => onChange({ deceased: { ...deceased, ...patch } });

  const [showLookup, setShowLookup] = useState(false);
  const [showAlreadyDeceased, setShowAlreadyDeceased] = useState(false);

  const handleMatched = (match: { firstName: string; lastName: string; dob: string; nationality: string; identityId: string }) => {
    const existingIdentity = getDemoData().crvsFoundationalIdentities.find((f) => f.id === match.identityId);
    if (existingIdentity?.identityStatus === "DECEASED") {
      setShowAlreadyDeceased(true);
      return;
    }
    setDeceased({
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      sdidIdentityId: match.identityId,
      verification: "VERIFIED",
    });
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Deceased person</h2>

      {!readOnly && (
        <Button
          text="Look up by NIN or document number"
          appearance="ghost"
          startIcon="search"
          type="button"
          onClick={() => setShowLookup(true)}
          testId="wizard-lookup-deceased"
        />
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, margin: "12px 0" }}>
        <input
          type="checkbox"
          disabled={readOnly}
          checked={deceased.identityStatus === "IDENTITY_UNKNOWN"}
          onChange={(e) => setDeceased({ identityStatus: e.target.checked ? "IDENTITY_UNKNOWN" : "KNOWN" })}
          data-testid="wizard-identity-unknown"
        />
        Identity unknown — this is an unidentified deceased person
      </label>

      {deceased.identityStatus === "IDENTITY_UNKNOWN" ? (
        <div className="crvs-form-group">
          <label htmlFor="dec-summary">Descriptive physical summary</label>
          <textarea
            id="dec-summary"
            rows={3}
            disabled={readOnly}
            value={deceased.descriptivePhysicalSummary || ""}
            onChange={(e) => setDeceased({ descriptivePhysicalSummary: e.target.value })}
            placeholder="Approximate age, sex, physical description, distinguishing features, location found…"
          />
        </div>
      ) : (
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="dec-nin">National identification number (optional)</label>
            <input id="dec-nin" value={deceased.nin || ""} disabled={readOnly} onChange={(e) => setDeceased({ nin: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-first">First name</label>
            <input id="dec-first" value={deceased.firstName || ""} disabled={readOnly} onChange={(e) => setDeceased({ firstName: e.target.value })} data-testid="wizard-deceased-first" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-middle">Middle name</label>
            <input id="dec-middle" value={deceased.middleName || ""} disabled={readOnly} onChange={(e) => setDeceased({ middleName: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-last">Last name</label>
            <input id="dec-last" value={deceased.lastName || ""} disabled={readOnly} onChange={(e) => setDeceased({ lastName: e.target.value })} data-testid="wizard-deceased-last" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-sex">Sex</label>
            <select id="dec-sex" value={deceased.sex} disabled={readOnly} onChange={(e) => setDeceased({ sex: e.target.value as DeceasedPerson["sex"] })}>
              <option value="UNKNOWN">Unknown</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-dob">Date of birth</label>
            <input id="dec-dob" type="date" value={deceased.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setDeceased({ dateOfBirth: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-age">Estimated age (if DOB unknown)</label>
            <input id="dec-age" type="number" min={0} value={deceased.estimatedAge ?? ""} disabled={readOnly} onChange={(e) => setDeceased({ estimatedAge: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-nationality">Nationality</label>
            <input id="dec-nationality" value={deceased.nationality || ""} disabled={readOnly} onChange={(e) => setDeceased({ nationality: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-residence">Residence</label>
            <input id="dec-residence" value={deceased.residence || ""} disabled={readOnly} onChange={(e) => setDeceased({ residence: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-doctype">Identity document type</label>
            <select id="dec-doctype" value={deceased.documentType || "NONE"} disabled={readOnly} onChange={(e) => setDeceased({ documentType: e.target.value as DeceasedPerson["documentType"] })}>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="dec-docnum">Document number</label>
            <input id="dec-docnum" value={deceased.documentNumber || ""} disabled={readOnly} onChange={(e) => setDeceased({ documentNumber: e.target.value })} />
          </div>
        </div>
      )}

      <IdentityLookupModal show={showLookup} onClose={() => setShowLookup(false)} onMatched={handleMatched} />
      <IdentityAlreadyDeceasedModal show={showAlreadyDeceased} onClose={() => setShowAlreadyDeceased(false)} />
    </div>
  );
}
