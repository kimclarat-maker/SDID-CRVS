import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { demoSearchSdidIdentity, IdentitySearchResult } from "@/demo/services/crvsIdentitySearch";
import { IdentityDocumentType } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS } from "../../shared";

export type SdidIdentityMatch = IdentitySearchResult["matches"][number];

export type SdidIdentitySearchModalProps = {
  show: boolean;
  onClose: () => void;
  title?: string;
  initialDocumentType?: IdentityDocumentType;
  initialDocumentNumber?: string;
  actorName: string;
  caseReference?: string;
  /** Officer picked a match and wants to copy it into the form. */
  onUseMatch: (match: SdidIdentityMatch, documentType: IdentityDocumentType, documentNumber: string) => void;
  /** Officer wants to proceed without a verified match (NO_MATCH / SERVICE_UNAVAILABLE). */
  onManualReview?: () => void;
};

type Stage = "idle" | "searching" | IdentitySearchResult["state"];

const DOC_TYPES: IdentityDocumentType[] = ["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE", "OTHER"];

/** SDID identity lookup used to verify mother/father/declarant/witnesses
 * (spec §10). Covers every state the demo service can return: initial,
 * searching, match found, no match, multiple matches, service unavailable,
 * and a manual-verification fallback for the last two. */
export default function SdidIdentitySearchModal({
  show,
  onClose,
  title = "Search SDID identity",
  initialDocumentType,
  initialDocumentNumber,
  actorName,
  caseReference,
  onUseMatch,
  onManualReview,
}: SdidIdentitySearchModalProps) {
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(initialDocumentType || "NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState(initialDocumentNumber || "");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<IdentitySearchResult | undefined>();
  const [error, setError] = useState<string | undefined>();

  const runSearch = async () => {
    if (!documentNumber.trim()) {
      setError("Enter a document number to search.");
      return;
    }
    setError(undefined);
    setStage("searching");
    try {
      const res = await demoSearchSdidIdentity(documentType, documentNumber, actorName, caseReference);
      setResult(res);
      setStage(res.state);
    } catch (err: any) {
      setError(err?.message || "The identity search failed.");
      setStage("idle");
    }
  };

  const handleClose = () => {
    setStage("idle");
    setResult(undefined);
    setError(undefined);
    onClose();
  };

  return (
    <Modal show={show} handleClose={handleClose} title={title} size="sm" testId="sdid-identity-search-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="sdid-doc-type">Document type</label>
            <select id="sdid-doc-type" value={documentType} onChange={(e) => setDocumentType(e.target.value as IdentityDocumentType)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="sdid-doc-number">Document number</label>
            <input id="sdid-doc-number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
        </div>
        <p className="crvs-form-hint">Demo hint: a document number ending in "999" always simulates a service outage.</p>
        {error && <p className="crvs-form-error">{error}</p>}

        <div style={{ marginTop: 8 }}>
          <Button type="button" text="Search" startIcon="search" appearance="primary" loading={stage === "searching"} onClick={runSearch} testId="sdid-search-run" />
        </div>

        {(stage === "MATCH_FOUND" || stage === "MULTIPLE_MATCHES") && result && (
          <div className="crvs-section" style={{ marginTop: 16 }}>
            <p className="crvs-form-hint" style={{ marginTop: 0 }}>
              {stage === "MULTIPLE_MATCHES" ? `${result.matches.length} possible matches found. Confirm the right one.` : "Match found."}
            </p>
            {result.matches.map((m) => (
              <div key={m.identityId} className="crvs-case-card" style={{ marginBottom: 8 }}>
                <div className="crvs-case-card-header">
                  <strong>{m.firstName} {m.lastName}</strong>
                  <span className="crvs-status-pill crvs-status-success crvs-status-icon-label">
                    <Icon name="verified" />
                    SDID match
                  </span>
                </div>
                <span className="crvs-form-hint">DOB {m.dob} · {m.nationality}{m.phoneNumber ? ` · ${m.phoneNumber}` : ""}</span>
                <Button
                  type="button"
                  text="Use verified identity"
                  size="sm"
                  appearance="primary"
                  onClick={() => onUseMatch(m, documentType, documentNumber)}
                  testId={`sdid-use-match-${m.identityId}`}
                />
              </div>
            ))}
          </div>
        )}

        {stage === "NO_MATCH" && (
          <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 16 }}>
            <Icon name="person_search" />
            <div>
              <strong>No SDID identity found for this document.</strong>
              <p className="crvs-form-hint" style={{ margin: "4px 0 8px" }}>
                You may enter the details manually and flag them for manual review.
              </p>
              {onManualReview && (
                <Button type="button" text="Continue without verification" size="sm" appearance="ghost" onClick={onManualReview} testId="sdid-manual-review" />
              )}
            </div>
          </div>
        )}

        {stage === "SERVICE_UNAVAILABLE" && (
          <div className="crvs-banner crvs-banner-danger" style={{ marginTop: 16 }}>
            <Icon name="cloud_off" />
            <div>
              <strong>The SDID identity service is unavailable.</strong>
              <p className="crvs-form-hint" style={{ margin: "4px 0 8px" }}>
                Try again later, or continue and flag this identity for manual review.
              </p>
              {onManualReview && (
                <Button type="button" text="Continue without verification" size="sm" appearance="ghost" onClick={onManualReview} testId="sdid-manual-review-outage" />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
