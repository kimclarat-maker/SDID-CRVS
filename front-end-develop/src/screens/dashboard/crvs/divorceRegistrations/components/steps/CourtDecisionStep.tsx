import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import { DivorceDecisionType, DivorceJudgment } from "@/domain/crvs/types";
import { divorcePolicyConfig, isJudgmentFinalityValid } from "@/domain/crvs/divorcePolicyConfig";
import { DIVORCE_DECISION_TYPE_LABELS } from "../../../divorceShared";

/** Wizard step 5 (spec §3/§6): the court decision itself. Deliberately narrow
 * — country, court, case number, judgment number, dates, decision type and
 * effective date only. No grounds, custody, maintenance, property division or
 * private testimony is ever collected here. */
export default function CourtDecisionStep({ draft, onChange, readOnly }: DivorceWizardStepProps) {
  const judgment = draft.judgment;
  const setJudgment = (patch: Partial<DivorceJudgment>) => onChange({ judgment: { ...judgment, ...patch } });

  const finalityValid = isJudgmentFinalityValid(judgment.judgmentDate, judgment.finalityDate);
  const missingRequired = divorcePolicyConfig.requiredJudgmentFields.filter((field) => !judgment[field]);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Court decision</h2>
      <p className="crvs-form-hint">
        Record only what identifies the decision. Grounds, custody, maintenance, property division and private court testimony are never captured by this system.
      </p>

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-country">Country</label>
          <input id="divorce-judgment-country" value={judgment.country} disabled={readOnly} onChange={(e) => setJudgment({ country: e.target.value })} data-testid="divorce-judgment-country" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-court">Court or authority</label>
          <input id="divorce-judgment-court" value={judgment.courtOrAuthorityName} disabled={readOnly} onChange={(e) => setJudgment({ courtOrAuthorityName: e.target.value })} data-testid="divorce-judgment-court" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-case">Court case number</label>
          <input id="divorce-judgment-case" value={judgment.courtCaseNumber} disabled={readOnly} onChange={(e) => setJudgment({ courtCaseNumber: e.target.value })} data-testid="divorce-judgment-case" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-number">Judgment number</label>
          <input id="divorce-judgment-number" value={judgment.judgmentNumber} disabled={readOnly} onChange={(e) => setJudgment({ judgmentNumber: e.target.value })} data-testid="divorce-judgment-number" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-date">Judgment date</label>
          <input id="divorce-judgment-date" type="date" value={judgment.judgmentDate?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setJudgment({ judgmentDate: e.target.value })} data-testid="divorce-judgment-date" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-finality-date">Date the decision became final</label>
          <input id="divorce-finality-date" type="date" value={judgment.finalityDate?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setJudgment({ finalityDate: e.target.value })} data-testid="divorce-finality-date" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-decision-type">Decision type</label>
          <select id="divorce-decision-type" value={judgment.decisionType} disabled={readOnly} onChange={(e) => setJudgment({ decisionType: e.target.value as DivorceDecisionType })}>
            {(Object.keys(DIVORCE_DECISION_TYPE_LABELS) as DivorceDecisionType[]).map((key) => (
              <option key={key} value={key}>
                {DIVORCE_DECISION_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-effective-date">Proposed registration effective date</label>
          <input
            id="divorce-effective-date"
            type="date"
            value={judgment.registrationEffectiveDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ registrationEffectiveDate: e.target.value })}
            data-testid="divorce-effective-date"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-court-registry-ref">Court registry reference</label>
          <input id="divorce-court-registry-ref" value={judgment.courtRegistryReference || ""} disabled={readOnly} onChange={(e) => setJudgment({ courtRegistryReference: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-verification-source">Verification source</label>
          <input id="divorce-verification-source" value={judgment.verificationSource || ""} disabled={readOnly} onChange={(e) => setJudgment({ verificationSource: e.target.value })} />
        </div>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="divorce-foreign-toggle" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            id="divorce-foreign-toggle"
            type="checkbox"
            checked={judgment.isForeign}
            disabled={readOnly}
            onChange={(e) => setJudgment({ isForeign: e.target.checked })}
            data-testid="divorce-judgment-is-foreign"
          />
          This decision was granted outside the country
        </label>
        {judgment.isForeign && (
          <p className="crvs-form-hint">
            Foreign decisions always require translation, authentication and recognition checks, plus a supervisor legal review, before they can be approved.
          </p>
        )}
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="divorce-judgment-notes">Notes for staff (optional)</label>
        <textarea id="divorce-judgment-notes" rows={3} value={judgment.notesForStaff || ""} disabled={readOnly} onChange={(e) => setJudgment({ notesForStaff: e.target.value })} />
        <p className="crvs-form-hint">Operational notes only — never record allegations or private court testimony here.</p>
      </div>

      {missingRequired.length > 0 && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>Still required before submission: {missingRequired.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.</span>
        </div>
      )}

      {judgment.judgmentDate && !finalityValid && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="gavel" />
          <span>
            {judgment.finalityDate
              ? "The finality date cannot precede the judgment date."
              : `No finality date is recorded. A decision must be reported as final before approval; ${divorcePolicyConfig.finality.presumedFinalAfterDays} days after judgment it is only presumed final for display, never for the approval checklist.`}
          </span>
        </div>
      )}
    </div>
  );
}
