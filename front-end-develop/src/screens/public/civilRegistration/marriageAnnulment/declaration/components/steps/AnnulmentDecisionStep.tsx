import Icon from "@/components/icon";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { annulmentPolicyConfig, isDecisionFinalityValid } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentDecision, AnnulmentDecisionType } from "@/domain/crvs/types";
import { ANNULMENT_DECISION_TYPE_LABELS, ANNULMENT_DESCRIBES_MARRIAGE_LABELS, annulmentDocumentLabel } from "../../../marriageAnnulmentShared";

const DECISION_TYPES: AnnulmentDecisionType[] = ["COURT_ORDER", "TRIBUNAL_DECISION", "RELIGIOUS_AUTHORITY_DECISION", "ADMINISTRATIVE_DECISION", "OTHER"];
const DESCRIBES_MARRIAGE_OPTIONS: AnnulmentDecision["describesMarriageAs"][] = ["VOID", "VOIDABLE", "UNSPECIFIED"];

/**
 * Wizard step 6 — the annulment decision being registered.
 *
 * Deliberately narrow: it captures who issued the decision, its identifying
 * numbers, its dates, and the raw void/voidable wording taken from the
 * document itself. It asks for nothing about the grounds for the annulment,
 * what was argued, or anything about children, maintenance or property —
 * those belong to the court file, not the civil register (spec §1, §6).
 *
 * "Legal-effect wording" and "describes the marriage as" are captured as raw
 * fact from the decision, never as a classification the applicant chooses —
 * the confirmed legal-effect classification is set later, by authorized
 * staff only (spec §11 Step 6, §17).
 */
