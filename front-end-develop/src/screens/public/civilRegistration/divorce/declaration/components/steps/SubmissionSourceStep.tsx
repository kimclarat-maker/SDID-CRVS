import Icon from "@/components/icon";
import { DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import {
  DIVORCE_SOURCE_DESCRIPTIONS,
  DIVORCE_SOURCE_LABELS,
  PUBLIC_DIVORCE_SOURCES,
  PublicDivorceSubmissionSource,
  relationshipForSource,
} from "../../../divorceShared";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";

/** Wizard step 1 — who is submitting, plus the legal framing this whole
 * module depends on (spec §1): this service registers a divorce a court has
 * ALREADY granted. It never starts court proceedings and never decides
 * anything about the divorce itself. */
export default function SubmissionSourceStep({ draft, onChange, errors, readOnly }: DivorceWizardStepProps) {
  const selectSource = (source: PublicDivorceSubmissionSource) => {
    onChange({
      source,
      applicant: { ...draft.applicant, relationshipToCase: relationshipForSource(source) },
      judgment: { ...draft.judgment, isForeign: source === "FOREIGN_DECISION" ? true : draft.judgment.isForeign },
    });
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">How this divorce is being registered</h2>
      <ErrorSummary errors={errors} />

      <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
        <Icon name="gavel" />
        <div>
          <strong>This service registers a divorce a court has already granted.</strong>
          <p style={{ margin: "6px 0 0" }}>
            It does not file a divorce case, hold hearings, examine the grounds for a divorce, or decide anything about
            custody, maintenance or the division of property. Those are matters for the court that issued your decision.
            What happens here is purely administrative: the civil registry records the decision the court has already
            made, so that the marriage record and both former spouses' civil status reflect it.
          </p>
          <p style={{ margin: "6px 0 0" }}>
            If a court has not yet granted your divorce, there is nothing to register yet — you will need the final
            decision first.
          </p>
        </div>
      </div>

      <fieldset style={{ border: "none", margin: "20px 0 0", padding: 0 }}>
        <legend className="crvs-section-title" style={{ fontSize: "1rem", padding: 0 }}>
          Who is submitting this request?
        </legend>
        <p className="crvs-form-hint" style={{ marginTop: 4 }}>
          Your answer decides which declarations and documents you will be asked for later.
        </p>

        <ul className="divorce-option-list">
          {PUBLIC_DIVORCE_SOURCES.map((source) => {
            const selected = draft.source === source;
            return (
              <li key={source}>
                <label
                  className={`divorce-option-card${selected ? " is-selected" : ""}`}
                  htmlFor={`divorce-source-${source}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: readOnly ? "default" : "pointer" }}
                >
                  <input
                    type="radio"
                    id={`divorce-source-${source}`}
                    name="divorce-submission-source"
                    value={source}
                    checked={selected}
                    disabled={readOnly}
                    onChange={() => selectSource(source)}
                    data-testid={`divorce-source-${source}`}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <strong>{DIVORCE_SOURCE_LABELS[source]}</strong>
                    <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {DIVORCE_SOURCE_DESCRIPTIONS[source]}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 20, alignItems: "flex-start" }}>
        <Icon name="schedule" />
        <div>
          <strong>What to expect after you submit</strong>
          <p style={{ margin: "6px 0 0" }}>
            A registration officer reviews the request within about {divorcePolicyConfig.sla.reviewDays} working days.
            Verifying the court decision takes up to {divorcePolicyConfig.sla.judgmentVerificationDays} working days, and
            a decision issued abroad takes up to {divorcePolicyConfig.sla.foreignReviewDays} working days because it
            needs a separate recognition review. If anything needs correcting you will have{" "}
            {divorcePolicyConfig.sla.correctionResponseDays} days to respond using a secure link.
          </p>
        </div>
      </div>

      {draft.source === "FOREIGN_DECISION" && (
        <div className="crvs-banner crvs-banner-warning" style={{ marginTop: 12, alignItems: "flex-start" }}>
          <Icon name="public" />
          <div>
            <strong>A decision issued abroad needs extra documents</strong>
            <p style={{ margin: "6px 0 0" }}>
              You will be asked for a certified translation, authentication or legalisation of the foreign decision, and
              a recognition (exequatur) decision. A supervisor always reviews a foreign decision before it can be
              registered.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
