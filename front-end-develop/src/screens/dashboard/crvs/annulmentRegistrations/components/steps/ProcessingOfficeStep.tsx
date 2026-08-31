import Icon from "@/components/icon";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import { AnnulmentProcessingOffice, AnnulmentProcessingOfficeJurisdictionResult } from "@/domain/crvs/types";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";

const JURISDICTION_RESULT_LABELS: Record<AnnulmentProcessingOfficeJurisdictionResult, string> = {
  CONFIRMED: "Confirmed",
  ALTERNATIVE_REQUIRES_REASON: "Alternative office — reason required",
  UNRESOLVED: "Unresolved",
};

/** Wizard step 7: which office processes this case, and whether that
 * satisfies the configured jurisdiction rule. Both the rule and the permitted
 * office types come from annulmentPolicyConfig.jurisdiction (mirrors the
 * divorce module's ProcessingOfficeStep). */
export default function ProcessingOfficeStep({ draft, onChange, readOnly }: AnnulmentWizardStepProps) {
  const office = draft.processingOffice;
  const setOffice = (patch: Partial<AnnulmentProcessingOffice>) => onChange({ processingOffice: { ...office, ...patch } });

  const reasonRequired = annulmentPolicyConfig.jurisdiction.alternativeOfficeRequiresReason && office.jurisdictionResult === "ALTERNATIVE_REQUIRES_REASON";

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Processing office and jurisdiction</h2>
      <p className="crvs-form-hint">
        Configured rule: {annulmentPolicyConfig.jurisdiction.rule.replace(/_/g, " ").toLowerCase()}. Permitted office types:{" "}
        {annulmentPolicyConfig.jurisdiction.permittedOfficeTypes.map((t) => t.replace(/_/g, " ").toLowerCase()).join(", ")}.
      </p>

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="annulment-office-name">Processing office</label>
          <input id="annulment-office-name" value={office.selectedProcessingOfficeName} disabled={readOnly} onChange={(e) => setOffice({ selectedProcessingOfficeName: e.target.value })} data-testid="annulment-office-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-office-id">Processing office ID</label>
          <input id="annulment-office-id" value={office.selectedProcessingOfficeId} disabled={readOnly} onChange={(e) => setOffice({ selectedProcessingOfficeId: e.target.value })} data-testid="annulment-office-id" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-office-marriage">Office where the marriage was registered</label>
          <input id="annulment-office-marriage" value={office.marriageRegisteredOfficeName || ""} disabled={readOnly} onChange={(e) => setOffice({ marriageRegisteredOfficeName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-office-domicile">Applicant&apos;s domicile office</label>
          <input id="annulment-office-domicile" value={office.applicantDomicileOfficeName || ""} disabled={readOnly} onChange={(e) => setOffice({ applicantDomicileOfficeName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-jurisdiction">Jurisdiction</label>
          <input id="annulment-jurisdiction" value={draft.jurisdiction} disabled={readOnly} onChange={(e) => onChange({ jurisdiction: e.target.value })} data-testid="annulment-jurisdiction" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-jurisdiction-result">Jurisdiction result</label>
          <select
            id="annulment-jurisdiction-result"
            value={office.jurisdictionResult}
            disabled={readOnly}
            onChange={(e) => setOffice({ jurisdictionResult: e.target.value as AnnulmentProcessingOfficeJurisdictionResult })}
            data-testid="annulment-jurisdiction-result"
          >
            {(Object.keys(JURISDICTION_RESULT_LABELS) as AnnulmentProcessingOfficeJurisdictionResult[]).map((key) => (
              <option key={key} value={key}>
                {JURISDICTION_RESULT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="annulment-embassy-path" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            id="annulment-embassy-path"
            type="checkbox"
            checked={office.embassyOrForeignOfficePath}
            disabled={readOnly}
            onChange={(e) => setOffice({ embassyOrForeignOfficePath: e.target.checked })}
            data-testid="annulment-embassy-path"
          />
          Processed through an embassy or consular office
        </label>
      </div>

      {reasonRequired && (
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="annulment-alternative-reason">Reason for using an alternative office</label>
          <textarea id="annulment-alternative-reason" rows={3} value={office.alternativeReason || ""} disabled={readOnly} onChange={(e) => setOffice({ alternativeReason: e.target.value })} data-testid="annulment-alternative-reason" />
        </div>
      )}

      {office.jurisdictionResult === "UNRESOLVED" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>An unresolved jurisdiction will fail the review checklist and route this case to exception review.</span>
        </div>
      )}
    </div>
  );
}
