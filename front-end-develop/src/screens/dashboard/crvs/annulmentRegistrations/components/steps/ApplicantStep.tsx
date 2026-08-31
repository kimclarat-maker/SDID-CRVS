import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../../components/StatusBadge";
import AnnulmentIdentityLookupModal from "../modals/AnnulmentIdentityLookupModal";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import { AnnulmentApplicant, AnnulmentApplicantRelationship, IdentityDocumentType } from "@/domain/crvs/types";
import { requiresAuthorizationBasis } from "@/domain/crvs/annulmentPolicyConfig";
import { ANNULMENT_APPLICANT_RELATIONSHIP_LABELS, DOCUMENT_TYPE_LABELS } from "../../../annulmentShared";

/** Wizard step 1 (spec §11 Step 2): who is asking for this annulment to be
 * registered, and — when they are not one of the two affected parties — on
 * what authority. Whether an authorization basis is required is read from
 * annulmentPolicyConfig.permittedApplicants, never hardcoded here. */
export default function ApplicantStep({ draft, onChange, onCaseSynced, readOnly }: AnnulmentWizardStepProps) {
  const applicant = draft.applicant;
  const [showLookup, setShowLookup] = useState(false);

  const setApplicant = (patch: Partial<AnnulmentApplicant>) => onChange({ applicant: { ...applicant, ...patch } });
  const authorizationRequired = requiresAuthorizationBasis(applicant.relationshipToCase);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Applicant and authority</h2>
      <p className="crvs-form-hint">
        This module registers an annulment a competent court or legally recognized authority has already decided. It never starts proceedings, evaluates grounds, or decides whether a marriage was void or
        voidable itself.
      </p>

      {!readOnly && <Button text="Look up identity" appearance="ghost" startIcon="search" type="button" onClick={() => setShowLookup(true)} testId="annulment-wizard-lookup-applicant" />}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-relationship">Relationship to this case</label>
          <select
            id="annulment-applicant-relationship"
            value={applicant.relationshipToCase}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToCase: e.target.value as AnnulmentApplicantRelationship })}
            data-testid="annulment-applicant-relationship"
          >
            {(Object.keys(ANNULMENT_APPLICANT_RELATIONSHIP_LABELS) as AnnulmentApplicantRelationship[]).map((key) => (
              <option key={key} value={key}>
                {ANNULMENT_APPLICANT_RELATIONSHIP_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-relationship-marriage">Relationship to the marriage</label>
          <select
            id="annulment-applicant-relationship-marriage"
            value={applicant.relationshipToMarriage || "NEITHER_PARTY"}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToMarriage: e.target.value as AnnulmentApplicant["relationshipToMarriage"] })}
            data-testid="annulment-applicant-relationship-marriage"
          >
            <option value="PARTY_1">Affected party 1</option>
            <option value="PARTY_2">Affected party 2</option>
            <option value="NEITHER_PARTY">Neither party</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-doctype">Identity document type</label>
          <select id="annulment-applicant-doctype" value={applicant.documentType} disabled={readOnly} onChange={(e) => setApplicant({ documentType: e.target.value as IdentityDocumentType })}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-docnum">Document / NIN number</label>
          <input
            id="annulment-applicant-docnum"
            value={applicant.documentNumber || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ documentNumber: e.target.value, nin: applicant.documentType === "NATIONAL_ID" ? e.target.value : applicant.nin })}
            data-testid="annulment-applicant-docnum"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-first">First name</label>
          <input id="annulment-applicant-first" value={applicant.firstName || ""} disabled={readOnly} onChange={(e) => setApplicant({ firstName: e.target.value })} data-testid="annulment-applicant-first" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-middle">Middle name</label>
          <input id="annulment-applicant-middle" value={applicant.middleName || ""} disabled={readOnly} onChange={(e) => setApplicant({ middleName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-last">Last name</label>
          <input id="annulment-applicant-last" value={applicant.lastName || ""} disabled={readOnly} onChange={(e) => setApplicant({ lastName: e.target.value })} data-testid="annulment-applicant-last" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-dob">Date of birth</label>
          <input id="annulment-applicant-dob" type="date" value={applicant.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setApplicant({ dateOfBirth: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-nationality">Nationality</label>
          <input id="annulment-applicant-nationality" value={applicant.nationality || ""} disabled={readOnly} onChange={(e) => setApplicant({ nationality: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-residence">Residence</label>
          <input id="annulment-applicant-residence" value={applicant.residence || ""} disabled={readOnly} onChange={(e) => setApplicant({ residence: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-phone">Phone</label>
          <input id="annulment-applicant-phone" value={applicant.phone || ""} disabled={readOnly} onChange={(e) => setApplicant({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-email">Email</label>
          <input id="annulment-applicant-email" type="email" value={applicant.email || ""} disabled={readOnly} onChange={(e) => setApplicant({ email: e.target.value })} />
        </div>
      </div>

      {authorizationRequired && (
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="annulment-applicant-authorization">Authorization basis</label>
          <textarea
            id="annulment-applicant-authorization"
            rows={3}
            value={applicant.authorizationBasis || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ authorizationBasis: e.target.value })}
            data-testid="annulment-applicant-authorization"
          />
          <p className="crvs-form-hint">
            <Icon name="info" /> An applicant who is not one of the two affected parties must record the authority under which they are submitting this request.
          </p>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="crvs-form-hint">Identity verification:</span>
        <StatusBadge kind="verification" status={applicant.identityVerification} />
      </div>

      <AnnulmentIdentityLookupModal show={showLookup} onClose={() => setShowLookup(false)} registrationId={draft.id} target="applicant" targetLabel="the applicant" onSearched={(updated) => onCaseSynced(updated)} />
    </div>
  );
}
