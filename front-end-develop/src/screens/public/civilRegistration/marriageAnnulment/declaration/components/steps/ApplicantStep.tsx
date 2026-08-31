import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import AnnulmentIdentityLookupModal, { AnnulmentIdentityMatch } from "../modals/AnnulmentIdentityLookupModal";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { requiresAuthorizationBasis } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentApplicant, AnnulmentApplicantRelationship, IdentityDocumentType } from "@/domain/crvs/types";
import { ANNULMENT_RELATIONSHIP_LABELS, DOCUMENT_TYPE_LABELS } from "../../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

const RELATIONSHIP_OPTIONS: AnnulmentApplicantRelationship[] = [
  "AFFECTED_PARTY_1",
  "AFFECTED_PARTY_2",
  "BOTH_AFFECTED_PARTIES",
  "INTERESTED_PERSON",
  "STAFF",
];

const RELATIONSHIP_TO_MARRIAGE_OPTIONS: NonNullable<AnnulmentApplicant["relationshipToMarriage"]>[] = ["PARTY_1", "PARTY_2", "NEITHER_PARTY"];

const RELATIONSHIP_TO_MARRIAGE_LABELS: Record<NonNullable<AnnulmentApplicant["relationshipToMarriage"]>, string> = {
  PARTY_1: "I am the first affected person",
  PARTY_2: "I am the second affected person",
  NEITHER_PARTY: "I am not one of the two affected people",
};

/** Wizard step 2 — the person submitting the request: their identity
 * document, name, date of birth, nationality, residence, contact details,
 * their relationship to the marriage AND to the annulment case as two
 * distinct fields (spec §11 Step 2), and — where policy requires it — the
 * authority under which they act for someone else. */
