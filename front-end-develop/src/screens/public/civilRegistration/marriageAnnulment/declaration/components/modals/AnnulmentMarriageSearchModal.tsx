import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoSearchExistingAnnulmentMarriages } from "@/demo/services/crvsAnnulmentMarriageSearch";
import { AnnulmentMarriageCandidate, AnnulmentMarriageSearchCriteria } from "@/domain/crvs/types";
import { EXISTING_MARRIAGE_CIVIL_STATUS_LABELS, formatDate } from "../../../marriageAnnulmentShared";

/**
 * Marriage-lookup modal for the Existing marriage step. Annulment's public
 * wizard needs a dedicated way to find the marriage a decision annuls;
 * divorce keeps the equivalent search inline on its own step, but this
 * module builds it as a modal instead so the step itself stays focused on
 * the outcome (selected / not found) rather than the search form.
 *
 * Never fabricates a match: every candidate returned is a real registry
 * record, each shown with its own match confidence and current civil status
 * rather than a single collapsed "found" result (spec §1, §8).
 */
export default function AnnulmentMarriageSearchModal({
  show,
  onClose,
  initialCriteria,
  onSelect,
  onSearched,
}: {
  show: boolean;
  onClose: () => void;
  initialCriteria?: AnnulmentMarriageSearchCriteria;
  onSelect: (candidate: AnnulmentMarriageCandidate) => void;
  /** Fired after every completed search so the host can remember the last
   * criteria used — needed if the search comes back empty and the applicant
   * records the marriage as not found. */
  onSearched: (criteria: AnnulmentMarriageSearchCriteria) => void;
}) {
  const [criteria, setCriteria] = useState<AnnulmentMarriageSearchCriteria>(initialCriteria || {});
  const [candidates, setCandidates] = useState<AnnulmentMarriageCandidate[]>([]);
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH" | undefined>();
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (show) {
      openerRef.current = document.activeElement;
      setCriteria(initialCriteria || {});
      setCandidates([]);
      setConfidence(undefined);
      setSearched(false);
      setError(undefined);
      return;
    }
    const opener = openerRef.current;
    if (opener instanceof HTMLElement) opener.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const setCriteriaField = (patch: Partial<AnnulmentMarriageSearchCriteria>) => setCriteria((prev) => ({ ...prev, ...patch }));
  const hasAnyCriteria = Object.values(criteria).some((value) => !!value && value.trim().length > 0);

  const handleClose = () => {
    if (searching) return;
    onClose();
  };

  const handleSearch = async () => {
    if (!hasAnyCriteria) {
      setError("Enter at least one detail about the marriage before searching.");
      return;
    }
    setError(undefined);
    setSearching(true);
    try {
      const result = await demoSearchExistingAnnulmentMarriages(criteria);
      setCandidates(result.candidates);
      setConfidence(result.confidence);
      setSearched(true);
      onSearched(criteria);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The marriage registry search could not be completed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (candidate: AnnulmentMarriageCandidate) => {
    onSelect(candidate);
    handleClose();
  };

  return (
    <Modal show={show} handleClose={handleClose} title="Find the marriage" size="sm" testId="annulment-marriage-search-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Search using whatever you have — the marriage registration or certificate number finds it fastest, but either
          party's national ID number, or the names, date and place of the marriage, also work.
        </p>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-registration-number">Marriage registration number</label>
            <input
              id="annulment-marriage-search-registration-number"
              value={criteria.marriageRegistrationNumber || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ marriageRegistrationNumber: e.target.value })}
              data-testid="annulment-marriage-search-registration-number"
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-certificate-number">Marriage certificate number</label>
            <input
              id="annulment-marriage-search-certificate-number"
              value={criteria.marriageCertificateNumber || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ marriageCertificateNumber: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-party1-nin">First party's national ID</label>
            <input
              id="annulment-marriage-search-party1-nin"
              value={criteria.party1Nin || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ party1Nin: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-party2-nin">Second party's national ID</label>
            <input
              id="annulment-marriage-search-party2-nin"
              value={criteria.party2Nin || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ party2Nin: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-party1-name">First party's name</label>
            <input
              id="annulment-marriage-search-party1-name"
              value={criteria.party1Name || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ party1Name: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-party2-name">Second party's name</label>
            <input
              id="annulment-marriage-search-party2-name"
              value={criteria.party2Name || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ party2Name: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-date">Date of marriage</label>
            <input
              id="annulment-marriage-search-date"
              type="date"
              value={criteria.marriageDate || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ marriageDate: e.target.value })}
            />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-marriage-search-place">Place of marriage</label>
            <input
              id="annulment-marriage-search-place"
              value={criteria.marriagePlace || ""}
              disabled={searching}
              onChange={(e) => setCriteriaField({ marriagePlace: e.target.value })}
            />
          </div>
        </div>

        <Button text="Search the marriage registry" appearance="primary" type="button" loading={searching} onClick={handleSearch} testId="annulment-marriage-search" />

        {error && (
          <p className="crvs-form-error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}

        {searched && candidates.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 8px" }}>{candidates.length === 1 ? "1 marriage record found" : `${candidates.length} marriage records found`}</h3>
            {confidence === "LOW" && (
              <p className="crvs-form-hint">
                These are weak matches. Check each one carefully — selecting the wrong marriage would register the
                annulment against the wrong record.
              </p>
            )}
            <ul className="annulment-option-list">
              {candidates.map((candidate) => (
                <li key={candidate.registrationNumber}>
                  <button
                    type="button"
                    className="annulment-option-card"
                    onClick={() => handleSelect(candidate)}
                    data-testid={`annulment-marriage-candidate-${candidate.registrationNumber}`}
                  >
                    <strong>{candidate.registrationNumber}</strong>
                    <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {candidate.party1Name} and {candidate.party2Name}
                    </span>
                    <span className="crvs-form-hint" style={{ display: "block" }}>
                      Married {formatDate(candidate.marriageDate)}
                      {candidate.marriagePlace ? ` · ${candidate.marriagePlace}` : ""} · match confidence{" "}
                      {candidate.matchConfidence.toLowerCase()}
                    </span>
                    <span className="crvs-form-hint" style={{ display: "block" }}>
                      Current status: {EXISTING_MARRIAGE_CIVIL_STATUS_LABELS[candidate.currentCivilStatus]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {searched && candidates.length === 0 && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="search_off" />
            <span>
              No marriage record matched what you entered. Try a different detail — a registration or certificate number
              is the most reliable. If you have tried everything you have, close this window and record that the
              marriage cannot be found.
            </span>
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" type="button" disabled={searching} onClick={handleClose} testId="annulment-marriage-search-close" />
      </div>
    </Modal>
  );
}
