import { useState } from "react";
import WizardShell, { WizardStep } from "../../components/WizardShell";
import Button from "@/components/button";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import IdentityVerificationModal from "@/components/crvs/certificateModals/IdentityVerificationModal";
import RecordFoundModal from "@/components/crvs/certificateModals/RecordFoundModal";
import RecordNotFoundModal from "@/components/crvs/certificateModals/RecordNotFoundModal";
import MultipleMatchesModal from "@/components/crvs/certificateModals/MultipleMatchesModal";
import RelationshipVerificationModal from "@/components/crvs/certificateModals/RelationshipVerificationModal";
import {
  demoLookupBirthRecord,
  demoSubmitCertificateRequest,
  demoUpdateCertificateRequestDraft,
  demoCancelCertificateRequest,
} from "@/demo/services/crvsCertificates";
import {
  BirthCertificateRequest,
  CertificateDeliveryMethod,
  CertificatePurpose,
  CertificateRequestChannel,
} from "@/domain/crvs/types";
import { formatMoney, fullName, humanizeEnum } from "../utils";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

const STEPS: WizardStep[] = [
  { key: "requester", label: "Requester" },
  { key: "lookup", label: "Birth-record lookup" },
  { key: "purpose", label: "Purpose" },
  { key: "delivery", label: "Delivery" },
  { key: "review", label: "Review" },
  { key: "submit", label: "Submit" },
];

const PURPOSES: { value: CertificatePurpose; label: string }[] = [
  { value: "GENERAL_PROOF", label: "General proof of identity/age" },
  { value: "EDUCATION", label: "Education / school enrolment" },
  { value: "HEALTH_SERVICE", label: "Health service" },
  { value: "TRAVEL", label: "Travel" },
  { value: "LEGAL_PROCESS", label: "Legal process" },
  { value: "REPLACEMENT", label: "Replacement of a lost/damaged certificate" },
  { value: "OTHER", label: "Other" },
];

const DELIVERY_METHODS: { value: CertificateDeliveryMethod; label: string; description: string }[] = [
  { value: "SECURE_DOWNLOAD", label: "Secure download", description: "Download the demo certificate immediately once issued." },
  { value: "EMAIL", label: "Email", description: "A demo download link is sent to your verified email." },
  { value: "SMS_LINK", label: "SMS download link", description: "A demo download link is sent to your verified phone." },
  { value: "ASSISTED_CENTRE_COLLECTION", label: "Assisted-centre collection", description: "Collect the certificate at a service centre." },
];