export default function AnnulmentDecisionStep({ draft, onChange, errors, readOnly }: AnnulmentWizardStepProps) {
  const decision = draft.decision;

  const setDecision = (patch: Partial<AnnulmentDecision>) => {
    const next: AnnulmentDecision = { ...decision, ...patch };
    const foreignChanged = patch.isForeign !== undefined && patch.isForeign !== decision.isForeign;
    onChange({
      decision: next,
      // Keep the foreign-recognition record in step with the decision's own
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
                  translationRequired: annulmentPolicyConfig.foreignDecision.translationRequiredByDefault,
                  authenticationRequired: annulmentPolicyConfig.foreignDecision.authenticationRequiredByDefault,
                  exequaturOrRecognitionRequired: annulmentPolicyConfig.foreignDecision.exequaturOrRecognitionRequiredByDefault,
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
    annulmentPolicyConfig.finality.finalityCannotPrecedeDecision &&
    !!decision.decisionDate &&
    !!decision.finalityDate &&
    !isDecisionFinalityValid(decision.decisionDate, decision.finalityDate);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">The annulment decision</h2>
      <ErrorSummary errors={errors} />

      <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
        <Icon name="info" />
        <div>
          <strong>Copy these details straight from your decision document.</strong>
          <p style={{ margin: "6px 0 0" }}>
            You are not asked why the marriage was annulled, what was argued, or anything about children, maintenance or
            property. The registry records only that a competent court or authority annulled the marriage, and when —
            plus the raw wording the decision itself uses about the marriage's status, which a registrar reviews
            separately. This form never asks you to decide whether the marriage was void or voidable; that
            classification is made only by authorized staff, from the decision you upload.
          </p>
        </div>
      </div>

      <div className="crvs-form-grid" style={{ marginTop: 16 }}>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-country">Country where the decision was issued</label>
          <input
            id="annulment-decision-country"
            value={decision.country}
            disabled={readOnly}
            onChange={(e) => setDecision({ country: e.target.value })}
            data-testid="annulment-decision-country"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-court">Court or authority that issued the decision</label>
          <input
            id="annulment-decision-court"
            value={decision.courtOrAuthorityName}
            disabled={readOnly}
            onChange={(e) => setDecision({ courtOrAuthorityName: e.target.value })}
            data-testid="annulment-decision-court"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-jurisdiction">Jurisdiction</label>
          <input
            id="annulment-decision-jurisdiction"
            value={decision.jurisdiction}
            disabled={readOnly}
            onChange={(e) => setDecision({ jurisdiction: e.target.value })}
            data-testid="annulment-decision-jurisdiction"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-case-number">Court case number</label>
          <input
            id="annulment-decision-case-number"
            value={decision.courtCaseNumber}
            disabled={readOnly}
            onChange={(e) => setDecision({ courtCaseNumber: e.target.value })}
            data-testid="annulment-decision-case-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-number">Decision number</label>
          <input
            id="annulment-decision-number"
            value={decision.decisionNumber}
            disabled={readOnly}
            onChange={(e) => setDecision({ decisionNumber: e.target.value })}
            data-testid="annulment-decision-number"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-date">Date of the decision</label>
          <input
            id="annulment-decision-date"
            type="date"
            value={decision.decisionDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ decisionDate: e.target.value })}
            data-testid="annulment-decision-date"
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-finality-date">Date the decision became final</label>
          <input
            id="annulment-decision-finality-date"
            type="date"
            value={decision.finalityDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ finalityDate: e.target.value })}
            aria-invalid={finalityInvalid}
            data-testid="annulment-decision-finality-date"
          />
          <p className="crvs-form-hint">
            The date the decision could no longer be appealed. It is usually shown on a certificate of non-appeal.
          </p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-type">Type of decision</label>
          <select
            id="annulment-decision-type"
            value={decision.decisionType}
            disabled={readOnly}
            onChange={(e) => setDecision({ decisionType: e.target.value as AnnulmentDecisionType })}
            data-testid="annulment-decision-type"
          >
            {DECISION_TYPES.map((type) => (
              <option key={type} value={type}>
                {ANNULMENT_DECISION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-effective-date">Date the annulment takes effect (optional)</label>
          <input
            id="annulment-decision-effective-date"
            type="date"
            value={decision.effectiveDate?.slice(0, 10) || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ effectiveDate: e.target.value })}
          />
          <p className="crvs-form-hint">Leave blank if the decision does not state a separate effective date.</p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-describes-marriage-as">Whether the decision describes the marriage as void or voidable</label>
          <select
            id="annulment-decision-describes-marriage-as"
            value={decision.describesMarriageAs}
            disabled={readOnly}
            onChange={(e) => setDecision({ describesMarriageAs: e.target.value as AnnulmentDecision["describesMarriageAs"] })}
            data-testid="annulment-decision-describes-marriage-as"
          >
            {DESCRIBES_MARRIAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ANNULMENT_DESCRIBES_MARRIAGE_LABELS[option]}
              </option>
            ))}
          </select>
          <p className="crvs-form-hint">
            This records what the document itself says, nothing more. A registrar makes the final legal-effect
            classification after reviewing the decision.
          </p>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-registry-reference">Court or authority registry reference (optional)</label>
          <input
            id="annulment-decision-registry-reference"
            value={decision.courtRegistryReference || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ courtRegistryReference: e.target.value })}
          />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="annulment-decision-verification-source">How can the decision be confirmed? (optional)</label>
          <input
            id="annulment-decision-verification-source"
            value={decision.verificationSource || ""}
            disabled={readOnly}
            onChange={(e) => setDecision({ verificationSource: e.target.value })}
            placeholder="Registry office, contact or reference the registrar can check"
          />
        </div>
      </div>

      {finalityInvalid && (
        <p className="crvs-form-error" role="alert" style={{ marginTop: 8 }}>
          The date the decision became final cannot be earlier than the decision date.
        </p>
      )}

      <div className="crvs-form-group" style={{ marginTop: 16 }}>
        <label htmlFor="annulment-decision-legal-effect-wording">Legal-effect wording from the decision (optional)</label>
        <textarea
          id="annulment-decision-legal-effect-wording"
          rows={3}
          value={decision.legalEffectWording || ""}
          disabled={readOnly}
          onChange={(e) => setDecision({ legalEffectWording: e.target.value })}
          data-testid="annulment-decision-legal-effect-wording"
        />
        <p className="crvs-form-hint">
          Copy the exact (or near-exact) wording the decision uses about the marriage's status — for example, the
          sentence that states it is void or voidable. Do not summarise or interpret it: a registrar reads this wording
          themselves and makes the final legal-effect classification. You are never asked to classify it yourself.
        </p>
      </div>

      <div className="crvs-form-group" style={{ marginTop: 16 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            id="annulment-decision-is-foreign"
            checked={decision.isForeign}
            disabled={readOnly}
            onChange={(e) => setDecision({ isForeign: e.target.checked })}
            data-testid="annulment-decision-is-foreign"
          />
          This decision was issued by a court or authority outside this country.
        </label>
      </div>

      {decision.isForeign && (
        <div className="crvs-banner crvs-banner-warning" style={{ alignItems: "flex-start" }}>
          <Icon name="public" />
          <div>
            <strong>A decision issued abroad has extra requirements</strong>
            <ul style={{ margin: "6px 0 0", paddingInlineStart: 20 }}>
              {annulmentPolicyConfig.foreignDecision.translationRequiredByDefault && <li>{annulmentDocumentLabel("CERTIFIED_TRANSLATION")}</li>}
              {annulmentPolicyConfig.foreignDecision.authenticationRequiredByDefault && <li>{annulmentDocumentLabel("AUTHENTICATION_LEGALIZATION")}</li>}
              {annulmentPolicyConfig.foreignDecision.exequaturOrRecognitionRequiredByDefault && (
                <li>{annulmentDocumentLabel("EXEQUATUR_OR_RECOGNITION_DECISION")}</li>
              )}
            </ul>
            {annulmentPolicyConfig.foreignDecision.alwaysRequiresSupervisorLegalReview && (
              <p style={{ margin: "6px 0 0" }}>
                A supervisor always reviews a decision issued abroad before it can be registered. Allow up to{" "}
                {annulmentPolicyConfig.sla.foreignReviewDays} working days for that review.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="crvs-form-group" style={{ marginTop: 16 }}>
        <label htmlFor="annulment-decision-notes">Anything the registrar should know (optional)</label>
        <textarea
          id="annulment-decision-notes"
          rows={3}
          value={decision.notesForStaff || ""}
          disabled={readOnly}
          onChange={(e) => setDecision({ notesForStaff: e.target.value })}
          data-testid="annulment-decision-notes"
        />
        <p className="crvs-form-hint">
          Use this only for practical notes about the paperwork — for example a name spelled differently on the decision
          than on the marriage record. Do not describe the grounds for the annulment or anything argued in court.
        </p>
      </div>
    </div>
  );
}
