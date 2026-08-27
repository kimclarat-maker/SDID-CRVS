import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "@/screens/dashboard/crvs/components/StatusBadge";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import DivorceIdentityLookupModal, { DivorceIdentityMatch } from "../modals/DivorceIdentityLookupModal";
import { demoGetDivorceRegistration } from "@/demo/services/crvsDivorceRegistrations";
import { requiresAuthorizationBasis } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceApplicant, DivorceApplicantRelationship, IdentityDocumentType } from "@/domain/crvs/types";
import { DIVORCE_RELATIONSHIP_LABELS, DOCUMENT_TYPE_LABELS } from "../../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

const RELATIONSHIP_OPTIONS: DivorceApplicantRelationship[] = [
  "FORMER_SPOUSE_1",
  "FORMER_SPOUSE_2",
  "BOTH_FORMER_SPOUSES",
  "INTERESTED_PERSON",
  "STAFF",
];

/** Wizard step 2 — the person submitting the request: their identity
 * document, name, date of birth, nationality, residence, contact details,
 * their relationship to the divorce, and (where policy requires it) the
 * authority under which they act for someone else. */
export default function ApplicantStep({ draft, onChange, onCaseSynced, onPersist, actorName, errors, readOnly }: DivorceWizardStepProps) {
  const [showLookup, setShowLookup] = useState(false);
  const applicant = draft.applicant;

  const setApplicant = (patch: Partial<DivorceApplicant>) => onChange({ applicant: { ...applicant, ...patch } });

  const needsAuthorization = requiresAuthorizationBasis(applicant.relationshipToCase);

  const resyncAfterSearch = async () => {
    const fresh = await demoGetDivorceRegistration(draft.id);
    if (fresh) onCaseSynced(fresh);
  };

  const handleOpenLookup = () => {
    // The identity search writes to the record and bumps its version, so
    // buffered edits must be flushed first or the next autosave conflicts.
    onPersist();
    setShowLookup(true);
  };

  const handleMatched = (match: DivorceIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => {
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
        divorce and to contact you if a registrar needs anything else.
      </p>

      {!readOnly && (
        <Button
          text="Look up my identity record"
          appearance="ghost"
          startIcon="search"
          type="button"
          onClick={handleOpenLookup}
          testId="divorce-applicant-lookup"
        />
      )}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-relationship">Your relationship to this divorce</label>
          <select
            id="divorce-applicant-relationship"
            value={applicant.relationshipToCase}
            disabled={readOnly}
            onChange={(e) => setApplicant({ relationshipToCase: e.target.value as DivorceApplicantRelationship })}
            data-testid="divorce-applicant-relationship"
          >
            {RELATIONSHIP_OPTIONS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {DIVORCE_RELATIONSHIP_LABELS[relationship]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-document-type">Identity document type</label>
          <select
            id="divorce-applicant-document-type"
            value={applicant.documentType}
            disabled={readOnly}
            onChange={(e) => setApplicant({ documentType: e.target.value as IdentityDocumentType })}
            data-testid="divorce-applicant-document-type"
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-document-number">Document or NIN number</label>
          <input
            id="divorce-applicant-document-number"
            value={applicant.documentNumber || ""}
            disabled={readOnly || applicant.documentType === "NONE"}
            onChange={(e) =>
              setApplicant({
                documentNumber: e.target.value,
                nin: applicant.documentType === "NATIONAL_ID" ? e.target.value : applicant.nin,
              })
            }
            data-testid="divorce-applicant-document-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-first-name">First name</label>
          <input
            id="divorce-applicant-first-name"
            value={applicant.firstName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ firstName: e.target.value })}
            data-testid="divorce-applicant-first-name"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-middle-name">Middle name (optional)</label>
          <input
            id="divorce-applicant-middle-name"
            value={applicant.middleName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ middleName: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-last-name">Last name</label>
          <input
            id="divorce-applicant-last-name"
            value={applicant.lastName || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ lastName: e.target.value })}
            data-testid="divorce-applicant-last-name"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-dob">Date of birth</label>
          <input
            id="divorce-applicant-dob"
            type="date"
            value={applicant.dateOfBirth?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ dateOfBirth: e.target.value })}
            data-testid="divorce-applicant-dob"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-nationality">Nationality</label>
          <input
            id="divorce-applicant-nationality"
            value={applicant.nationality || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ nationality: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-residence">Place of residence</label>
          <input
            id="divorce-applicant-residence"
            value={applicant.residence || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ residence: e.target.value })}
            data-testid="divorce-applicant-residence"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-phone">Phone number</label>
          <input
            id="divorce-applicant-phone"
            value={applicant.phone || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ phone: e.target.value })}
            data-testid="divorce-applicant-phone"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-applicant-email">Email address</label>
          <input
            id="divorce-applicant-email"
            type="email"
            value={applicant.email || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ email: e.target.value })}
            data-testid="divorce-applicant-email"
          />
        </div>
      </div>

      <p className="crvs-form-hint" style={{ marginTop: 4 }}>
        Give at least a phone number or an email address — correction requests and the outcome of this registration are
        sent to whichever you provide.
      </p>

      {needsAuthorization && (
        <div className="crvs-form-group" style={{ marginTop: 16 }}>
          <label htmlFor="divorce-applicant-authorization-basis">Authority under which you are submitting</label>
          <textarea
            id="divorce-applicant-authorization-basis"
            rows={3}
            value={applicant.authorizationBasis || ""}
            disabled={readOnly}
            onChange={(e) => setApplicant({ authorizationBasis: e.target.value })}
            data-testid="divorce-applicant-authorization-basis"
          />
          <p className="crvs-form-hint">
            Because you are not one of the former spouses, describe what entitles you to act — for example a power of
            attorney, a court authorisation, or a formal instruction from the former spouse. You will also be asked to
            upload the supporting document.
          </p>
        </div>
      )}

      <div className="divorce-check-row" style={{ marginTop: 16 }}>
        <div className="divorce-check-row-label">
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
          the other former spouse is never shown your contact details.
        </span>
      </div>

      <DivorceIdentityLookupModal
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
