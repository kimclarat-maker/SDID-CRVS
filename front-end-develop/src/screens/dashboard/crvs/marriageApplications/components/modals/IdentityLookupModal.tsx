import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoSearchSdidIdentity, IdentitySearchResult } from "@/demo/services/crvsIdentitySearch";
import { getCurrentActorName } from "@/utils/workspace";

export type IdentityLookupMatch = {
  identityId: string;
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
};

/** "Applicant identity lookup" / "Review identity match" modal (spec §9) —
 * run once per applicant, reusing the same demoSearchSdidIdentity()
 * simulation birth/death already use rather than forking it. */
export default function IdentityLookupModal({
  show,
  onClose,
  applicantLabel,
  onMatched,
  onNotFound,
}: {
  show: boolean;
  onClose: () => void;
  applicantLabel: string;
  onMatched: (match: IdentityLookupMatch) => void;
  onNotFound?: () => void;
}) {
  const [documentType, setDocumentType] = useState("NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<IdentitySearchResult | undefined>();

  const handleClose = () => {
    setDocumentNumber("");
    setResult(undefined);
    onClose();
  };

  const handleSearch = async () => {
    if (!documentNumber.trim()) return;
    setSearching(true);
    try {
      const res = await demoSearchSdidIdentity(documentType, documentNumber, getCurrentActorName());
      setResult(res);
      if (res.state === "NO_MATCH") onNotFound?.();
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (match: IdentitySearchResult["matches"][number]) => {
    onMatched({ identityId: match.identityId, firstName: match.firstName, lastName: match.lastName, dob: match.dob, nationality: match.nationality });
    handleClose();
  };

  return (
    <Modal show={show} handleClose={handleClose} title={`Look up ${applicantLabel}'s identity`} size="sm" testId="marriage-identity-lookup-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="marriage-lookup-doc-type">Document type</label>
            <select id="marriage-lookup-doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="REFUGEE_ID">Refugee ID</option>
              <option value="DRIVER_LICENSE">Driver's license</option>
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="marriage-lookup-doc-number">Document / NIN number</label>
            <input id="marriage-lookup-doc-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} data-testid="marriage-identity-lookup-input" />
          </div>
        </div>
        <Button text="Search" appearance="primary" type="button" loading={searching} onClick={handleSearch} testId="marriage-identity-lookup-search" />

        {result?.state === "SERVICE_UNAVAILABLE" && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="cloud_off" /> The identity service is temporarily unavailable. You can continue and mark this for manual review later.
          </div>
        )}
        {result?.state === "NO_MATCH" && (
          <div className="crvs-banner crvs-banner-info">
            <Icon name="search_off" /> No matching identity found. You can continue entering details manually.
          </div>
        )}
        {(result?.state === "MATCH_FOUND" || result?.state === "MULTIPLE_MATCHES") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.state === "MULTIPLE_MATCHES" && <p className="crvs-form-hint">Multiple possible matches — select the correct one.</p>}
            {result.matches.map((m) => (
              <button
                key={m.identityId}
                type="button"
                className="crvs-case-card"
                style={{ textAlign: "left" }}
                onClick={() => handleSelect(m)}
                data-testid={`marriage-identity-lookup-match-${m.identityId}`}
              >
                <strong>{m.firstName} {m.lastName}</strong>
                <div className="crvs-form-hint">DOB {m.dob} · {m.nationality}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" onClick={handleClose} testId="marriage-identity-lookup-close" />
      </div>
    </Modal>
  );
}
