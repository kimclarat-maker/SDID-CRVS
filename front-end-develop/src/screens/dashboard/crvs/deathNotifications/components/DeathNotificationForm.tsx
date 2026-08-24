import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import RestrictedCauseOfDeathNotice from "../../components/RestrictedCauseOfDeathNotice";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import {
  DeathNotification,
  DeathReportingPathway,
  DeceasedPerson,
  DeathOccurrence,
  MedicalDeathCertification,
} from "@/domain/crvs/types";
import { PATHWAY_LABELS, PLACE_CATEGORY_LABELS, CIRCUMSTANCE_LABELS, DOCUMENT_TYPE_LABELS, todayIsoDate } from "../../deathShared";

export type DeathNotificationFormValue = {
  pathway: DeathReportingPathway;
  facilityId?: string;
  facilityName?: string;
  deceased: DeceasedPerson;
  occurrence: DeathOccurrence;
  medicalCertification?: MedicalDeathCertification;
};

/** Single-page sectioned form shared by the create and edit death-
 * notification screens. Health-facility notifications are the fast path
 * (facility staff already know the deceased and the certifying details), so
 * this stays one page with clear sections rather than a full multi-step
 * wizard — the multi-step wizard experience is reserved for the larger
 * death-REGISTRATION flow (spec §5), which has substantially more sections
 * (declarant, next of kin, witnesses, evidence, identity checks). */
