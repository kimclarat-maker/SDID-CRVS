import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { IdentitySearchResult } from "@/demo/services/crvsIdentitySearch";
import { demoSearchAnnulmentIdentity, AnnulmentIdentitySearchTarget } from "@/demo/services/crvsAnnulmentIdentitySearch";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { getCurrentActorName, hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import toastMessage from "@/utils/common/toastMessage";
import { DOCUMENT_TYPE_LABELS } from "../../../annulmentShared";

/**
 * SDID identity lookup for the applicant or either affected party. Runs
 * demoSearchAnnulmentIdentity, which persists the classification onto the
 * registration itself, then re-reads the case so the wizard's version stays
 * in step. Every candidate is listed separately — never one collapsed
 * pass/fail badge (mirrors DivorceIdentityLookupModal exactly).
 */
export default function AnnulmentIdentityLookupModal({
  show,
  onClose,
  registrationId,
  target,
  targetLabel,
  onSearched,
}: {
  show: boolean;
  onClose: () => void;
  registrationId: string;
  target: AnnulmentIdentitySearchTarget;
  targetLabel: string;
  onSearched: (updated: AnnulmentRegistration, result: IdentitySearchResult) => void;
}) {
  const canSearch = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_IDENTITY_SEARCH);

  const [documentType, setDocumentType] = useState("NATIONAL_ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<IdentitySearchResult | undefined>();

  const handleClose = () => {
    if (searching) return;
    setDocumentNumber("");
    setResult(undefined);
    onClose();
  };

  const handleSearch = async () => {
    if (searching || !documentNumber.trim() || !canSearch) return;
    setSearching(true);
    try {
      const res = await demoSearchAnnulmentIdentity(registrationId, target, documentType, documentNumber.trim(), getCurrentActorName());
      setResult(res);
      const updated = await demoGetAnnulmentRegistration(registrationId);
      onSearched(updated, res);
      if (res.state === "MATCH_FOUND") toastMessage("success", `Identity confirmed for ${targetLabel}.`);
      else if (res.state === "MULTIPLE_MATCHES") toastMessage("info", `Multiple candidates found for ${targetLabel} — flagged for manual review.`);
      else if (res.state === "NO_MATCH") toastMessage("info", `No identity found for ${targetLabel}. Details can still be entered manually.`);
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal show={show} handleClose={handleClose} title={`Look up ${targetLabel}'s identity`} size="sm" testId="annulment-identity-lookup-modal">
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {!canSearch && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="lock" /> Running an identity search requires annulment-identity-search access. You can still enter details manually on the form.
          </div>
        )}
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="annulment-lookup-doc-type">Document type</label>
            <select id="annulment-lookup-doc-type" value={documentType} disabled={!canSearch} onChange={(e) => setDocumentType(e.target.value)} data-testid="annulment-identity-lookup-doc-type">
              {["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE", "OTHER"].map((key) => (
                <option key={key} value={key}>
                  {DOCUMENT_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="crvs-form-group">
            <label htmlFor="annulment-lookup-doc-number">Document / NIN number</label>
            <input id="annulment-lookup-doc-number" value={documentNumber} disabled={!canSearch} onChange={(e) => setDocumentNumber(e.target.value)} data-testid="annulment-identity-lookup-input" />
          </div>
        </div>
        <Button
          text="Search"
          appearance="primary"
          type="button"
          loading={searching}
          disabled={!canSearch || !documentNumber.trim() || searching}
          onClick={handleSearch}
          testId="annulment-identity-lookup-search"
        />

        {result?.state === "SERVICE_UNAVAILABLE" && (
          <div className="crvs-banner crvs-banner-warning">
            <Icon name="cloud_off" /> The identity service is temporarily unavailable. Continue and let a reviewer resolve the identity manually.
          </div>
        )}
        {result?.state === "NO_MATCH" && (
          <div className="crvs-banner crvs-banner-info">
            <Icon name="search_off" /> No matching identity found. Enter the details manually — the reviewer will see this as an unverified identity.
          </div>
        )}
        {(result?.state === "MATCH_FOUND" || result?.state === "MULTIPLE_MATCHES") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="crvs-form-hint">
              {result.state === "MULTIPLE_MATCHES"
                ? "Multiple possible matches were found. The case is flagged for manual identity review; every candidate is listed below."
                : "One confident match was found and linked to this case."}
            </p>
            {result.matches.map((m) => (
              <div key={m.identityId} className="crvs-case-card">
                <strong>
                  {m.firstName} {m.lastName}
                </strong>
                <div className="crvs-form-hint">
                  DOB {m.dob} · {m.nationality} · identity {m.identityId}
                </div>
              </div>
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
