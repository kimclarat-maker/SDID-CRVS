import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import { DivorceProcessingOffice, DivorceProcessingOfficeJurisdictionResult } from "@/domain/crvs/types";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";

const JURISDICTION_RESULT_LABELS: Record<DivorceProcessingOfficeJurisdictionResult, string> = {
  CONFIRMED: "Confirmed",
  ALTERNATIVE_REQUIRES_REASON: "Alternative office — reason required",
  UNRESOLVED: "Unresolved",
};

/** Wizard step 7 (spec §3): which office processes this case, and whether
 * that satisfies the configured jurisdiction rule. Both the rule and the
 * permitted office types come from divorcePolicyConfig.jurisdiction. */
export default function ProcessingOfficeStep({ draft, onChange, readOnly }: DivorceWizardStepProps) {
  const office = draft.processingOffice;
  const setOffice = (patch: Partial<DivorceProcessingOffice>) => onChange({ processingOffice: { ...office, ...patch } });

  const reasonRequired = divorcePolicyConfig.jurisdiction.alternativeOfficeRequiresReason && office.jurisdictionResult === "ALTERNATIVE_REQUIRES_REASON";

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Processing office and jurisdiction</h2>
      <p className="crvs-form-hint">
        Configured rule: {divorcePolicyConfig.jurisdiction.rule.replace(/_/g, " ").toLowerCase()}. Permitted office types:{" "}
        {divorcePolicyConfig.jurisdiction.permittedOfficeTypes.map((t) => t.replace(/_/g, " ").toLowerCase()).join(", ")}.
      </p>

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-office-name">Processing office</label>
          <input id="divorce-office-name" value={office.selectedProcessingOfficeName} disabled={readOnly} onChange={(e) => setOffice({ selectedProcessingOfficeName: e.target.value })} data-testid="divorce-office-name" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-office-id">Processing office ID</label>
          <input id="divorce-office-id" value={office.selectedProcessingOfficeId} disabled={readOnly} onChange={(e) => setOffice({ selectedProcessingOfficeId: e.target.value })} data-testid="divorce-office-id" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-office-marriage">Office where the marriage was registered</label>
          <input id="divorce-office-marriage" value={office.marriageRegisteredOfficeName || ""} disabled={readOnly} onChange={(e) => setOffice({ marriageRegisteredOfficeName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-office-domicile">Applicant&apos;s domicile office</label>
          <input id="divorce-office-domicile" value={office.applicantDomicileOfficeName || ""} disabled={readOnly} onChange={(e) => setOffice({ applicantDomicileOfficeName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-jurisdiction">Jurisdiction</label>
          <input id="divorce-jurisdiction" value={draft.jurisdiction} disabled={readOnly} onChange={(e) => onChange({ jurisdiction: e.target.value })} data-testid="divorce-jurisdiction" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-jurisdiction-result">Jurisdiction result</label>
          <select
            id="divorce-jurisdiction-result"
            value={office.jurisdictionResult}
            disabled={readOnly}
            onChange={(e) => setOffice({ jurisdictionResult: e.target.value as DivorceProcessingOfficeJurisdictionResult })}
            data-testid="divorce-jurisdiction-result"
          >
            {(Object.keys(JURISDICTION_RESULT_LABELS) as DivorceProcessingOfficeJurisdictionResult[]).map((key) => (
              <option key={key} value={key}>
                {JURISDICTION_RESULT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="divorce-embassy-path" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            id="divorce-embassy-path"
            type="checkbox"
            checked={office.embassyOrForeignOfficePath}
            disabled={readOnly}
            onChange={(e) => setOffice({ embassyOrForeignOfficePath: e.target.checked })}
            data-testid="divorce-embassy-path"
          />
          Processed through an embassy or consular office
        </label>
      </div>

      {reasonRequired && (
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor="divorce-alternative-reason">Reason for using an alternative office</label>
          <textarea id="divorce-alternative-reason" rows={3} value={office.alternativeReason || ""} disabled={readOnly} onChange={(e) => setOffice({ alternativeReason: e.target.value })} data-testid="divorce-alternative-reason" />
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
