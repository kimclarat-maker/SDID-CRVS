import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { divorcePolicyConfig, isJudgmentFinalityValid } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceDecisionType, DivorceJudgment } from "@/domain/crvs/types";
import { DIVORCE_DECISION_TYPE_LABELS, divorceDocumentLabel } from "../../../divorceShared";

const DECISION_TYPES: DivorceDecisionType[] = ["MUTUAL_CONSENT", "CONTESTED", "DEFAULT_JUDGMENT", "OTHER"];

/**
 * Wizard step 6 — the court decision being registered.
 *
 * Deliberately narrow: it captures who issued the decision, its identifying
 * numbers, and its dates. It asks for nothing about the grounds for the
 * divorce, the allegations made, what was said in court, or how custody,
 * maintenance or property were dealt with. Those belong to the court file,
 * not to the civil register (spec §1, §6).
 */
export default function CourtDecisionStep({ draft, onChange, errors, readOnly }: DivorceWizardStepProps) {
  const judgment = draft.judgment;

  const setJudgment = (patch: Partial<DivorceJudgment>) => {
    const next: DivorceJudgment = { ...judgment, ...patch };
    const foreignChanged = patch.isForeign !== undefined && patch.isForeign !== judgment.isForeign;
    onChange({
      judgment: next,
      // Keep the foreign-recognition record in step with the judgment's own
      // foreign flag; the requirement defaults come from policy config, never
      // from this component.
      ...(foreignChanged
        ? {
            foreignRecognition: next.isForeign
              ? {
                  ...draft.foreignRecognition,
                  status: "PENDING" as const,
                  country: next.country,
                  foreignCourtOrAuthority: next.courtOrAuthorityName,
                  translationRequired: divorcePolicyConfig.foreignJudgment.translationRequiredByDefault,
                  authenticationRequired: divorcePolicyConfig.foreignJudgment.authenticationRequiredByDefault,
                  exequaturOrRecognitionRequired: divorcePolicyConfig.foreignJudgment.exequaturOrRecognitionRequiredByDefault,
                }
              : {
                  ...draft.foreignRecognition,
                  status: "NOT_APPLICABLE" as const,
                  translationRequired: false,
                  authenticationRequired: false,
                  exequaturOrRecognitionRequired: false,
                },
          }
        : {}),
    });
  };

  const finalityInvalid =
    divorcePolicyConfig.finality.finalityCannotPrecedeJudgment &&
    !!judgment.judgmentDate &&
    !!judgment.finalityDate &&
    !isJudgmentFinalityValid(judgment.judgmentDate, judgment.finalityDate);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">The court decision</h2>
      <ErrorSummary errors={errors} />

      <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
        <Icon name="info" />
        <div>
          <strong>Copy these details straight from your judgment.</strong>
          <p style={{ margin: "6px 0 0" }}>
            You are not asked why the divorce was granted, what was argued, or what the court decided about children,
            maintenance or property. The registry records only that a competent court ended the marriage, and when.
          </p>
        </div>
      </div>

      <div className="crvs-form-grid" style={{ marginTop: 16 }}>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-country">Country where the decision was issued</label>
          <input
            id="divorce-judgment-country"
            value={judgment.country}
            disabled={readOnly}
            onChange={(e) => setJudgment({ country: e.target.value })}
            data-testid="divorce-judgment-country"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-court">Court or authority that granted the divorce</label>
          <input
            id="divorce-judgment-court"
            value={judgment.courtOrAuthorityName}
            disabled={readOnly}
            onChange={(e) => setJudgment({ courtOrAuthorityName: e.target.value })}
            data-testid="divorce-judgment-court"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-case-number">Court case number</label>
          <input
            id="divorce-judgment-case-number"
            value={judgment.courtCaseNumber}
            disabled={readOnly}
            onChange={(e) => setJudgment({ courtCaseNumber: e.target.value })}
            data-testid="divorce-judgment-case-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-number">Judgment or order number</label>
          <input
            id="divorce-judgment-number"
            value={judgment.judgmentNumber}
            disabled={readOnly}
            onChange={(e) => setJudgment({ judgmentNumber: e.target.value })}
            data-testid="divorce-judgment-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-date">Date of the judgment</label>
          <input
            id="divorce-judgment-date"
            type="date"
            value={judgment.judgmentDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ judgmentDate: e.target.value })}
            data-testid="divorce-judgment-date"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-finality-date">Date the decision became final</label>
          <input
            id="divorce-judgment-finality-date"
            type="date"
            value={judgment.finalityDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ finalityDate: e.target.value })}
            aria-invalid={finalityInvalid}
            data-testid="divorce-judgment-finality-date"
          />
          <p className="crvs-form-hint">
            The date the decision could no longer be appealed. It is usually shown on a certificate of non-appeal.
          </p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-decision-type">Type of decision</label>
          <select
            id="divorce-judgment-decision-type"
            value={judgment.decisionType}
            disabled={readOnly}
            onChange={(e) => setJudgment({ decisionType: e.target.value as DivorceDecisionType })}
            data-testid="divorce-judgment-decision-type"
          >
            {DECISION_TYPES.map((type) => (
              <option key={type} value={type}>
                {DIVORCE_DECISION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-effective-date">Date the divorce takes effect (optional)</label>
          <input
            id="divorce-judgment-effective-date"
            type="date"
            value={judgment.registrationEffectiveDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ registrationEffectiveDate: e.target.value })}
          />
          <p className="crvs-form-hint">Leave blank if the decision does not state a separate effective date.</p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-registry-reference">Court registry reference (optional)</label>
          <input
            id="divorce-judgment-registry-reference"
            value={judgment.courtRegistryReference || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ courtRegistryReference: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="divorce-judgment-verification-source">How can the court confirm this decision? (optional)</label>
          <input
            id="divorce-judgment-verification-source"
            value={judgment.verificationSource || ""}
            disabled={readOnly}
            onChange={(e) => setJudgment({ verificationSource: e.target.value })}
            placeholder="Registry office, contact or reference the registrar can check"
          />
        </div>
      </div>

      {finalityInvalid && (
        <p className="crvs-form-error" role="alert" style={{ marginTop: 8 }}>
          The date the decision became final cannot be earlier than the judgment date.
        </p>
      )}

      <div className="crvs-form-group" style={{ marginTop: 16 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            id="divorce-judgment-is-foreign"
            checked={judgment.isForeign}
            disabled={readOnly}
            onChange={(e) => setJudgment({ isForeign: e.target.checked })}
            data-testid="divorce-judgment-is-foreign"
          />
          This divorce was granted by a court or authority outside this country.
        </label>
      </div>

      {judgment.isForeign && (
        <div className="crvs-banner crvs-banner-warning" style={{ alignItems: "flex-start" }}>
          <Icon name="public" />
          <div>
            <strong>A decision issued abroad has extra requirements</strong>
            <ul style={{ margin: "6px 0 0", paddingInlineStart: 20 }}>
              {divorcePolicyConfig.foreignJudgment.translationRequiredByDefault && (
                <li>{divorceDocumentLabel("CERTIFIED_TRANSLATION")}</li>
              )}
              {divorcePolicyConfig.foreignJudgment.authenticationRequiredByDefault && (
                <li>{divorceDocumentLabel("AUTHENTICATION_LEGALIZATION")}</li>
              )}
              {divorcePolicyConfig.foreignJudgment.exequaturOrRecognitionRequiredByDefault && (
                <li>{divorceDocumentLabel("EXEQUATUR_OR_RECOGNITION_JUDGMENT")}</li>
              )}
            </ul>
            {divorcePolicyConfig.foreignJudgment.alwaysRequiresSupervisorLegalReview && (
              <p style={{ margin: "6px 0 0" }}>
                A supervisor always reviews a decision issued abroad before it can be registered. Allow up to{" "}
                {divorcePolicyConfig.sla.foreignReviewDays} working days for that review.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="crvs-form-group" style={{ marginTop: 16 }}>
        <label htmlFor="divorce-judgment-notes">Anything the registrar should know (optional)</label>
        <textarea
          id="divorce-judgment-notes"
          rows={3}
          value={judgment.notesForStaff || ""}
          disabled={readOnly}
          onChange={(e) => setJudgment({ notesForStaff: e.target.value })}
          data-testid="divorce-judgment-notes"
        />
        <p className="crvs-form-hint">
          Use this only for practical notes about the paperwork — for example a name spelled differently on the judgment
          than on the marriage record. Do not describe the reasons for the divorce or anything said in court.
        </p>
      </div>
    </div>
  );
}
