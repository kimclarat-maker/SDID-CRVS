import { WizardStepProps } from "../wizardTypes";
import { applicantDisplayName, maskDocumentNumber } from "../../../marriageShared";

/** Wizard step 8: complete summary with edit links (jumping back to a step
 * is handled by WizardShell's own stepper), accuracy declaration, consent
 * to verification, and privacy notice (spec §9 step 8). */
export default function ReviewDeclarationsStep({ draft, onChange, readOnly }: WizardStepProps) {
  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Review &amp; declarations</h2>

      <dl className="crvs-form-grid" style={{ margin: 0 }}>
        <div>
          <dt className="crvs-form-hint">Office</dt>
          <dd style={{ margin: 0 }}>{draft.officeName || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Proposed marriage date</dt>
          <dd style={{ margin: 0 }}>{draft.proposedMarriageDate?.slice(0, 10) || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Applicant 1</dt>
          <dd style={{ margin: 0 }}>{applicantDisplayName(draft.applicant1)} · {maskDocumentNumber(draft.applicant1.documentNumber)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Applicant 2</dt>
          <dd style={{ margin: 0 }}>{applicantDisplayName(draft.applicant2)} · {maskDocumentNumber(draft.applicant2.documentNumber)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Eligibility outcome</dt>
          <dd style={{ margin: 0 }}>{draft.eligibility?.overallOutcome || "Not yet checked"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Witnesses</dt>
          <dd style={{ margin: 0 }}>{draft.witnesses.filter((w) => !w.replaced).length} recorded</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Evidence</dt>
          <dd style={{ margin: 0 }}>{draft.evidence.filter((e) => !e.removed).length} attached</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Partner confirmation</dt>
          <dd style={{ margin: 0 }}>{draft.applicant2.partnerConfirmationStatus}</dd>
        </div>
      </dl>

      <div className="crvs-form-group" style={{ marginTop: 20 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={draft.declarationConfirmed}
            disabled={readOnly}
            onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
            data-testid="wizard-declaration-confirmed"
          />
          I declare that the information provided in this marriage declaration is true and accurate to the best of my knowledge.
        </label>
      </div>
      <div className="crvs-form-group">
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={draft.consentToVerification}
            disabled={readOnly}
            onChange={(e) => onChange({ consentToVerification: e.target.checked })}
            data-testid="wizard-consent-to-verification"
          />
          Both applicants consent to identity and civil-status verification against SDID/CRVS records.
        </label>
      </div>
      <div className="crvs-form-group">
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={draft.privacyAcknowledged}
            disabled={readOnly}
            onChange={(e) => onChange({ privacyAcknowledged: e.target.checked })}
            data-testid="wizard-privacy-acknowledged"
          />
          I acknowledge the privacy notice concerning personal information collected in this declaration.
        </label>
      </div>
    </div>
  );
}