export default function CertificateRequestWizard({
  channel,
  request,
  onRequestChange,
  actorName,
  onExit,
  onSubmitted,
}: {
  channel: CertificateRequestChannel;
  request: BirthCertificateRequest;
  onRequestChange: (request: BirthCertificateRequest) => void;
  actorName: string;
  onExit: () => void;
  onSubmitted: (request: BirthCertificateRequest) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [autosave, setAutosave] = useState<"idle" | "saving" | "saved">("idle");

  const [identifierType, setIdentifierType] = useState<"NIN" | "CITIZEN_APPLICATION_NUMBER" | "BIRTH_RECORD_NUMBER">("BIRTH_RECORD_NUMBER");
  const [identifierValue, setIdentifierValue] = useState("");
  const [subjectDob, setSubjectDob] = useState("");
  const [relationship, setRelationship] = useState(request.requester.relationshipToSubject || "");
  const [searching, setSearching] = useState(false);

  const [showVerify, setShowVerify] = useState(false);
  const [showFound, setShowFound] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showMultiple, setShowMultiple] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitResult, setSubmitResult] = useState<BirthCertificateRequest | undefined>();

  const goTo = (index: number) => {
    if (index > furthest) return;
    setStepIndex(index);
  };

  const save = (patch: Partial<BirthCertificateRequest>) => {
    setAutosave("saving");
    const updated = demoUpdateCertificateRequestDraft(request.id, patch, actorName);
    onRequestChange(updated);
    setAutosave("saved");
    return updated;
  };

  const advance = () => {
    const next = Math.min(stepIndex + 1, STEPS.length - 1);
    setStepIndex(next);
    setFurthest((f) => Math.max(f, next));
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const { outcome, request: updated } = demoLookupBirthRecord(
        request.id,
        { identifierType, identifierValue, dateOfBirth: subjectDob || undefined, relationship: relationship || undefined },
        actorName
      );
      onRequestChange(updated);
      if (outcome === "FOUND") setShowFound(true);
      else if (outcome === "NOT_FOUND") setShowNotFound(true);
      else if (outcome === "MULTIPLE_MATCHES") setShowMultiple(true);
      else if (outcome === "RESTRICTED") toastMessage("info", "This record needs manual review before a certificate can be issued.");
      else if (outcome === "RELATIONSHIP_REQUIRED") setShowRelationship(true);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const updated = demoSubmitCertificateRequest(request.id, actorName);
      onRequestChange(updated);
      setSubmitResult(updated);
      onSubmitted(updated);
    } catch (err) {
      toastMessage("error", err);
      throw err;
    }
  };

  const requesterVerified = request.requester.verificationStatus === "VERIFIED";
  const recordMatched = !!request.subject.birthRecordId;

  return (
    <div className="crvs-page">
      <WizardShell
        steps={STEPS}
        currentStepIndex={stepIndex}
        furthestStepIndex={furthest}
        onStepClick={goTo}
        autosaveState={autosave}
        summary={
          <div>
            <h4>Summary</h4>
            <dl className="review-readonly-fields">
              <div>
                <dt>Reference</dt>
                <dd>{request.applicationReference}</dd>
              </div>
              <div>
                <dt>Requester</dt>
                <dd>{fullName(request.requester.firstName, undefined, request.requester.lastName)}</dd>
              </div>
              {recordMatched && (
                <div>
                  <dt>Subject</dt>
                  <dd>{fullName(request.subject.firstName, undefined, request.subject.lastName)}</dd>
                </div>
              )}
              <div>
                <dt>Fee</dt>
                <dd>{formatMoney(request.payment.amount, request.payment.currency)}</dd>
              </div>
            </dl>
          </div>
        }
        actions={
          <>
            <Button text="Cancel request" appearance="ghost" color="red" onClick={() => setShowCancel(true)} testId="wizard-cancel" />
            {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
              <Button text="Back" appearance="ghost" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} testId="wizard-back" />
            )}
            {stepIndex < STEPS.length - 2 && (
              <Button
                text="Continue"
                appearance="primary"
                disabled={(stepIndex === 0 && !requesterVerified) || (stepIndex === 1 && !recordMatched)}
                onClick={advance}
                testId="wizard-continue"
              />
            )}
            {stepIndex === STEPS.length - 2 && (
              <Button text="Continue to submit" appearance="primary" onClick={advance} testId="wizard-continue-to-submit" />
            )}
          </>
        }
      >
        {stepIndex === 0 && (
          <section>
            <h2>Requester</h2>
            <dl className="review-readonly-fields">
              <div>
                <dt>Type</dt>
                <dd>{humanizeEnum(request.requester.requesterType)}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{fullName(request.requester.firstName, undefined, request.requester.lastName)}</dd>
              </div>
              <div>
                <dt>Document</dt>
                <dd>{humanizeEnum(request.requester.documentType)} · {request.requester.documentNumberMasked}</dd>
              </div>
              <div>
                <dt>Verification status</dt>
                <dd>{humanizeEnum(request.requester.verificationStatus)}</dd>
              </div>
            </dl>
            {!requesterVerified && (
              <Button text="Verify requester" appearance="primary" onClick={() => setShowVerify(true)} testId="wizard-verify-requester" />
            )}
            {requesterVerified && <p className="crvs-banner crvs-banner-success">Requester identity verified.</p>}
          </section>
        )}

        {stepIndex === 1 && (
          <section>
            <h2>Birth-record lookup</h2>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label htmlFor="identifier-type">Identifier type</label>
                <select id="identifier-type" value={identifierType} onChange={(e) => setIdentifierType(e.target.value as typeof identifierType)}>
                  <option value="BIRTH_RECORD_NUMBER">Birth-record number</option>
                  <option value="NIN">NIN</option>
                  <option value="CITIZEN_APPLICATION_NUMBER">Citizen application number</option>
                </select>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="identifier-value">Value</label>
                <input id="identifier-value" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} data-testid="lookup-identifier-value" />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="subject-dob">Subject date of birth</label>
                <input id="subject-dob" type="date" value={subjectDob} onChange={(e) => setSubjectDob(e.target.value)} />
              </div>
              {request.requester.requesterType !== "SELF" && (
                <div className="crvs-form-group">
                  <label htmlFor="relationship">Relationship to subject</label>
                  <input id="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} data-testid="lookup-relationship" />
                </div>
              )}
            </div>
            <Button text="Search" appearance="primary" loading={searching} onClick={handleSearch} testId="wizard-search-record" />
            {recordMatched && (
              <p className="crvs-banner crvs-banner-success" style={{ marginTop: 12 }}>
                Matched {request.subject.birthRecordNumber} — {fullName(request.subject.firstName, undefined, request.subject.lastName)}.
              </p>
            )}
          </section>
        )}

        {stepIndex === 2 && (
          <section>
            <h2>Purpose</h2>
            <div className="crvs-form-group">
              <label htmlFor="purpose-select">Purpose</label>
              <select
                id="purpose-select"
                value={request.purpose}
                onChange={(e) => save({ purpose: e.target.value as CertificatePurpose })}
              >
                {PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {request.purpose === "OTHER" && (
              <div className="crvs-form-group">
                <label htmlFor="purpose-description">Details</label>
                <textarea
                  id="purpose-description"
                  rows={2}
                  value={request.purposeDescription || ""}
                  onChange={(e) => save({ purposeDescription: e.target.value })}
                />
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={!!request.replacementIndicator}
                onChange={(e) => save({ replacementIndicator: e.target.checked })}
              />
              This is a replacement for an existing certificate
            </label>
            {request.replacementIndicator && (
              <div className="crvs-form-group">
                <label htmlFor="replaced-number">Existing certificate number</label>
                <input
                  id="replaced-number"
                  value={request.replacedCertificateNumber || ""}
                  onChange={(e) => save({ replacedCertificateNumber: e.target.value })}
                />
              </div>
            )}
          </section>
        )}

        {stepIndex === 3 && (
          <section>
            <h2>Delivery</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DELIVERY_METHODS.map((m) => (
                <label key={m.value} className="crvs-case-card" style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="delivery-method"
                    checked={request.delivery.method === m.value}
                    onChange={() => save({ delivery: { ...request.delivery, method: m.value } })}
                  />
                  <span>
                    <strong>{m.label}</strong>
                    <p className="crvs-form-hint" style={{ margin: 0 }}>{m.description}</p>
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {stepIndex === 4 && (
          <section>
            <h2>Review</h2>
            <dl className="review-readonly-fields">
              <div>
                <dt>Requester</dt>
                <dd>{fullName(request.requester.firstName, undefined, request.requester.lastName)} ({humanizeEnum(request.requester.requesterType)})</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{fullName(request.subject.firstName, undefined, request.subject.lastName)} — {request.subject.birthRecordNumber}</dd>
              </div>
              <div>
                <dt>Purpose</dt>
                <dd>{humanizeEnum(request.purpose)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{humanizeEnum(request.delivery.method)}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{formatMoney(request.payment.amount, request.payment.currency)}</dd>
              </div>
            </dl>
            <p className="crvs-banner crvs-banner-info">
              Your information is used only to verify and process this certificate request, consistent with the
              platform's privacy notice.
            </p>
          </section>
        )}

        {stepIndex === 5 && (
          <section>
            <h2>Submit</h2>
            {!submitResult ? (
              <Button text="Submit request" appearance="primary" onClick={() => setShowSubmitConfirm(true)} testId="wizard-submit" />
            ) : (
              <div className="crvs-banner crvs-banner-success">
                <p>
                  <strong>{submitResult.applicationReference}</strong> submitted. Status: {humanizeEnum(submitResult.status)}.
                </p>
                {submitResult.payment.billingReference && <p>Billing reference: {submitResult.payment.billingReference}</p>}
              </div>
            )}
          </section>
        )}
      </WizardShell>

      <IdentityVerificationModal show={showVerify} onClose={() => setShowVerify(false)} request={request} actorName={actorName} onVerified={onRequestChange} />
      <RecordFoundModal
        show={showFound}
        onClose={() => setShowFound(false)}
        request={request}
        onConfirm={() => setShowFound(false)}
        onSearchAgain={() => {
          setShowFound(false);
          save({ subject: { birthRecordId: "", birthRecordNumber: "", dateOfBirth: "", placeOfBirthSummary: "" } });
        }}
      />
      <RecordNotFoundModal show={showNotFound} onClose={() => setShowNotFound(false)} onSearchAgain={() => setShowNotFound(false)} />
      <MultipleMatchesModal show={showMultiple} onClose={() => setShowMultiple(false)} onSearchAgain={() => setShowMultiple(false)} />
      <RelationshipVerificationModal
        show={showRelationship}
        onClose={() => setShowRelationship(false)}
        onSubmit={(rel) => {
          setRelationship(rel);
          setShowRelationship(false);
          handleSearch();
        }}
      />

      <ConfirmActionModal
        show={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={async () => {
          demoCancelCertificateRequest(request.id, "Cancelled by requester before payment/issuance.", actorName);
          onExit();
        }}
        title="Cancel this request?"
        description={request.applicationReference}
        confirmLabel="Cancel request"
        destructive
        testId="wizard-cancel-modal"
      >
        <p>Cancellation is only available before payment or issuance. This cannot be undone.</p>
      </ConfirmActionModal>

      <ConfirmActionModal
        show={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit certificate request"
        description={`Fee: ${formatMoney(request.payment.amount, request.payment.currency)} · Delivery: ${humanizeEnum(request.delivery.method)}`}
        confirmLabel="Confirm & submit"
        testId="wizard-submit-confirm-modal"
      >
        <p>By submitting, you confirm the information provided is accurate.</p>
      </ConfirmActionModal>
    </div>
  );
}
