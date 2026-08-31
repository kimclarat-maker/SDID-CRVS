import Icon from "@/components/icon";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import { AnnulmentDecision, AnnulmentDecisionType } from "@/domain/crvs/types";
import { annulmentPolicyConfig, isDecisionFinalityValid } from "@/domain/crvs/annulmentPolicyConfig";
import { ANNULMENT_DECISION_TYPE_LABELS } from "../../../annulmentShared";

const DESCRIBES_MARRIAGE_LABELS: Record<AnnulmentDecision["describesMarriageAs"], string> = {
  VOID: "Void",
  VOIDABLE: "Voidable",
  UNSPECIFIED: "Unspecified in the decision",
};

/** Wizard step 5 (spec §11 Step 6): the court/authority decision itself.
 * Deliberately narrow — no grounds, allegations, testimony or medical detail
 * is ever collected here. Captures the raw void/voidable fact and the
 * decision's own legal-effect wording verbatim, but never the final
 * legal-effect classification itself — that is set later by authorized staff
 * on the Legal Effect review, never by the applicant or this step (mirrors
 * the divorce module's CourtDecisionStep). */
export default function AnnulmentDecisionStep({ draft, onChange, readOnly }: AnnulmentWizardStepProps) {
  const decision = draft.decision;
  const setDecision = (patch: Partial<AnnulmentDecision>) => onChange({ decision: { ...decision, ...patch } });

  const finalityValid = isDecisionFinalityValid(decision.decisionDate, decision.finalityDate);
  const missingRequired = annulmentPolicyConfig.requiredDecisionFields.filter((field) => !decision[field]);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Annulment decision</h2>
      <p className="crvs-form-hint">
        Record only what identifies the decision. Grounds, allegations, testimony and private court detail are never captured by this system — this module registers a decision a competent authority has
        already made.
      </p>

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-country">Country</label>
          <input id="annulment-decision-country" value={decision.country} disabled={readOnly} onChange={(e) => setDecision({ country: e.target.value })} data-testid="annulment-decision-country" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-court">Court or authority</label>
          <input id="annulment-decision-court" value={decision.courtOrAuthorityName} disabled={readOnly} onChange={(e) => setDecision({ courtOrAuthorityName: e.target.value })} data-testid="annulment-decision-court" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-jurisdiction">Jurisdiction</label>
          <input id="annulment-decision-jurisdiction" value={decision.jurisdiction} disabled={readOnly} onChange={(e) => setDecision({ jurisdiction: e.target.value })} data-testid="annulment-decision-jurisdiction" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-case">Court case number</label>
          <input id="annulment-decision-case" value={decision.courtCaseNumber} disabled={readOnly} onChange={(e) => setDecision({ courtCaseNumber: e.target.value })} data-testid="annulment-decision-case" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-number">Decision number</label>
          <input id="annulment-decision-number" value={decision.decisionNumber} disabled={readOnly} onChange={(e) => setDecision({ decisionNumber: e.target.value })} data-testid="annulment-decision-number" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-date">Decision date</label>
          <input id="annulment-decision-date" type="date" value={decision.decisionDate?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setDecision({ decisionDate: e.target.value })} data-testid="annulment-decision-date" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-finality-date">Date the decision became final</label>
          <input id="annulment-finality-date" type="date" value={decision.finalityDate?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setDecision({ finalityDate: e.target.value })} data-testid="annulment-finality-date" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-type">Decision type</label>
          <select id="annulment-decision-type" value={decision.decisionType} disabled={readOnly} onChange={(e) => setDecision({ decisionType: e.target.value as AnnulmentDecisionType })}>
            {(Object.keys(ANNULMENT_DECISION_TYPE_LABELS) as AnnulmentDecisionType[]).map((key) => (
              <option key={key} value={key}>
                {ANNULMENT_DECISION_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-effective-date">Effective date as reported</label>
          <input
            id="annulment-decision-effective-date"
            type="date"
            value={decision.effectiveDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ effectiveDate: e.target.value })}
            data-testid="annulment-decision-effective-date"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-describes-marriage-as">Decision describes the marriage as</label>
          <select
            id="annulment-describes-marriage-as"
            value={decision.describesMarriageAs}
            disabled={readOnly}
            onChange={(e) => setDecision({ describesMarriageAs: e.target.value as AnnulmentDecision["describesMarriageAs"] })}
            data-testid="annulment-describes-marriage-as"
          >
            {(Object.keys(DESCRIBES_MARRIAGE_LABELS) as AnnulmentDecision["describesMarriageAs"][]).map((key) => (
              <option key={key} value={key}>
                {DESCRIBES_MARRIAGE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-court-registry-ref">Court registry reference</label>
          <input id="annulment-court-registry-ref" value={decision.courtRegistryReference || ""} disabled={readOnly} onChange={(e) => setDecision({ courtRegistryReference: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-verification-source">Verification source</label>
          <input id="annulment-verification-source" value={decision.verificationSource || ""} disabled={readOnly} onChange={(e) => setDecision({ verificationSource: e.target.value })} />
        </div>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="annulment-legal-effect-wording">Legal-effect wording from the decision (optional)</label>
        <textarea
          id="annulment-legal-effect-wording"
          rows={3}
          value={decision.legalEffectWording || ""}
          disabled={readOnly}
          onChange={(e) => setDecision({ legalEffectWording: e.target.value })}
          data-testid="annulment-legal-effect-wording"
        />
        <p className="crvs-form-hint">
          <Icon name="info" /> Verbatim or near-verbatim text from the decision, if available. This is never the final legal-effect classification — authorized staff make that determination separately,
          after review.
        </p>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="annulment-foreign-toggle" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input id="annulment-foreign-toggle" type="checkbox" checked={decision.isForeign} disabled={readOnly} onChange={(e) => setDecision({ isForeign: e.target.checked })} data-testid="annulment-decision-is-foreign" />
          This decision was granted outside the country
        </label>
        {decision.isForeign && (
          <p className="crvs-form-hint">Foreign decisions always require translation, authentication and recognition checks, plus a supervisor legal review, before they can be approved.</p>
        )}
      </div>

      <div className="crvs-form-group" style={{ marginTop: 12 }}>
        <label htmlFor="annulment-decision-notes">Notes for staff (optional)</label>
        <textarea id="annulment-decision-notes" rows={3} value={decision.notesForStaff || ""} disabled={readOnly} onChange={(e) => setDecision({ notesForStaff: e.target.value })} />
        <p className="crvs-form-hint">Operational notes only — never record allegations or private court testimony here.</p>
      </div>

      {missingRequired.length > 0 && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="warning" />
          <span>Still required before submission: {missingRequired.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.</span>
        </div>
      )}

      {decision.decisionDate && !finalityValid && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12 }}>
          <Icon name="gavel" />
          <span>
            {decision.finalityDate
              ? "The finality date cannot precede the decision date."
              : `No finality date is recorded. A decision must be reported as final before approval; ${annulmentPolicyConfig.finality.presumedFinalAfterDays} days after the decision it is only presumed final for display, never for the approval checklist.`}
          </span>
        </div>
      )}
    </div>
  );
}
