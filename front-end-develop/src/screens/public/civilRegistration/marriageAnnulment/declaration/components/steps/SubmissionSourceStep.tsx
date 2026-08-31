import Icon from "@/components/icon";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import {
  ANNULMENT_SOURCE_DESCRIPTIONS,
  ANNULMENT_SOURCE_LABELS,
  PUBLIC_ANNULMENT_SOURCES,
  PublicAnnulmentSubmissionSource,
  relationshipForSource,
} from "../../../marriageAnnulmentShared";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";

/** Wizard step 1 — who is submitting, plus the legal framing this whole
 * module depends on (spec §1): this service registers an annulment decision
 * a competent court or legally recognized authority has ALREADY made. It
 * never starts an annulment case, never hears grounds for annulling a
 * marriage, and never itself decides whether a marriage was void or
 * voidable. */
export default function SubmissionSourceStep({ draft, onChange, errors, readOnly }: AnnulmentWizardStepProps) {
  const selectSource = (source: PublicAnnulmentSubmissionSource) => {
    onChange({
      source,
      applicant: { ...draft.applicant, relationshipToCase: relationshipForSource(source) },
      decision: { ...draft.decision, isForeign: source === "FOREIGN_DECISION" ? true : draft.decision.isForeign },
    });
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">How this annulment is being registered</h2>
      <ErrorSummary errors={errors} />

      <div className="crvs-banner crvs-banner-info" style={{ alignItems: "flex-start" }}>
        <Icon name="gavel" />
        <div>
          <strong>This service registers an annulment decision a court or authority has already made.</strong>
          <p style={{ margin: "6px 0 0" }}>
            It does not open an annulment case, hold hearings, or examine the grounds a marriage was annulled on. What
            happens here is purely administrative: the civil registry records the decision that has already been made, so
            the marriage record reflects it. This service also never declares a marriage invalid on its own — that
            conclusion can only come from the authoritative decision you are registering.
          </p>
          <p style={{ margin: "6px 0 0" }}>
            If a court or authority has not yet made this decision, there is nothing to register yet — you will need the
            final decision first.
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

        <ul className="annulment-option-list">
          {PUBLIC_ANNULMENT_SOURCES.map((source) => {
            const selected = draft.source === source;
            return (
              <li key={source}>
                <label
                  className={`annulment-option-card${selected ? " is-selected" : ""}`}
                  htmlFor={`annulment-source-${source}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: readOnly ? "default" : "pointer" }}
                >
                  <input
                    type="radio"
                    id={`annulment-source-${source}`}
                    name="annulment-submission-source"
                    value={source}
                    checked={selected}
                    disabled={readOnly}
                    onChange={() => selectSource(source)}
                    data-testid={`annulment-source-${source}`}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <strong>{ANNULMENT_SOURCE_LABELS[source]}</strong>
                    <span className="crvs-form-hint" style={{ display: "block", marginTop: 4 }}>
                      {ANNULMENT_SOURCE_DESCRIPTIONS[source]}
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
            A registration officer reviews the request within about {annulmentPolicyConfig.sla.reviewDays} working days.
            Verifying the decision takes up to {annulmentPolicyConfig.sla.decisionVerificationDays} working days, and a
            decision issued abroad takes up to {annulmentPolicyConfig.sla.foreignReviewDays} working days because it
            needs a separate recognition review. If anything needs correcting you will have{" "}
            {annulmentPolicyConfig.sla.correctionResponseDays} days to respond using a secure link.
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