export default function DeathNotificationForm({
  initial,
  onSaveDraft,
  onSubmit,
  saving,
  submitting,
}: {
  initial?: Partial<DeathNotificationFormValue>;
  onSaveDraft: (value: DeathNotificationFormValue) => void;
  onSubmit: (value: DeathNotificationFormValue) => void;
  saving?: boolean;
  submitting?: boolean;
}) {
  const canEditCause = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_CAUSE_EDIT);

  const [pathway, setPathway] = useState<DeathReportingPathway>(initial?.pathway || "HEALTH_FACILITY");
  const [facilityName, setFacilityName] = useState(initial?.facilityName || "");
  const [deceased, setDeceased] = useState<DeceasedPerson>(
    initial?.deceased || { identityStatus: "KNOWN", sex: "UNKNOWN", verification: "NOT_VERIFIED" }
  );
  const [occurrence, setOccurrence] = useState<DeathOccurrence>(
    initial?.occurrence || { dateOfDeath: "", placeCategory: "HEALTH_FACILITY", location: "", adminLocation: "", jurisdiction: "", circumstanceCategory: "UNKNOWN" }
  );
  const [certified, setCertified] = useState(!!initial?.medicalCertification?.isCertified);
  const [certifierName, setCertifierName] = useState(initial?.medicalCertification?.certifierName || "");
  const [certificateReferenceNumber, setCertificateReferenceNumber] = useState(initial?.medicalCertification?.certificateReferenceNumber || "");
  const [dateCertified, setDateCertified] = useState(initial?.medicalCertification?.dateCertified?.slice(0, 10) || "");
  const [immediateCause, setImmediateCause] = useState(initial?.medicalCertification?.cause?.immediateCause || "");
  const [error, setError] = useState<string | undefined>();

  const buildValue = (): DeathNotificationFormValue => ({
    pathway,
    facilityId: pathway === "HEALTH_FACILITY" ? initial?.facilityId : undefined,
    facilityName: pathway === "HEALTH_FACILITY" ? facilityName : undefined,
    deceased,
    occurrence,
    medicalCertification: certified
      ? {
          isCertified: true,
          certifierName,
          certificateReferenceNumber,
          dateCertified: dateCertified || undefined,
          cause: { immediateCause },
        }
      : undefined,
  });

  const validate = (): string | undefined => {
    if (!occurrence.dateOfDeath) return "Date of death is required.";
    if (occurrence.dateOfDeath > todayIsoDate()) return "Date of death cannot be in the future.";
    if (deceased.identityStatus === "KNOWN" && !deceased.lastName) return "The deceased's last name is required, or mark identity as unknown.";
    if (!occurrence.location) return "Place of death is required.";
    return undefined;
  };

  const handleSubmit = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(undefined);
    onSubmit(buildValue());
  };

  return (
    <div className="crvs-review-section">
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="dn-pathway">Reporting pathway</label>
          <select id="dn-pathway" value={pathway} onChange={(e) => setPathway(e.target.value as DeathReportingPathway)} data-testid="dn-pathway">
            {(Object.keys(PATHWAY_LABELS) as DeathReportingPathway[]).map((p) => (
              <option key={p} value={p}>
                {PATHWAY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        {pathway === "HEALTH_FACILITY" && (
          <div className="crvs-form-group">
            <label htmlFor="dn-facility">Facility</label>
            <input id="dn-facility" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} data-testid="dn-facility" />
          </div>
        )}
      </div>

      <h3 className="crvs-section-title" style={{ marginTop: 20 }}>Deceased</h3>
      <div className="crvs-form-grid">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={deceased.identityStatus === "IDENTITY_UNKNOWN"}
            onChange={(e) => setDeceased((d) => ({ ...d, identityStatus: e.target.checked ? "IDENTITY_UNKNOWN" : "KNOWN" }))}
            data-testid="dn-identity-unknown"
          />
          Identity unknown
        </label>
        {deceased.identityStatus === "KNOWN" ? (
          <>
            <div className="crvs-form-group">
              <label htmlFor="dn-first">First name</label>
              <input id="dn-first" value={deceased.firstName || ""} onChange={(e) => setDeceased((d) => ({ ...d, firstName: e.target.value }))} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-last">Last name</label>
              <input id="dn-last" value={deceased.lastName || ""} onChange={(e) => setDeceased((d) => ({ ...d, lastName: e.target.value }))} data-testid="dn-last-name" />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-sex">Sex</label>
              <select id="dn-sex" value={deceased.sex} onChange={(e) => setDeceased((d) => ({ ...d, sex: e.target.value as DeceasedPerson["sex"] }))}>
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-doctype">Identity document type</label>
              <select id="dn-doctype" value={deceased.documentType || "NONE"} onChange={(e) => setDeceased((d) => ({ ...d, documentType: e.target.value as DeceasedPerson["documentType"] }))}>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-docnum">Document number</label>
              <input id="dn-docnum" value={deceased.documentNumber || ""} onChange={(e) => setDeceased((d) => ({ ...d, documentNumber: e.target.value }))} />
            </div>
          </>
        ) : (
          <div className="crvs-form-group" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="dn-descriptive">Descriptive summary</label>
            <textarea
              id="dn-descriptive"
              rows={3}
              value={deceased.descriptivePhysicalSummary || ""}
              onChange={(e) => setDeceased((d) => ({ ...d, descriptivePhysicalSummary: e.target.value }))}
              placeholder="Approximate age, sex, physical description, distinguishing features…"
            />
          </div>
        )}
      </div>

      <h3 className="crvs-section-title" style={{ marginTop: 20 }}>Occurrence</h3>
      <div className="crvs-form-grid">
        <div className="crvs-form-group">
          <label htmlFor="dn-dod">Date of death</label>
          <input id="dn-dod" type="date" value={occurrence.dateOfDeath?.slice(0, 10) || ""} onChange={(e) => setOccurrence((o) => ({ ...o, dateOfDeath: e.target.value }))} data-testid="dn-date-of-death" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-time">Time of death</label>
          <input id="dn-time" type="time" value={occurrence.timeOfDeath || ""} onChange={(e) => setOccurrence((o) => ({ ...o, timeOfDeath: e.target.value }))} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-place-cat">Place category</label>
          <select id="dn-place-cat" value={occurrence.placeCategory} onChange={(e) => setOccurrence((o) => ({ ...o, placeCategory: e.target.value as DeathOccurrence["placeCategory"] }))}>
            {(Object.keys(PLACE_CATEGORY_LABELS) as (keyof typeof PLACE_CATEGORY_LABELS)[]).map((k) => (
              <option key={k} value={k}>
                {PLACE_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-location">Location</label>
          <input id="dn-location" value={occurrence.location} onChange={(e) => setOccurrence((o) => ({ ...o, location: e.target.value }))} data-testid="dn-location" />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-admin-location">Administrative location</label>
          <input id="dn-admin-location" value={occurrence.adminLocation} onChange={(e) => setOccurrence((o) => ({ ...o, adminLocation: e.target.value }))} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-jurisdiction">Jurisdiction</label>
          <input id="dn-jurisdiction" value={occurrence.jurisdiction} onChange={(e) => setOccurrence((o) => ({ ...o, jurisdiction: e.target.value }))} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="dn-circumstance">Circumstances</label>
          <select id="dn-circumstance" value={occurrence.circumstanceCategory} onChange={(e) => setOccurrence((o) => ({ ...o, circumstanceCategory: e.target.value as DeathOccurrence["circumstanceCategory"] }))}>
            {(Object.keys(CIRCUMSTANCE_LABELS) as (keyof typeof CIRCUMSTANCE_LABELS)[]).map((k) => (
              <option key={k} value={k}>
                {CIRCUMSTANCE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 className="crvs-section-title" style={{ marginTop: 20 }}>Medical certification</h3>
      <RestrictedCauseOfDeathNotice cause={certified ? { immediateCause } : undefined}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, marginBottom: 12 }}>
          <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} disabled={!canEditCause} data-testid="dn-certified" />
          Medically certified
        </label>
        {certified && (
          <div className="crvs-form-grid">
            <div className="crvs-form-group">
              <label htmlFor="dn-certifier">Certifier name</label>
              <input id="dn-certifier" value={certifierName} onChange={(e) => setCertifierName(e.target.value)} disabled={!canEditCause} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-cert-ref">Certificate reference number</label>
              <input id="dn-cert-ref" value={certificateReferenceNumber} onChange={(e) => setCertificateReferenceNumber(e.target.value)} disabled={!canEditCause} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-cert-date">Date certified</label>
              <input id="dn-cert-date" type="date" value={dateCertified} onChange={(e) => setDateCertified(e.target.value)} disabled={!canEditCause} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="dn-cause">Immediate cause of death</label>
              <input id="dn-cause" value={immediateCause} onChange={(e) => setImmediateCause(e.target.value)} disabled={!canEditCause} />
            </div>
          </div>
        )}
      </RestrictedCauseOfDeathNotice>

      {error && (
        <p className="crvs-form-error" role="alert" style={{ marginTop: 16 }}>
          <Icon name="error" /> {error}
        </p>
      )}

      <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
        <Button text="Save draft" appearance="ghost" type="button" loading={saving} onClick={() => onSaveDraft(buildValue())} testId="dn-save-draft" />
        <Button text="Submit notification" appearance="primary" type="button" loading={submitting} onClick={handleSubmit} testId="dn-submit" />
      </div>
    </div>
  );
}
