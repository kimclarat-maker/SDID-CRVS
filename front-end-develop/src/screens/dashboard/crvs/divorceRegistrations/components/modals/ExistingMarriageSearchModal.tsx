import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoSearchExistingMarriages, demoSelectExistingMarriage, demoMarkExistingMarriageNotFound } from "@/demo/services/crvsDivorceMarriageSearch";
import { DivorceRegistration, ExistingMarriageCandidate, ExistingMarriageSearchCriteria } from "@/domain/crvs/types";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";
import { formatDate } from "../../../divorceShared";

const EMPTY_CRITERIA: ExistingMarriageSearchCriteria = {
  marriageRegistrationNumber: "",
  marriageCertificateNumber: "",
  spouse1Nin: "",
  spouse2Nin: "",
  spouse1Name: "",
  spouse2Name: "",
  marriageDate: "",
  marriagePlace: "",
};

/**
 * Wizard step 3 (spec §3): find and select the existing ACTIVE marriage this
 * divorce dissolves. If it genuinely cannot be found, "Marriage not found"
 * routes the case to a MARRIAGE_RECORD_NOT_FOUND exception rather than
 * letting anyone fabricate an unverified marriage record.
 */
export default function ExistingMarriageSearchModal({
  show,
  onClose,
  registration,
  onUpdated,
}: {
  show: boolean;
  onClose: () => void;
  registration: DivorceRegistration;
  onUpdated: (updated: DivorceRegistration) => void;
}) {
  const [criteria, setCriteria] = useState<ExistingMarriageSearchCriteria>({ ...EMPTY_CRITERIA });
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [candidates, setCandidates] = useState<ExistingMarriageCandidate[]>([]);
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH" | undefined>();

  const set = (patch: Partial<ExistingMarriageSearchCriteria>) => setCriteria((prev) => ({ ...prev, ...patch }));

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
      const res = await demoSearchExistingMarriages(criteria);
      setCandidates(res.candidates);
      setConfidence(res.confidence);
      setSearched(true);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (candidate: ExistingMarriageCandidate) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = demoSelectExistingMarriage(registration.id, candidate, getCurrentActorName());
      toastMessage("success", `Linked marriage ${candidate.registrationNumber}.`);
      onUpdated(updated);
      handleClose();
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotFound = () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = demoMarkExistingMarriageNotFound(registration.id, getCurrentActorName(), criteria);
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
    <Modal show={show} handleClose={handleClose} title="Find the existing marriage" description={registration.reference} size="sm" testId="existing-marriage-search-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          A divorce can only be registered against a marriage already on record. Search by any combination below — the more you supply, the higher the match confidence.
        </p>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="ems-reg-number">Marriage registration number</label>
            <input id="ems-reg-number" value={criteria.marriageRegistrationNumber || ""} onChange={(e) => set({ marriageRegistrationNumber: e.target.value })} data-testid="ems-reg-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-cert-number">Marriage certificate number</label>
            <input id="ems-cert-number" value={criteria.marriageCertificateNumber || ""} onChange={(e) => set({ marriageCertificateNumber: e.target.value })} data-testid="ems-cert-number" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-spouse1-name">Former spouse 1 name</label>
            <input id="ems-spouse1-name" value={criteria.spouse1Name || ""} onChange={(e) => set({ spouse1Name: e.target.value })} data-testid="ems-spouse1-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-spouse2-name">Former spouse 2 name</label>
            <input id="ems-spouse2-name" value={criteria.spouse2Name || ""} onChange={(e) => set({ spouse2Name: e.target.value })} data-testid="ems-spouse2-name" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-spouse1-nin">Former spouse 1 NIN</label>
            <input id="ems-spouse1-nin" value={criteria.spouse1Nin || ""} onChange={(e) => set({ spouse1Nin: e.target.value })} data-testid="ems-spouse1-nin" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-spouse2-nin">Former spouse 2 NIN</label>
            <input id="ems-spouse2-nin" value={criteria.spouse2Nin || ""} onChange={(e) => set({ spouse2Nin: e.target.value })} data-testid="ems-spouse2-nin" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-marriage-date">Marriage date</label>
            <input id="ems-marriage-date" type="date" value={criteria.marriageDate || ""} onChange={(e) => set({ marriageDate: e.target.value })} data-testid="ems-marriage-date" />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="ems-marriage-place">Marriage place</label>
            <input id="ems-marriage-place" value={criteria.marriagePlace || ""} onChange={(e) => set({ marriagePlace: e.target.value })} data-testid="ems-marriage-place" />
          </div>
        </div>

        <Button text="Search the marriage registry" appearance="primary" type="button" loading={searching} disabled={searching || submitting} onClick={handleSearch} testId="ems-search" />

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
                  <span className={`crvs-status-pill crvs-status-${candidate.matchConfidence === "HIGH" ? "success" : candidate.matchConfidence === "MEDIUM" ? "info" : "warning"}`}>{candidate.matchConfidence} confidence</span>
                </div>
                <div className="crvs-form-hint">
                  {candidate.spouse1Name} &amp; {candidate.spouse2Name} · married {formatDate(candidate.marriageDate)} · {candidate.marriagePlace || candidate.officeName || "Office not recorded"}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button text="Select this marriage" size="sm" appearance="primary" type="button" disabled={submitting} onClick={() => handleSelect(candidate)} testId={`ems-select-${candidate.registrationNumber}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap", padding: 16 }}>
        <Button
          text="Marriage not found — route to exception"
          appearance="ghost"
          color="red"
          type="button"
          disabled={!searched || submitting}
          onClick={handleNotFound}
          testId="ems-not-found"
        />
        <Button text="Close" appearance="ghost" type="button" disabled={searching || submitting} onClick={handleClose} testId="ems-close" />
      </div>
    </Modal>
  );
}
