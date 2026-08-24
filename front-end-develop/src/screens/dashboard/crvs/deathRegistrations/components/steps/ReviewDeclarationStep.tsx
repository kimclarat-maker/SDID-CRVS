import { WizardStepProps } from "../wizardTypes";
import RestrictedCauseOfDeathNotice from "../../../components/RestrictedCauseOfDeathNotice";
import { deceasedDisplayName, PATHWAY_LABELS, maskDocumentNumber } from "../../../deathShared";

/** Wizard step 8: complete summary with edit links (jumping back to a step
 * is handled by WizardShell's own stepper), legal declaration, privacy
 * confirmation (spec §5 step 9). */
export default function ReviewDeclarationStep({ draft, onChange, readOnly }: WizardStepProps) {
  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Review &amp; declaration</h2>

      <dl className="crvs-form-grid" style={{ margin: 0 }}>
        <div>
          <dt className="crvs-form-hint">Pathway</dt>
          <dd style={{ margin: 0 }}>{PATHWAY_LABELS[draft.pathway]}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Deceased</dt>
          <dd style={{ margin: 0 }}>{deceasedDisplayName(draft.deceased)}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Date of death</dt>
          <dd style={{ margin: 0 }}>{draft.dateOfDeath?.slice(0, 10) || draft.occurrence.dateOfDeath?.slice(0, 10) || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Place of death</dt>
          <dd style={{ margin: 0 }}>{draft.occurrence.location || "—"}</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Declarant</dt>
          <dd style={{ margin: 0 }}>{draft.declarant.firstName} {draft.declarant.lastName} ({draft.declarant.relationship})</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Next of kin</dt>
          <dd style={{ margin: 0 }}>{draft.nextOfKin.length} recorded</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Witnesses</dt>
          <dd style={{ margin: 0 }}>{draft.witnesses.length} recorded</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Evidence</dt>
          <dd style={{ margin: 0 }}>{draft.evidence.filter((e) => !e.removed).length} attached</dd>
        </div>
        <div>
          <dt className="crvs-form-hint">Deceased document</dt>
          <dd style={{ margin: 0 }}>{maskDocumentNumber(draft.deceased.documentNumber)}</dd>
        </div>
      </dl>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>Medical certification</h3>
      <RestrictedCauseOfDeathNotice cause={draft.medicalCertification?.cause}>
        {draft.medicalCertification?.isCertified ? (
          <p className="crvs-form-hint">
            Certified by {draft.medicalCertification.certifierName || "—"} — immediate cause: {draft.medicalCertification.cause.immediateCause || "—"}
          </p>
        ) : (
          <p className="crvs-form-hint">Not medically certified.</p>
        )}
      </RestrictedCauseOfDeathNotice>

      <div className="crvs-form-group" style={{ marginTop: 20 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={draft.declarationConfirmed}
            disabled={readOnly}
            onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
            data-testid="wizard-declaration-confirmed"
          />
          I declare that the information provided in this death registration is true and accurate to the best of my
          knowledge.
        </label>
      </div>
      <div className="crvs-form-group">
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={draft.declarantConfirmed}
            disabled={readOnly}
            onChange={(e) => onChange({ declarantConfirmed: e.target.checked })}
            data-testid="wizard-declarant-confirmed"
          />
          The declarant's identity and relationship to the deceased have been confirmed.
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
          I acknowledge the privacy notice concerning medical and personal information collected in this case.
        </label>
      </div>
    </div>
  );
}
