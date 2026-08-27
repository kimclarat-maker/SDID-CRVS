import Icon from "@/components/icon";
import { WizardStepProps } from "../wizardTypes";
import { marriagePolicyConfig, isSpecialDay, isAdvanceNoticeSatisfied, feeFor } from "@/domain/crvs/marriagePolicyConfig";
import { PropertyRegime } from "@/domain/crvs/types";
import { currencyLabel } from "../../../marriageShared";

const PROPERTY_REGIME_LABELS: Record<PropertyRegime, string> = {
  COMMUNITY_OF_PROPERTY: "Community of property",
  SEPARATION_OF_PROPERTY: "Separation of property",
  LIMITED_COMMUNITY_OF_PROPERTY: "Limited community of property",
};

/** Wizard step 4: proposed marriage details (spec §9 step 4) — date,
 * preferred time window, ceremony type, marriage/property regime, and
 * accessibility notes. All fee/notice numbers read from
 * marriagePolicyConfig, never hardcoded here. */
export default function ProposedMarriageStep({ draft, onChange, readOnly }: WizardStepProps) {
  const date = draft.proposedMarriageDate || "";
  const specialDay = date ? isSpecialDay(date) : false;
  const noticeSatisfied = date ? isAdvanceNoticeSatisfied(draft.createdAt, date) : true;
  const fee = date ? feeFor(date, false) : marriagePolicyConfig.payment.standardFeeAmount;

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Proposed marriage details</h2>

      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="pm-date">Proposed marriage date</label>
          <input
            id="pm-date"
            type="date"
            value={date.slice(0, 10)}
            disabled={readOnly}
            onChange={(e) => onChange({ proposedMarriageDate: e.target.value, isSpecialDayRequest: isSpecialDay(e.target.value) })}
            data-testid="wizard-proposed-date"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="pm-window">Preferred time window</label>
          <select id="pm-window" value={draft.preferredTimeWindow || "MORNING"} disabled={readOnly} onChange={(e) => onChange({ preferredTimeWindow: e.target.value })}>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="pm-ceremony-type">Ceremony type</label>
          <select id="pm-ceremony-type" value={draft.ceremonyType} disabled={readOnly} onChange={(e) => onChange({ ceremonyType: e.target.value as typeof draft.ceremonyType })}>
            <option value="CIVIL">Civil ceremony</option>
            <option value="CIVIL_WITH_RELIGIOUS_RECOGNITION">Civil ceremony with religious recognition</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="pm-regime">Marriage / property regime</label>
          <select id="pm-regime" value={draft.propertyRegime || ""} disabled={readOnly} onChange={(e) => onChange({ propertyRegime: (e.target.value || undefined) as PropertyRegime | undefined })}>
            <option value="">Not specified</option>
            {marriagePolicyConfig.propertyRegimes.map((regime) => (
              <option key={regime} value={regime}>{PROPERTY_REGIME_LABELS[regime]}</option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="pm-accessibility">Language or accessibility support needed</label>
          <textarea id="pm-accessibility" rows={2} value={draft.languageOrAccessibilityNote || ""} disabled={readOnly} onChange={(e) => onChange({ languageOrAccessibilityNote: e.target.value })} />
        </div>
      </div>

      {date && (
        <div className={`crvs-banner ${noticeSatisfied ? "crvs-banner-info" : "crvs-banner-warning"}`} style={{ marginTop: 12 }}>
          <Icon name={noticeSatisfied ? "check_circle" : "warning"} />
          {noticeSatisfied
            ? `This date satisfies the ${marriagePolicyConfig.notice.minAdvanceNoticeDays}-day minimum advance-notice period.`
            : `This date is sooner than the ${marriagePolicyConfig.notice.minAdvanceNoticeDays}-day minimum advance-notice period — an exception review will be required.`}
        </div>
      )}

      {marriagePolicyConfig.payment.required && (
        <div className="crvs-banner crvs-banner-info" style={{ marginTop: 8 }}>
          <Icon name="payments" />
          Estimated fee: {currencyLabel(fee, marriagePolicyConfig.payment.currency)}
          {specialDay ? ` (includes the ${currencyLabel(marriagePolicyConfig.specialDay.additionalFeeAmount, marriagePolicyConfig.payment.currency)} special-day surcharge)` : ""}. Payment is collected after eligibility approval.
        </div>
      )}
    </div>
  );
}
