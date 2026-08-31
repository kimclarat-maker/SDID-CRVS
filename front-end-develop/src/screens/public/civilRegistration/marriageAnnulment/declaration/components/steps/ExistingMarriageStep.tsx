import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import AnnulmentMarriageSearchModal from "../modals/AnnulmentMarriageSearchModal";
import AnnulmentEvidenceUploadModal from "../modals/AnnulmentEvidenceUploadModal";
import { demoSelectExistingAnnulmentMarriage, demoMarkAnnulmentMarriageNotFound } from "@/demo/services/crvsAnnulmentMarriageSearch";
import { demoAttachAnnulmentEvidence } from "@/demo/services/crvsAnnulmentEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { AnnulmentMarriageCandidate, AnnulmentMarriageSearchCriteria } from "@/domain/crvs/types";
import { EXISTING_MARRIAGE_MATCH_STATUS_LABELS, annulmentDocumentLabel, formatDate } from "../../../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";

const MARRIAGE_DOCUMENT_TYPE = "MARRIAGE_CERTIFICATE_OR_RECORD";

/** Wizard step 3 — find the marriage this decision annuls.
 *
 * Search and selection happen in AnnulmentMarriageSearchModal, already built
 * for this module (unlike divorce, which keeps the search form inline on the
 * step itself — see AnnulmentMarriageSearchModal.tsx's own note on that
 * difference). The applicant must select a real registry record before
 * continuing; if none can be found, the case is recorded as NOT_FOUND and the
 * applicant uploads their marriage certificate instead. This step never
 * fabricates a match (spec §1, §11 Step 3).
 */
export default function ExistingMarriageStep({ draft, onCaseSynced, onPersist, actorName, errors, readOnly }: AnnulmentWizardStepProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [lastCriteria, setLastCriteria] = useState<AnnulmentMarriageSearchCriteria>(draft.existingMarriage.searchCriteria || {});
  const [showNotFoundConfirm, setShowNotFoundConfirm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState(false);

  const selected = draft.existingMarriage.selected;
  const notFound = draft.existingMarriage.status === "NOT_FOUND";
  const marriageEvidence = draft.evidence.filter((e) => !e.removed && e.documentType === MARRIAGE_DOCUMENT_TYPE);

  const handleSelect = async (candidate: AnnulmentMarriageCandidate) => {
    onPersist();
    try {
      const updated = await demoSelectExistingAnnulmentMarriage(draft.id, candidate, actorName);
      onCaseSynced(updated);
      toastMessage("success", `Marriage ${candidate.registrationNumber} linked to this registration request.`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleMarkNotFound = async () => {
    onPersist();
    try {
      const updated = await demoMarkAnnulmentMarriageNotFound(draft.id, actorName);
      onCaseSynced(updated);
      setShowNotFoundConfirm(false);
      toastMessage("success", "Recorded. Upload your marriage certificate so a registrar can locate the record manually.");
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleUpload = async (input: AttachEvidenceInput) => {
    setBusy(true);
    try {
      onPersist();
      const updated = await demoAttachAnnulmentEvidence(draft.id, input, actorName);
      onCaseSynced(updated);
      toastMessage("success", "Document uploaded.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">The marriage this decision annuls</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        An annulment can only be registered against a marriage that is already on the registry. Search using whatever
        you have — the marriage registration or certificate number finds it fastest, but either affected person's
        national ID number, or the names, date and place of the marriage, also work.
      </p>

      {!readOnly && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button
            text={selected ? "Search again" : "Find the marriage"}
            appearance="primary"
            type="button"
            startIcon="search"
            onClick={() => setShowSearch(true)}
            testId="annulment-marriage-open-search"
          />
          {!selected && (
            <Button
              text="I cannot find this marriage record"
              appearance="ghost"
              type="button"
              onClick={() => setShowNotFoundConfirm(true)}
              testId="annulment-marriage-not-found"
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
              {selected.party1Name} and {selected.party2Name} · married {formatDate(selected.marriageDate)}
              {selected.officeName ? ` · ${selected.officeName}` : ""}
            </p>
          </div>
        </div>
      )}

      {notFound && (
        <>
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16, alignItems: "flex-start" }}>
            <Icon name="assignment_late" />
            <div>
              <strong>A registrar will search for this marriage record manually</strong>
              <p style={{ margin: "6px 0 0" }}>
                This does not stop your registration. Upload your {annulmentDocumentLabel(MARRIAGE_DOCUMENT_TYPE).toLowerCase()} so
                the registrar has something to search from, then continue to the next step.
              </p>
            </div>
          </div>

          <div id="annulment-marriage-evidence" style={{ marginTop: 12 }} tabIndex={-1}>
            {marriageEvidence.length > 0 ? (
              <ul className="annulment-option-list">
                {marriageEvidence.map((item) => (
                  <li key={item.id} className="crvs-case-card">
                    <strong>{annulmentDocumentLabel(item.documentType)}</strong>
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
                testId="annulment-marriage-upload-evidence"
                styles={{ marginTop: 8 }}
              />
            )}
          </div>
        </>
      )}

      <p className="crvs-form-hint" style={{ marginTop: 16 }}>
        Current status: {EXISTING_MARRIAGE_MATCH_STATUS_LABELS[draft.existingMarriage.status]}
      </p>

      <AnnulmentMarriageSearchModal
        show={showSearch}
        onClose={() => setShowSearch(false)}
        initialCriteria={lastCriteria}
        onSelect={handleSelect}
        onSearched={setLastCriteria}
      />

      <ConfirmActionModal
        show={showNotFoundConfirm}
        onClose={() => setShowNotFoundConfirm(false)}
        onConfirm={handleMarkNotFound}
        title="Record that the marriage cannot be found"
        description={draft.reference}
        confirmLabel="Yes, a registrar should search manually"
        cancelLabel="Keep searching"
        testId="annulment-marriage-not-found-modal"
      >
        <p style={{ margin: 0 }}>
          Your request will be sent for manual review by a registrar, which usually takes longer than a request with a
          matched marriage record. You will be asked to upload your marriage certificate or record so the registrar has
          something to search from. You can keep searching instead if you have not tried the registration or certificate
          number yet.
        </p>
      </ConfirmActionModal>

      <AnnulmentEvidenceUploadModal
        show={showUpload}
        onClose={() => setShowUpload(false)}
        documentTypes={[MARRIAGE_DOCUMENT_TYPE]}
        initialDocumentType={MARRIAGE_DOCUMENT_TYPE}
        onUpload={handleUpload}
      />
      {busy && (
        <span className="visually-hidden" role="status">
          Uploading document…
        </span>
      )}
    </div>
  );
}
