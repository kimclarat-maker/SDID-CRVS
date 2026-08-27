import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import ExistingMarriageSearchModal from "../modals/ExistingMarriageSearchModal";
import { EXISTING_MARRIAGE_MATCH_LABELS, formatDate, formatDateTime } from "../../../divorceShared";

/** Wizard step 2 (spec §3 Step 3): identify the marriage this divorce
 * dissolves. Nothing here can be typed in freehand — a marriage is either
 * selected from the registry or explicitly marked not found, which routes
 * the case to exception review. */
export default function ExistingMarriageStep({ draft, onCaseSynced, readOnly }: DivorceWizardStepProps) {
  const [showSearch, setShowSearch] = useState(false);
  const match = draft.existingMarriage;

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Existing marriage</h2>
      <p className="crvs-form-hint">
        A divorce can only be registered against a marriage already on record. Search the registry and select the correct marriage, or record that it cannot be found.
      </p>

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
        <Icon name="link" />
        <span>
          Match status: <strong>{EXISTING_MARRIAGE_MATCH_LABELS[match.status]}</strong>
          {match.searchedAt ? ` · searched ${formatDateTime(match.searchedAt)} by ${match.searchedBy || "—"}` : ""}
        </span>
      </div>

      {match.selected ? (
        <div className="crvs-case-card" style={{ marginTop: 12 }}>
          <div className="crvs-case-card-header">
            <strong>{match.selected.registrationNumber}</strong>
            <span className="crvs-status-pill crvs-status-success">Selected</span>
          </div>
          <div className="crvs-form-hint">
            {match.selected.spouse1Name} &amp; {match.selected.spouse2Name} · married {formatDate(match.selected.marriageDate)} ·{" "}
            {match.selected.marriagePlace || match.selected.officeName || "Office not recorded"}
          </div>
        </div>
      ) : match.status === "NOT_FOUND" ? (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="report" />
          <span>The marriage record could not be located. This case is routed for exception review; a supervisor decides whether the supporting evidence is sufficient.</span>
        </div>
      ) : (
        <p className="crvs-form-hint" style={{ marginTop: 12 }}>
          No marriage has been linked to this case yet.
        </p>
      )}

      {match.searchCriteria && (
        <div style={{ marginTop: 12 }}>
          <h3 className="crvs-section-title">Search criteria used</h3>
          <p className="crvs-form-hint">
            {Object.entries(match.searchCriteria)
              .filter(([, value]) => !!value)
              .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${value}`)
              .join(" · ") || "No criteria recorded."}
          </p>
        </div>
      )}

      {match.notFoundEvidence.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 className="crvs-section-title">Marriage evidence provided instead</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {match.notFoundEvidence.map((ev) => (
              <li key={ev.id} className="crvs-banner crvs-banner-info">
                <strong>{ev.documentType}</strong> — {ev.fileName}
                <div className="crvs-form-hint">
                  Uploaded {formatDateTime(ev.uploadedAt)} by {ev.uploadedBy} · {ev.verification.replace(/_/g, " ").toLowerCase()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && (
        <div style={{ marginTop: 12 }}>
          <Button text={match.selected ? "Search again" : "Search the marriage registry"} appearance="primary" type="button" onClick={() => setShowSearch(true)} testId="divorce-wizard-search-marriage" />
        </div>
      )}

      <ExistingMarriageSearchModal show={showSearch} onClose={() => setShowSearch(false)} registration={draft} onUpdated={onCaseSynced} />
    </div>
  );
}
