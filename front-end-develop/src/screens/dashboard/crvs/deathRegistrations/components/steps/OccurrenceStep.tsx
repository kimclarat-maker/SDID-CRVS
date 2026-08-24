import { WizardStepProps } from "../wizardTypes";
import { DeathOccurrence } from "@/domain/crvs/types";
import { PLACE_CATEGORY_LABELS, CIRCUMSTANCE_LABELS, todayIsoDate } from "../../../deathShared";

/** Wizard step 1: death occurrence — date/time, place, administrative
 * location, jurisdiction, circumstances (spec §5 step 2). */
export default function OccurrenceStep({ draft, onChange, readOnly }: WizardStepProps) {
  const occurrence = draft.occurrence;
  const setOccurrence = (patch: Partial<DeathOccurrence>) => onChange({ occurrence: { ...occurrence, ...patch } });

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Death occurrence</h2>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="occ-date">Date of death</label>
          <input
            id="occ-date"
            type="date"
            value={occurrence.dateOfDeath?.slice(0, 10) || ""}
            max={todayIsoDate()}
            disabled={readOnly}
            onChange={(e) => setOccurrence({ dateOfDeath: e.target.value })}
            data-testid="wizard-date-of-death"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="occ-time">Time of death (optional)</label>
          <input id="occ-time" type="time" value={occurrence.timeOfDeath || ""} disabled={readOnly} onChange={(e) => setOccurrence({ timeOfDeath: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="occ-place-cat">Place category</label>
          <select id="occ-place-cat" value={occurrence.placeCategory} disabled={readOnly} onChange={(e) => setOccurrence({ placeCategory: e.target.value as DeathOccurrence["placeCategory"] })}>
            {(Object.keys(PLACE_CATEGORY_LABELS) as (keyof typeof PLACE_CATEGORY_LABELS)[]).map((k) => (
              <option key={k} value={k}>
                {PLACE_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        {occurrence.placeCategory === "HEALTH_FACILITY" && (
          <div className="crvs-form-group">
            <label htmlFor="occ-facility">Facility</label>
            <input id="occ-facility" value={occurrence.facilityName || ""} disabled={readOnly} onChange={(e) => setOccurrence({ facilityName: e.target.value })} />
          </div>
        )}
        <div className="crvs-form-group">
          <label htmlFor="occ-location">Location</label>
          <input id="occ-location" value={occurrence.location} disabled={readOnly} onChange={(e) => setOccurrence({ location: e.target.value })} data-testid="wizard-location" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="occ-admin-location">Administrative location</label>
          <input id="occ-admin-location" value={occurrence.adminLocation} disabled={readOnly} onChange={(e) => setOccurrence({ adminLocation: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="occ-jurisdiction">Jurisdiction</label>
          <input
            id="occ-jurisdiction"
            value={occurrence.jurisdiction}
            disabled={readOnly}
            onChange={(e) => {
              setOccurrence({ jurisdiction: e.target.value });
              onChange({ jurisdiction: e.target.value });
            }}
          />
          <p className="crvs-form-hint">Derived from where the death occurred, per policy (crvsPolicyConfig.jurisdictionRule).</p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="occ-circumstance">Circumstances category</label>
          <select id="occ-circumstance" value={occurrence.circumstanceCategory} disabled={readOnly} onChange={(e) => setOccurrence({ circumstanceCategory: e.target.value as DeathOccurrence["circumstanceCategory"] })}>
            {(Object.keys(CIRCUMSTANCE_LABELS) as (keyof typeof CIRCUMSTANCE_LABELS)[]).map((k) => (
              <option key={k} value={k}>
                {CIRCUMSTANCE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="occ-note">Circumstance note (optional)</label>
          <textarea id="occ-note" rows={2} value={occurrence.circumstanceNote || ""} disabled={readOnly} onChange={(e) => setOccurrence({ circumstanceNote: e.target.value })} />
        </div>
      </div>
      {draft.isLate && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          This is being reported {draft.daysAfterDeath} days after death, which qualifies as a late registration and will
          route to supervisor review.
        </div>
      )}
    </div>
  );
}
