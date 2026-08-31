import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoSearchExistingAnnulmentMarriages, demoSelectExistingAnnulmentMarriage, demoMarkAnnulmentMarriageNotFound } from "@/demo/services/crvsAnnulmentMarriageSearch";
import { AnnulmentMarriageCandidate, AnnulmentMarriageSearchCriteria, AnnulmentRegistration } from "@/domain/crvs/types";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate } from "../../../annulmentShared";

const EMPTY_CRITERIA: AnnulmentMarriageSearchCriteria = {
  marriageRegistrationNumber: "",
  marriageCertificateNumber: "",
  party1Nin: "",
  party2Nin: "",
  party1Name: "",
  party2Name: "",
  marriageDate: "",
  marriagePlace: "",
};

/**
 * Wizard step 2 (spec §11 Step 3): find and select the existing marriage this
 * annulment decision concerns. If it genuinely cannot be found, "Marriage not
 * found" routes the case to a MARRIAGE_RECORD_NOT_FOUND exception rather than
 * letting anyone fabricate an unverified marriage record (mirrors the divorce
 * module's ExistingMarriageSearchModal exactly, against the annulment-scoped
 * search criteria/candidate shape, which additionally carries each
 * candidate's current civil status).
 */
export default function ExistingMarriageSearchModal({
  show,
  onClose,
  registration,
  onUpdated,
}: {
  show: boolean;
  onClose: () => void;
  registration: AnnulmentRegistration;
  onUpdated: (updated: AnnulmentRegistration) => void;
}) {
  const [criteria, setCriteria] = useState<AnnulmentMarriageSearchCriteria>({ ...EMPTY_CRITERIA });
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [candidates, setCandidates] = useState<AnnulmentMarriageCandidate[]>([]);
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH" | undefined>();

  const set = (patch: Partial<AnnulmentMarriageSearchCriteria>) => setCriteria((prev) => ({ ...prev, ...patch }));

  const handleClose = () => {
    if (searching || submitting) return;
    setCriteria({ ...EMPTY_CRITERIA });
    setCandidates([]);
    setConfidence(undefined);
    setSearched(false);
    onClose();
  };

  const handleSearch = async () => {
    if (searching) return;
    setSearching(true);
    try {
      const res = await demoSearchExistingAnnulmentMarriages(criteria);
      setCandidates(res.candidates);
      setConfidence(res.confidence);
      setSearched(true);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (candidate: AnnulmentMarriageCandidate) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await demoSelectExistingAnnulmentMarriage(registration.id, candidate, getCurrentActorName());
      toastMessage("success", `Linked marriage ${candidate.registrationNumber}.`);
      onUpdated(updated);
      handleClose();
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotFound = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await demoMarkAnnulmentMarriageNotFound(registration.id, getCurrentActorName(), criteria);
      toastMessage("info", "Marked as not found — this case is now routed for exception review.");
      onUpdated(updated);
      handleClose();
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Find the existing marriage" description={registration.reference} size="sm" testId="annulment-existing-marriage-search-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          An annulment can only be registered against a marriage already on record. Search by any combination below — the more you supply, the higher the match confidence.
        </p>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="anms-reg-number">Marriage registration number</label>
            <input id="anms-reg-number" value={criteria.marriageRegistrationNumber || ""} onChange={(e) => set({ marriageRegistrationNumber: e.target.value })} data-testid="anms-reg-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-cert-number">Marriage certificate number</label>
            <input id="anms-cert-number" value={criteria.marriageCertificateNumber || ""} onChange={(e) => set({ marriageCertificateNumber: e.target.value })} data-testid="anms-cert-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-party1-name">Affected party 1 name</label>
            <input id="anms-party1-name" value={criteria.party1Name || ""} onChange={(e) => set({ party1Name: e.target.value })} data-testid="anms-party1-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-party2-name">Affected party 2 name</label>
            <input id="anms-party2-name" value={criteria.party2Name || ""} onChange={(e) => set({ party2Name: e.target.value })} data-testid="anms-party2-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-party1-nin">Affected party 1 NIN</label>
            <input id="anms-party1-nin" value={criteria.party1Nin || ""} onChange={(e) => set({ party1Nin: e.target.value })} data-testid="anms-party1-nin" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-party2-nin">Affected party 2 NIN</label>
            <input id="anms-party2-nin" value={criteria.party2Nin || ""} onChange={(e) => set({ party2Nin: e.target.value })} data-testid="anms-party2-nin" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-marriage-date">Marriage date</label>
            <input id="anms-marriage-date" type="date" value={criteria.marriageDate || ""} onChange={(e) => set({ marriageDate: e.target.value })} data-testid="anms-marriage-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="anms-marriage-place">Marriage place</label>
            <input id="anms-marriage-place" value={criteria.marriagePlace || ""} onChange={(e) => set({ marriagePlace: e.target.value })} data-testid="anms-marriage-place" />
          </div>
        </div>

        <Button text="Search the marriage registry" appearance="primary" type="button" loading={searching} disabled={searching || submitting} onClick={handleSearch} testId="anms-search" />

        {searched && candidates.length === 0 && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="search_off" /> No marriage record matched those details. Check the details and search again, or mark the marriage as not found to route this case for exception review.
          </div>
        )}

        {candidates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="crvs-form-hint" style={{ margin: 0 }}>
              {candidates.length} candidate(s) · overall confidence {confidence}. Select the correct marriage — nothing is linked until you do.
            </p>
            {candidates.map((candidate) => (
              <div key={candidate.registrationNumber} className="crvs-case-card">
                <div className="crvs-case-card-header">
                  <strong>{candidate.registrationNumber}</strong>
                  <span className={`crvs-status-pill crvs-status-${candidate.matchConfidence === "HIGH" ? "success" : candidate.matchConfidence === "MEDIUM" ? "info" : "warning"}`}>
                    {candidate.matchConfidence} confidence
                  </span>
                </div>
                <div className="crvs-form-hint">
                  {candidate.party1Name} &amp; {candidate.party2Name} · married {formatDate(candidate.marriageDate)} · {candidate.marriagePlace || candidate.officeName || "Office not recorded"} · current status{" "}
                  {candidate.currentCivilStatus.replace(/_/g, " ").toLowerCase()}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button text="Select this marriage" size="sm" appearance="primary" type="button" disabled={submitting} onClick={() => handleSelect(candidate)} testId={`anms-select-${candidate.registrationNumber}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap", padding: 16 }}>
        <Button text="Marriage not found — route to exception" appearance="ghost" color="red" type="button" disabled={!searched || submitting} onClick={handleNotFound} testId="anms-not-found" />
        <Button text="Close" appearance="ghost" type="button" disabled={searching || submitting} onClick={handleClose} testId="anms-close" />
      </div>
    </Modal>
  );
}
