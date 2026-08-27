import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import DivorceEvidenceUploadModal from "../modals/DivorceEvidenceUploadModal";
import { demoSearchExistingMarriages, demoSelectExistingMarriage, demoMarkExistingMarriageNotFound } from "@/demo/services/crvsDivorceMarriageSearch";
import { demoAttachDivorceEvidence } from "@/demo/services/crvsDivorceEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { ExistingMarriageCandidate, ExistingMarriageSearchCriteria } from "@/domain/crvs/types";
import { divorceDocumentLabel, EXISTING_MARRIAGE_STATUS_LABELS, formatDate } from "../../../divorceShared";
import toastMessage from "@/utils/common/toastMessage";

const MARRIAGE_DOCUMENT_TYPE = "MARRIAGE_CERTIFICATE_OR_RECORD";

/** Wizard step 3 — find the registered marriage this divorce ends.
 *
 * The applicant must select a real registry record before continuing. If no
 * record can be found, the case is routed to the MARRIAGE_RECORD_NOT_FOUND
 * exception and the applicant uploads their marriage certificate instead —
 * the wizard never fabricates a match, and never dead-ends the applicant
 * either (spec §3 Step 3, §10).
 */
export default function ExistingMarriageStep({ draft, onCaseSynced, onPersist, actorName, errors, readOnly }: DivorceWizardStepProps) {
  const [criteria, setCriteria] = useState<ExistingMarriageSearchCriteria>(draft.existingMarriage.searchCriteria || {});
  const [candidates, setCandidates] = useState<ExistingMarriageCandidate[]>(draft.existingMarriage.candidates);
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH" | undefined>();
  const [searched, setSearched] = useState(draft.existingMarriage.status !== "NOT_SEARCHED");
  const [searching, setSearching] = useState(false);
  const [showNotFoundConfirm, setShowNotFoundConfirm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState(false);

  const selected = draft.existingMarriage.selected;
  const notFound = draft.existingMarriage.status === "NOT_FOUND";
  const marriageEvidence = draft.evidence.filter((e) => !e.removed && e.documentType === MARRIAGE_DOCUMENT_TYPE);

  const setCriteriaField = (patch: Partial<ExistingMarriageSearchCriteria>) => setCriteria((prev) => ({ ...prev, ...patch }));

  const hasAnyCriteria = Object.values(criteria).some((value) => !!value && value.trim().length > 0);

  const handleSearch = async () => {
    if (!hasAnyCriteria) {
      toastMessage("error", "Enter at least one detail about the marriage before searching.");
      return;
    }
    setSearching(true);
    try {
      const result = await demoSearchExistingMarriages(criteria);
      setCandidates(result.candidates);
      setConfidence(result.confidence);
      setSearched(true);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (candidate: ExistingMarriageCandidate) => {
    onPersist();
    try {
      const updated = demoSelectExistingMarriage(draft.id, candidate, actorName);
      onCaseSynced(updated);
      toastMessage("success", `Marriage ${candidate.registrationNumber} linked to this registration request.`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleMarkNotFound = async () => {
    onPersist();
    const updated = demoMarkExistingMarriageNotFound(draft.id, actorName, criteria);
    onCaseSynced(updated);
    setShowNotFoundConfirm(false);
    toastMessage("success", "Recorded. Upload your marriage certificate so a registrar can locate the record manually.");
  };

  const handleUpload = async (input: AttachEvidenceInput) => {
    setBusy(true);
    try {
      onPersist();
      const updated = demoAttachDivorceEvidence(draft.id, input, actorName);
      onCaseSynced(updated);
      toastMessage("success", "Document uploaded.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">The marriage this divorce ends</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        A divorce can only be registered against a marriage that is already on the registry. Search using whatever you
        have — the marriage registration or certificate number finds it fastest, but either spouse's national ID number,
        or the names, date and place of the marriage, also work.
      </p>

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-registration-number">Marriage registration number</label>
          <input
            id="divorce-marriage-search-registration-number"
            value={criteria.marriageRegistrationNumber || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ marriageRegistrationNumber: e.target.value })}
            data-testid="divorce-marriage-search-registration-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-certificate-number">Marriage certificate number</label>
          <input
            id="divorce-marriage-search-certificate-number"
            value={criteria.marriageCertificateNumber || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ marriageCertificateNumber: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-spouse1-nin">Former spouse 1 national ID</label>
          <input
            id="divorce-marriage-search-spouse1-nin"
            value={criteria.spouse1Nin || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ spouse1Nin: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-spouse2-nin">Former spouse 2 national ID</label>
          <input
            id="divorce-marriage-search-spouse2-nin"
            value={criteria.spouse2Nin || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ spouse2Nin: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-spouse1-name">Former spouse 1 name</label>
          <input
            id="divorce-marriage-search-spouse1-name"
            value={criteria.spouse1Name || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ spouse1Name: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-spouse2-name">Former spouse 2 name</label>
          <input
            id="divorce-marriage-search-spouse2-name"
            value={criteria.spouse2Name || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ spouse2Name: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-date">Date of marriage</label>
          <input
            id="divorce-marriage-search-date"
            type="date"
            value={criteria.marriageDate || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ marriageDate: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-marriage-search-place">Place of marriage</label>
          <input
            id="divorce-marriage-search-place"
            value={criteria.marriagePlace || ""}
            disabled={readOnly}
            onChange={(e) => setCriteriaField({ marriagePlace: e.target.value })}
          />
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button text="Search the marriage registry" appearance="primary" type="button" loading={searching} onClick={handleSearch} testId="divorce-marriage-search" />
          {searched && !selected && (
            <Button
              text="I cannot find our marriage record"
              appearance="ghost"
              type="button"
              onClick={() => setShowNotFoundConfirm(true)}
              testId="divorce-marriage-not-found"
            />
          )}
        </div>
      )}

      {selected && (
        <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16, alignItems: "flex-start" }}>
          <Icon name="check_circle" />
          <div>
            <strong>Marriage {selected.registrationNumber} is linked to this request</strong>
            <p style={{ margin: "6px 0 0" }}>
              {selected.spouse1Name} and {selected.spouse2Name} · married {formatDate(selected.marriageDate)}
              {selected.officeName ? ` · ${selected.officeName}` : ""}
            </p>
          </div>
        </div>
      )}

      {searched && !selected && candidates.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: 0 }}>
            {candidates.length === 1 ? "1 marriage record found" : `${candidates.length} marriage records found`}
          </h3>
          {confidence === "LOW" && (
            <p className="crvs-form-hint">
              These are weak matches. Check each one carefully — selecting the wrong marriage would register the divorce
              against the wrong record.
            </p>
          )}
          <ul className="divorce-option-list">
            {candidates.map((candidate) => (
              <li key={candidate.registrationNumber}>
                <button
                  type="button"
                  className="divorce-option-card"
                  disabled={readOnly}
                  onClick={() => handleSelect(candidate)}
                  data-testid={`divorce-marriage-candidate-${candidate.registrationNumber}`}
                >
                  <strong>{candidate.registrationNumber}</strong>
                  <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                    {candidate.spouse1Name} and {candidate.spouse2Name}
                  </span>
                  <span className="crvs-form-hint" style={{ display: "block" }}>
                    Married {formatDate(candidate.marriageDate)}
                    {candidate.marriagePlace ? ` · ${candidate.marriagePlace}` : ""} · match confidence{" "}
                    {candidate.matchConfidence.toLowerCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searched && !selected && candidates.length === 0 && !notFound && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16, alignItems: "flex-start" }}>
          <Icon name="search_off" />
          <div>
            <strong>No marriage record matched what you entered</strong>
            <p style={{ margin: "6px 0 0" }}>
              Try a different detail — a registration or certificate number is the most reliable. If you have tried
              everything you have, select “I cannot find our marriage record” and a registrar will search manually.
            </p>
          </div>
        </div>
      )}

      {notFound && (
        <>
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16, alignItems: "flex-start" }}>
            <Icon name="assignment_late" />
            <div>
              <strong>A registrar will search for your marriage record manually</strong>
              <p style={{ margin: "6px 0 0" }}>
                This does not stop your registration. Upload your {divorceDocumentLabel(MARRIAGE_DOCUMENT_TYPE).toLowerCase()} so
                the registrar has something to search from, then continue to the next step.
              </p>
            </div>
          </div>

          <div id="divorce-marriage-evidence" style={{ marginTop: 12 }} tabIndex={-1}>
            {marriageEvidence.length > 0 ? (
              <ul className="divorce-option-list">
                {marriageEvidence.map((item) => (
                  <li key={item.id} className="crvs-case-card">
                    <strong>{divorceDocumentLabel(item.documentType)}</strong>
                    <span className="crvs-form-hint" style={{ display: "block" }}>
                      {item.fileName} · {item.fileSizeKb} KB
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crvs-form-hint">No marriage document uploaded yet.</p>
            )}
            {!readOnly && (
              <Button
                text="Upload marriage certificate or record"
                appearance="ghost"
                startIcon="upload_file"
                type="button"
                onClick={() => setShowUpload(true)}
                testId="divorce-marriage-upload-evidence"
                styles={{ marginTop: 8 }}
              />
            )}
          </div>
        </>
      )}

      <p className="crvs-form-hint" style={{ marginTop: 16 }}>
        Current status: {EXISTING_MARRIAGE_STATUS_LABELS[draft.existingMarriage.status]}
      </p>

      <ConfirmActionModal
        show={showNotFoundConfirm}
        onClose={() => setShowNotFoundConfirm(false)}
        onConfirm={handleMarkNotFound}
        title="Record that the marriage cannot be found"
        description={draft.reference}
        confirmLabel="Yes, a registrar should search manually"
        cancelLabel="Keep searching"
        testId="divorce-marriage-not-found-modal"
      >
        <p style={{ margin: 0 }}>
          Your request will be sent for manual review by a registrar, which usually takes longer than a request with a
          matched marriage record. You will be asked to upload your marriage certificate or record so the registrar has
          something to search from. You can keep searching instead if you have not tried the registration or certificate
          number yet.
        </p>
      </ConfirmActionModal>

      <DivorceEvidenceUploadModal
        show={showUpload}
        onClose={() => setShowUpload(false)}
        documentTypes={[MARRIAGE_DOCUMENT_TYPE]}
        initialDocumentType={MARRIAGE_DOCUMENT_TYPE}
        onUpload={handleUpload}
      />
      {busy && <span className="visually-hidden" role="status">Uploading document…</span>}
    </div>
  );
}