export default function ApplicantStep({ draft, onChange, onCaseSynced, onPersist, actorName, errors, readOnly }: AnnulmentWizardStepProps) {
  const [showLookup, setShowLookup] = useState(false);
  const applicant = draft.applicant;

  const setApplicant = (patch: Partial<AnnulmentApplicant>) => onChange({ applicant: { ...applicant, ...patch } });

  const needsAuthorization = requiresAuthorizationBasis(applicant.relationshipToCase);

  const resyncAfterSearch = async () => {
    const fresh = await demoGetAnnulmentRegistration(draft.id);
    if (fresh) onCaseSynced(fresh);
  };

  const handleOpenLookup = () => {
    // The identity search writes to the record and bumps its version, so
    // buffered edits must be flushed first or the next autosave conflicts.
    onPersist();
    setShowLookup(true);
  };

  const handleMatched = (match: AnnulmentIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
    setApplicant({
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      sdidIdentityId: match.identityId,
      documentType,
      documentNumber,
      nin: documentType === "NATIONAL_ID" ? documentNumber : applicant.nin,
      phone: applicant.phone || match.phoneNumber,
    });
    toastMessage("success", "Identity record linked. Check the details below and correct anything that is out of date.");
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">About you</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        These details identify the person making the request. They are used to confirm you are entitled to register this
        annulment and to contact you if a registrar needs anything else.
      </p>

      {!readOnly && (
        <Button
          text="Look up my identity record"
          appearance="ghost"
          startIcon="search"
          type="button"
          onClick={handleOpenLookup}
          testId="annulment-applicant-lookup"
        />
      )}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-relationship-marriage">Your relationship to the marriage</label>
          <select
            id="annulment-applicant-relationship-marriage"
            value={applicant.relationshipToMarriage || "NEITHER_PARTY"}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToMarriage: e.target.value as AnnulmentApplicant["relationshipToMarriage"] })}
            data-testid="annulment-applicant-relationship-marriage"
          >
            {RELATIONSHIP_TO_MARRIAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {RELATIONSHIP_TO_MARRIAGE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-relationship-case">Your relationship to this registration request</label>
          <select
            id="annulment-applicant-relationship-case"
            value={applicant.relationshipToCase}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToCase: e.target.value as AnnulmentApplicantRelationship })}
            data-testid="annulment-applicant-relationship-case"
          >
            {RELATIONSHIP_OPTIONS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {ANNULMENT_RELATIONSHIP_LABELS[relationship]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-document-type">Identity document type</label>
          <select
            id="annulment-applicant-document-type"
            value={applicant.documentType}
            disabled={readOnly}
            onChange={(e) => setApplicant({ documentType: e.target.value as IdentityDocumentType })}
            data-testid="annulment-applicant-document-type"
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-document-number">Document or NIN number</label>
          <input
            id="annulment-applicant-document-number"
            value={applicant.documentNumber || ""}
            disabled={readOnly || applicant.documentType === "NONE"}
            onChange={(e) =>
              setApplicant({
                documentNumber: e.target.value,
                nin: applicant.documentType === "NATIONAL_ID" ? e.target.value : applicant.nin,
              })
            }
            data-testid="annulment-applicant-document-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-first-name">First name</label>
          <input
            id="annulment-applicant-first-name"
            value={applicant.firstName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ firstName: e.target.value })}
            data-testid="annulment-applicant-first-name"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-middle-name">Middle name (optional)</label>
          <input
            id="annulment-applicant-middle-name"
            value={applicant.middleName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ middleName: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-last-name">Last name</label>
          <input
            id="annulment-applicant-last-name"
            value={applicant.lastName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ lastName: e.target.value })}
            data-testid="annulment-applicant-last-name"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-dob">Date of birth</label>
          <input
            id="annulment-applicant-dob"
            type="date"
            value={applicant.dateOfBirth?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ dateOfBirth: e.target.value })}
            data-testid="annulment-applicant-dob"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-nationality">Nationality</label>
          <input
            id="annulment-applicant-nationality"
            value={applicant.nationality || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ nationality: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-residence">Place of residence</label>
          <input
            id="annulment-applicant-residence"
            value={applicant.residence || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ residence: e.target.value })}
            data-testid="annulment-applicant-residence"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-phone">Phone number</label>
          <input
            id="annulment-applicant-phone"
            value={applicant.phone || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ phone: e.target.value })}
            data-testid="annulment-applicant-phone"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-applicant-email">Email address</label>
          <input
            id="annulment-applicant-email"
            type="email"
            value={applicant.email || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ email: e.target.value })}
            data-testid="annulment-applicant-email"
          />
        </div>
      </div>

      <p className="crvs-form-hint" style={{ marginTop: 4 }}>
        Give at least a phone number or an email address — correction requests and the outcome of this registration are
        sent to whichever you provide.
      </p>

      {needsAuthorization && (
        <div className="crvs-form-group" style={{ marginTop: 16 }}>
          <label htmlFor="annulment-applicant-authorization-basis">Authority under which you are submitting</label>
          <textarea
            id="annulment-applicant-authorization-basis"
            rows={3}
            value={applicant.authorizationBasis || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ authorizationBasis: e.target.value })}
            data-testid="annulment-applicant-authorization-basis"
          />
          <p className="crvs-form-hint">
            Because you are not one of the two affected people, describe what entitles you to act — for example a power
            of attorney, a court authorisation, or a formal instruction from one of them. You will also be asked to
            upload the supporting document.
          </p>
        </div>
      )}

      <div className="annulment-check-row" style={{ marginTop: 16 }}>
        <div className="annulment-check-row-label">
          <strong>Identity check on your details</strong>
          <p className="crvs-form-hint" style={{ margin: "4px 0 0" }}>
            A registrar re-checks this when the case is reviewed. An unverified result never blocks your submission.
          </p>
        </div>
        <StatusBadge kind="verification" status={applicant.identityVerification} />
      </div>

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16, alignItems: "flex-start" }}>
        <Icon name="shield" />
        <span>
          Your details are used only to process this registration. They are never shown on the public tracking page, and
          the other affected person is never shown your contact details.
        </span>
      </div>

      <AnnulmentIdentityLookupModal
        show={showLookup}
        onClose={() => setShowLookup(false)}
        registrationId={draft.id}
        target="applicant"
        subjectLabel="your"
        actorName={actorName}
        initialDocumentType={applicant.documentType}
        initialDocumentNumber={applicant.documentNumber}
        onMatched={handleMatched}
        onSearched={resyncAfterSearch}
      />
    </div>
  );
}
