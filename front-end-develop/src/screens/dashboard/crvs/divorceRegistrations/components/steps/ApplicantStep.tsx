import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../../components/StatusBadge";
import DivorceIdentityLookupModal from "../modals/DivorceIdentityLookupModal";
import { DivorceWizardStepProps } from "../wizardTypes";
import { DivorceApplicant, DivorceApplicantRelationship, IdentityDocumentType } from "@/domain/crvs/types";
import { requiresAuthorizationBasis } from "@/domain/crvs/divorcePolicyConfig";
import { DIVORCE_APPLICANT_RELATIONSHIP_LABELS, DOCUMENT_TYPE_LABELS } from "../../../divorceShared";

/** Wizard step 1 (spec §3): who is asking for this divorce to be registered,
 * and — when they are not one of the former spouses — on what authority.
 * Whether an authorization basis is required is read from
 * divorcePolicyConfig.permittedDeclarants, never hardcoded here. */
export default function ApplicantStep({ draft, onChange, onCaseSynced, readOnly }: DivorceWizardStepProps) {
  const applicant = draft.applicant;
  const [showLookup, setShowLookup] = useState(false);

  const setApplicant = (patch: Partial<DivorceApplicant>) => onChange({ applicant: { ...applicant, ...patch } });
  const authorizationRequired = requiresAuthorizationBasis(applicant.relationshipToCase);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Applicant and authority</h2>
      <p className="crvs-form-hint">
        This module registers a divorce a court has already granted. It never collects grounds, custody, maintenance or property-division details.
      </p>

      {!readOnly && <Button text="Look up identity" appearance="ghost" startIcon="search" type="button" onClick={() => setShowLookup(true)} testId="divorce-wizard-lookup-applicant" />}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-relationship">Relationship to this case</label>
          <select
            id="divorce-applicant-relationship"
            value={applicant.relationshipToCase}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToCase: e.target.value as DivorceApplicantRelationship })}
            data-testid="divorce-applicant-relationship"
          >
            {(Object.keys(DIVORCE_APPLICANT_RELATIONSHIP_LABELS) as DivorceApplicantRelationship[]).map((key) => (
              <option key={key} value={key}>
                {DIVORCE_APPLICANT_RELATIONSHIP_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-doctype">Identity document type</label>
          <select id="divorce-applicant-doctype" value={applicant.documentType} disabled={readOnly} onChange={(e) => setApplicant({ documentType: e.target.value as IdentityDocumentType })}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-docnum">Document / NIN number</label>
          <input
            id="divorce-applicant-docnum"
            value={applicant.documentNumber || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ documentNumber: e.target.value, nin: applicant.documentType === "NATIONAL_ID" ? e.target.value : applicant.nin })}
            data-testid="divorce-applicant-docnum"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-first">First name</label>
          <input id="divorce-applicant-first" value={applicant.firstName || ""} disabled={readOnly} onChange={(e) => setApplicant({ firstName: e.target.value })} data-testid="divorce-applicant-first" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-middle">Middle name</label>
          <input id="divorce-applicant-middle" value={applicant.middleName || ""} disabled={readOnly} onChange={(e) => setApplicant({ middleName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-last">Last name</label>
          <input id="divorce-applicant-last" value={applicant.lastName || ""} disabled={readOnly} onChange={(e) => setApplicant({ lastName: e.target.value })} data-testid="divorce-applicant-last" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-dob">Date of birth</label>
          <input id="divorce-applicant-dob" type="date" value={applicant.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setApplicant({ dateOfBirth: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-nationality">Nationality</label>
          <input id="divorce-applicant-nationality" value={applicant.nationality || ""} disabled={readOnly} onChange={(e) => setApplicant({ nationality: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-residence">Residence</label>
          <input id="divorce-applicant-residence" value={applicant.residence || ""} disabled={readOnly} onChange={(e) => setApplicant({ residence: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-phone">Phone</label>
          <input id="divorce-applicant-phone" value={applicant.phone || ""} disabled={readOnly} onChange={(e) => setApplicant({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-email">Email</label>
          <input id="divorce-applicant-email" type="email" value={applicant.email || ""} disabled={readOnly} onChange={(e) => setApplicant({ email: e.target.value })} />
        </div>
      </div>

      {authorizationRequired && (
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="divorce-applicant-authorization">Authorization basis</label>
          <textarea
            id="divorce-applicant-authorization"
            rows={3}
            value={applicant.authorizationBasis || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ authorizationBasis: e.target.value })}
            data-testid="divorce-applicant-authorization"
          />
          <p className="crvs-form-hint">
            <Icon name="info" /> An applicant who is not one of the former spouses must record the authority under which they are submitting this request.
          </p>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="crvs-form-hint">Identity verification:</span>
        <StatusBadge kind="verification" status={applicant.identityVerification} />
      </div>

      <DivorceIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target="applicant"
        targetLabel="the applicant"
        onSearched={(updated) => onCaseSynced(updated)}
      />
    </div>
  );
}
