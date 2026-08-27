import { useState } from "react";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../../components/StatusBadge";
import IdentityLookupModal, { IdentityLookupMatch } from "../modals/IdentityLookupModal";
import { WizardStepProps } from "../wizardTypes";
import { MarriageApplicant, IdentityDocumentType, CivilStatusCategory, NationalityCategory } from "@/domain/crvs/types";
import { DOCUMENT_TYPE_LABELS, CIVIL_STATUS_LABELS, NATIONALITY_CATEGORY_LABELS, PARTNER_CONFIRMATION_LABELS } from "../../../marriageShared";
import { demoRequestMarriagePartnerVerification } from "@/demo/services/crvsMarriageApplications";
import { getCurrentActorName } from "@/utils/workspace";
import toastMessage from "@/utils/common/toastMessage";

type ApplicantStepProps = WizardStepProps & { spouseRole: "APPLICANT1" | "APPLICANT2"; label: string };

/** Wizard step 2/3: one applicant's identity + demographics + nationality +
 * residence + contact + current civil status (spec §9 steps 2/3). Rendered
 * twice by the wizard host — once per applicant — rather than forked into
 * two near-identical files. */
export default function ApplicantStep({ draft, onChange, spouseRole, label, readOnly }: ApplicantStepProps) {
  const key = spouseRole === "APPLICANT1" ? "applicant1" : "applicant2";
  const applicant = draft[key];
  const setApplicant = (patch: Partial<MarriageApplicant>) => onChange({ [key]: { ...applicant, ...patch } });

  const [showLookup, setShowLookup] = useState(false);
  const [requestingPartner, setRequestingPartner] = useState(false);

  const handleMatched = (match: IdentityLookupMatch) => {
    setApplicant({
      firstName: match.firstName,
      lastName: match.lastName,
      dateOfBirth: match.dob,
      nationality: match.nationality,
      sdidIdentityId: match.identityId,
      verification: "VERIFIED",
    });
  };

  const requestPartnerVerification = async () => {
    setRequestingPartner(true);
    try {
      const updated = demoRequestMarriagePartnerVerification(draft.id, getCurrentActorName());
      onChange(updated);
      toastMessage("success", "Sent applicant 2 a secure link to confirm participation.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setRequestingPartner(false);
    }
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">{label}</h2>

      {!readOnly && (
        <Button text="Look up identity" appearance="ghost" startIcon="search" type="button" onClick={() => setShowLookup(true)} testId={`wizard-lookup-${spouseRole}`} />
      )}

      <div className="crvs-form-grid" style={{ marginTop: 12 }}>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-nationality-category`}>Nationality category</label>
          <select id={`${spouseRole}-nationality-category`} value={applicant.nationalityCategory} disabled={readOnly} onChange={(e) => setApplicant({ nationalityCategory: e.target.value as NationalityCategory })}>
            {Object.entries(NATIONALITY_CATEGORY_LABELS).map(([value, l]) => (
              <option key={value} value={value}>{l}</option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-doctype`}>Identity document type</label>
          <select id={`${spouseRole}-doctype`} value={applicant.documentType} disabled={readOnly} onChange={(e) => setApplicant({ documentType: e.target.value as IdentityDocumentType })}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, l]) => (
              <option key={value} value={value}>{l}</option>
            ))}
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-docnum`}>Document / NIN number</label>
          <input id={`${spouseRole}-docnum`} value={applicant.documentNumber || ""} disabled={readOnly} onChange={(e) => setApplicant({ documentNumber: e.target.value, nin: applicant.documentType === "NATIONAL_ID" ? e.target.value : applicant.nin })} data-testid={`wizard-${spouseRole}-docnum`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-first`}>First name</label>
          <input id={`${spouseRole}-first`} value={applicant.firstName || ""} disabled={readOnly} onChange={(e) => setApplicant({ firstName: e.target.value })} data-testid={`wizard-${spouseRole}-first`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-middle`}>Middle name</label>
          <input id={`${spouseRole}-middle`} value={applicant.middleName || ""} disabled={readOnly} onChange={(e) => setApplicant({ middleName: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-last`}>Last name</label>
          <input id={`${spouseRole}-last`} value={applicant.lastName || ""} disabled={readOnly} onChange={(e) => setApplicant({ lastName: e.target.value })} data-testid={`wizard-${spouseRole}-last`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-sex`}>Sex</label>
          <select id={`${spouseRole}-sex`} value={applicant.sex} disabled={readOnly} onChange={(e) => setApplicant({ sex: e.target.value as MarriageApplicant["sex"] })}>
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-dob`}>Date of birth</label>
          <input id={`${spouseRole}-dob`} type="date" value={applicant.dateOfBirth?.slice(0, 10) || ""} disabled={readOnly} onChange={(e) => setApplicant({ dateOfBirth: e.target.value })} data-testid={`wizard-${spouseRole}-dob`} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-nationality`}>Nationality</label>
          <input id={`${spouseRole}-nationality`} value={applicant.nationality || ""} disabled={readOnly} onChange={(e) => setApplicant({ nationality: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-residence`}>Residence</label>
          <input id={`${spouseRole}-residence`} value={applicant.residence || ""} disabled={readOnly} onChange={(e) => setApplicant({ residence: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-phone`}>Phone</label>
          <input id={`${spouseRole}-phone`} value={applicant.phone || ""} disabled={readOnly} onChange={(e) => setApplicant({ phone: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-email`}>Email</label>
          <input id={`${spouseRole}-email`} type="email" value={applicant.email || ""} disabled={readOnly} onChange={(e) => setApplicant({ email: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor={`${spouseRole}-civilstatus`}>Current civil status</label>
          <select id={`${spouseRole}-civilstatus`} value={applicant.civilStatus} disabled={readOnly} onChange={(e) => setApplicant({ civilStatus: e.target.value as CivilStatusCategory })}>
            {Object.entries(CIVIL_STATUS_LABELS).map(([value, l]) => (
              <option key={value} value={value}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="crvs-form-hint">Identity verification:</span>
        <StatusBadge kind="verification" status={applicant.verification} />
      </div>

      {spouseRole === "APPLICANT2" && (
        <div className="crvs-banner crvs-banner-info" style={{ marginTop: 12 }}>
          <Icon name="mark_email_unread" />
          <div style={{ flex: 1 }}>
            Partner confirmation: <strong>{PARTNER_CONFIRMATION_LABELS[applicant.partnerConfirmationStatus]}</strong>
            {applicant.partnerConfirmationStatus === "DECLINED" && applicant.partnerDeclineReason && (
              <div className="crvs-form-hint">Reason: {applicant.partnerDeclineReason}</div>
            )}
          </div>
          {!readOnly && applicant.partnerConfirmationStatus !== "CONFIRMED" && applicant.partnerConfirmationStatus !== "DECLINED" && !!applicant.firstName && (
            <Button text="Send verification invite" size="sm" appearance="ghost" loading={requestingPartner} onClick={requestPartnerVerification} testId="wizard-request-partner-verification" />
          )}
        </div>
      )}

      <IdentityLookupModal show={showLookup} onClose={() => setShowLookup(false)} applicantLabel={label} onMatched={handleMatched} />
    </div>
  );
}
