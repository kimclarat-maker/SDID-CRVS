import Icon from "@/components/icon";
import { WizardStepProps } from "../wizardTypes";
import { marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { MarriageOfficeType } from "@/domain/crvs/types";
import { DEMO_MARRIAGE_OFFICE_ID, DEMO_MARRIAGE_OFFICE_NAME, DEMO_JURISDICTION } from "@/demo/seed/crvsAccounts";

/** Wizard step 1: service and jurisdiction (spec §9 step 1) — sector/embassy
 * office, residence/domicile, proposed service office, standard vs
 * special-day request, and a policy-derived eligibility message that reads
 * straight from marriagePolicyConfig rather than a hardcoded string. */
export default function ServiceJurisdictionStep({ draft, onChange, readOnly }: WizardStepProps) {
  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Service and jurisdiction</h2>

      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="svc-office-type">Office type</label>
          <select
            id="svc-office-type"
            value={draft.officeType}
            disabled={readOnly}
            onChange={(e) => onChange({ officeType: e.target.value as MarriageOfficeType })}
          >
            <option value="DISTRICT_SECTOR_OFFICE">District / sector civil registration office</option>
            <option value="EMBASSY_CONSULATE">Embassy or consulate</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="svc-office-name">Processing office</label>
          <input
            id="svc-office-name"
            value={draft.officeName}
            disabled={readOnly}
            onChange={(e) => onChange({ officeName: e.target.value, officeId: draft.officeId || DEMO_MARRIAGE_OFFICE_ID })}
            data-testid="wizard-office-name"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="svc-jurisdiction">Jurisdiction</label>
          <input id="svc-jurisdiction" value={draft.jurisdiction} disabled={readOnly} onChange={(e) => onChange({ jurisdiction: e.target.value })} />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, margin: "16px 0" }}>
        <input
          type="checkbox"
          disabled={readOnly}
          checked={draft.isSpecialDayRequest}
          onChange={(e) => onChange({ isSpecialDayRequest: e.target.checked })}
          data-testid="wizard-special-day"
        />
        This is a special-day (high-volume) ceremony request
      </label>

      <div className="crvs-banner crvs-banner-info">
        <Icon name="info" /> A minimum of {marriagePolicyConfig.notice.minAdvanceNoticeDays} days' advance notice is required
        between approval and the ceremony date
        {marriagePolicyConfig.ceremony.bothSpousesMustBePhysicallyPresent ? "; both applicants must appear in person at the ceremony." : "."}
      </div>

      {!draft.officeName && (
        <button type="button" className="crvs-tab" style={{ marginTop: 8 }} onClick={() => onChange({ officeId: DEMO_MARRIAGE_OFFICE_ID, officeName: DEMO_MARRIAGE_OFFICE_NAME, jurisdiction: draft.jurisdiction || DEMO_JURISDICTION })} disabled={readOnly}>
          Use nearest demo office ({DEMO_MARRIAGE_OFFICE_NAME})
        </button>
      )}
    </div>
  );
}
