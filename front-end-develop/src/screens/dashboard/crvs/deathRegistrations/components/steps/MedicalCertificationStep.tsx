import { WizardStepProps } from "../wizardTypes";
import RestrictedCauseOfDeathNotice from "../../../components/RestrictedCauseOfDeathNotice";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { MedicalDeathCertification } from "@/domain/crvs/types";

/** Wizard step 3: medical certification — certifying facility, certifier,
 * certificate reference, date certified, cause-of-death classification,
 * supporting document reference, restricted-data notice (spec §5 step 4). */
export default function MedicalCertificationStep({ draft, onChange, readOnly }: WizardStepProps) {
  const canEditCause = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_EDIT);
  const cert: MedicalDeathCertification = draft.medicalCertification || { isCertified: false, cause: {} };

  const setCert = (patch: Partial<MedicalDeathCertification>) => onChange({ medicalCertification: { ...cert, ...patch } });
  const setCause = (patch: Partial<MedicalDeathCertification["cause"]>) => setCert({ cause: { ...cert.cause, ...patch } });

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Medical certification</h2>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, marginBottom: 12 }}>
        <input type="checkbox" checked={cert.isCertified} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ isCertified: e.target.checked })} data-testid="wizard-medically-certified" />
        This death has been medically certified
      </label>

      {!cert.isCertified && (
        <p className="crvs-form-hint">
          Not every pathway requires medical certification (e.g. community deaths rely on witness and burial evidence
          instead) — leave unchecked if none applies.
        </p>
      )}

      {cert.isCertified && (
        <RestrictedCauseOfDeathNotice cause={cert.cause}>
          <div className="crvs-form-grid">
            <div className="crvs-form-group">
              <label htmlFor="mc-facility">Certifying facility</label>
              <input id="mc-facility" value={cert.certifyingFacilityName || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ certifyingFacilityName: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-certifier">Certifier name</label>
              <input id="mc-certifier" value={cert.certifierName || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ certifierName: e.target.value })} data-testid="wizard-certifier-name" />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-role">Certifier role</label>
              <input id="mc-role" value={cert.certifierRole || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ certifierRole: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-ref">Certificate / reference number</label>
              <input id="mc-ref" value={cert.certificateReferenceNumber || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ certificateReferenceNumber: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-date">Date certified</label>
              <input id="mc-date" type="date" value={cert.dateCertified?.slice(0, 10) || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCert({ dateCertified: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-manner">Manner of death</label>
              <select id="mc-manner" value={cert.cause.mannerOfDeath || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCause({ mannerOfDeath: (e.target.value || undefined) as MedicalDeathCertification["cause"]["mannerOfDeath"] })}>
                <option value="">Not specified</option>
                <option value="NATURAL">Natural</option>
                <option value="ACCIDENT">Accident</option>
                <option value="SUICIDE">Suicide</option>
                <option value="HOMICIDE">Homicide</option>
                <option value="UNDETERMINED">Undetermined</option>
                <option value="PENDING_INVESTIGATION">Pending investigation</option>
              </select>
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-immediate">Immediate cause</label>
              <input id="mc-immediate" value={cert.cause.immediateCause || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCause({ immediateCause: e.target.value })} data-testid="wizard-immediate-cause" />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-antecedent">Antecedent cause</label>
              <input id="mc-antecedent" value={cert.cause.antecedentCause || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCause({ antecedentCause: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="mc-underlying">Underlying cause</label>
              <input id="mc-underlying" value={cert.cause.underlyingCause || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCause({ underlyingCause: e.target.value })} />
            </div>
            <div className="crvs-form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="mc-other">Other contributing conditions</label>
              <textarea id="mc-other" rows={2} value={cert.cause.otherContributingConditions || ""} disabled={readOnly || !canEditCause} onChange={(e) => setCause({ otherContributingConditions: e.target.value })} />
            </div>
          </div>
          {!canEditCause && (
            <p className="crvs-form-hint" style={{ marginTop: 8 }}>
              Only a Medical Certifier can edit cause-of-death fields. You can still record facility/certifier/reference
              information.
            </p>
          )}
        </RestrictedCauseOfDeathNotice>
      )}
    </div>
  );
}
