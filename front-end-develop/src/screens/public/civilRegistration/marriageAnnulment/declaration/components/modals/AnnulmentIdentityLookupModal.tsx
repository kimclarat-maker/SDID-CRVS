import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { IdentitySearchResult } from "@/demo/services/crvsIdentitySearch";
import { demoSearchAnnulmentIdentity } from "@/demo/services/crvsAnnulmentIdentitySearch";
import { IdentityDocumentType } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS } from "../../../marriageAnnulmentShared";

export type AnnulmentIdentityMatch = IdentitySearchResult["matches"][number];
export type AnnulmentIdentitySearchTarget = "applicant" | "party1" | "party2";

const SEARCHABLE_DOCUMENT_TYPES: IdentityDocumentType[] = ["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE"];

/**
 * Identity-lookup modal used by the applicant step and both affected-party
 * steps. Calls demoSearchAnnulmentIdentity(), which both returns the raw
 * result AND writes it onto the registration record — so every caller must
 * resync afterwards, which is what onSearched() is for. Mirrors
 * DivorceIdentityLookupModal.tsx exactly.
 *
 * Every outcome is shown explicitly (match / several matches / no match /
 * service unavailable) rather than collapsed into one pass-fail badge, and a
 * no-match never blocks the applicant: they can always continue by entering
 * their document details manually (spec §8).
 */
export default function AnnulmentIdentityLookupModal({
  show,
  onClose,
  registrationId,
  target,
  subjectLabel,
  actorName,
  initialDocumentType,
  initialDocumentNumber,
  onMatched,
  onSearched,
}: {
  show: boolean;
  onClose: () => void;
  registrationId: string;
  target: AnnulmentIdentitySearchTarget;
  subjectLabel: string;
  actorName: string;
  initialDocumentType?: IdentityDocumentType;
  initialDocumentNumber?: string;
  onMatched: (match: AnnulmentIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => void;
  /** Fired after every completed search so the host can resync the draft's
   * `version` — the service bumps it on the record. */
  onSearched: () => void;
}) {
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(
    initialDocumentType && initialDocumentType !== "NONE" && initialDocumentType !== "OTHER" ? initialDocumentType : "NATIONAL_ID"
  );
  const [documentNumber, setDocumentNumber] = useState(initialDocumentNumber || "");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<IdentitySearchResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const openerRef = useRef<Element | null>(null);

  // Restores focus to whatever opened the modal when it closes (spec §21).
  useEffect(() => {
    if (show) {
      openerRef.current = document.activeElement;
      setResult(undefined);
      setError(undefined);
      if (initialDocumentType && initialDocumentType !== "NONE" && initialDocumentType !== "OTHER") setDocumentType(initialDocumentType);
      if (initialDocumentNumber) setDocumentNumber(initialDocumentNumber);
      return;
    }
    const opener = openerRef.current;
    if (opener instanceof HTMLElement) opener.focus();
  }, [show, initialDocumentType, initialDocumentNumber]);

  const handleClose = () => {
    if (searching) return;
    setResult(undefined);
    setError(undefined);
    onClose();
  };

  const handleSearch = async () => {
    if (searching) return;
    if (!documentNumber.trim()) {
      setError("Enter the document number you want to look up.");
      return;
    }
    setError(undefined);
    setSearching(true);
    try {
      const found = await demoSearchAnnulmentIdentity(registrationId, target, documentType, documentNumber.trim(), actorName);
      setResult(found);
      onSearched();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The identity search could not be completed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (match: AnnulmentIdentityMatch) => {
    onMatched(match, documentType, documentNumber.trim());
    handleClose();
  };

  return (
    <Modal show={show} handleClose={handleClose} title={`Look up ${subjectLabel}'s identity`} size="sm" testId="annulment-identity-lookup-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="crvs-form-hint" style={{ margin: 0 }}>
          Looking up an identity record fills in the details we already hold, so you don't have to type them again. It is
          optional — if nothing is found you can continue and enter the details by hand.
        </p>

        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="annulment-lookup-doc-type">Document type</label>
            <select
              id="annulment-lookup-doc-type"
              value={documentType}
              disabled={searching}
              onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}
            >
              {SEARCHABLE_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-lookup-doc-number">Document or NIN number</label>
            <input
              id="annulment-lookup-doc-number"
              value={documentNumber}
              disabled={searching}
              onChange={(e) => setDocumentNumber(e.target.value)}
              data-testid="annulment-identity-lookup-input"
            />
          </div>
        </div>

        <Button text="Search" appearance="primary" type="button" loading={searching} onClick={handleSearch} testId="annulment-identity-lookup-search" />

        {error && (
          <p className="crvs-form-error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}

        {result?.state === "SERVICE_UNAVAILABLE" && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="cloud_off" />
            <span>
              The identity service is temporarily unavailable. Continue by entering the details manually — a registrar
              will confirm the identity when the case is reviewed.
            </span>
          </div>
        )}
        {result?.state === "NO_MATCH" && (
          <div className="crvs-banner crvs-banner-info">
            <Icon name="search_off" />
            <span>
              No identity record matched that document number. That does not stop your registration: continue and enter
              the details manually, and a registrar will verify them during review.
            </span>
          </div>
        )}
        {(result?.state === "MATCH_FOUND" || result?.state === "MULTIPLE_MATCHES") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.state === "MULTIPLE_MATCHES" && (
              <p className="crvs-form-hint" style={{ margin: 0 }}>
                More than one identity record matched. Select the correct person — if you are not certain, close this
                window and continue manually rather than guessing.
              </p>
            )}
            {result.matches.map((match) => (
              <button
                key={match.identityId}
                type="button"
                className="annulment-option-card"
                onClick={() => handleSelect(match)}
                data-testid={`annulment-identity-lookup-match-${match.identityId}`}
              >
                <strong>
                  {match.firstName} {match.lastName}
                </strong>
                <span className="crvs-form-hint" style={{ display: "block" }}>
                  Born {match.dob} · {match.nationality}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" type="button" disabled={searching} onClick={handleClose} testId="annulment-identity-lookup-close" />
      </div>
    </Modal>
  );
}
