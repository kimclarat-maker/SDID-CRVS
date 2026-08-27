import { useMemo } from "react";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { DivorceWizardStepProps } from "../wizardTypes";
import { getDemoData } from "@/demo/storage/demoStore";
import { runDivorceDuplicateCheck } from "@/demo/services/crvsDivorceRegistrations";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import {
  activeEvidence,
  applicantDisplayName,
  DIVORCE_APPLICANT_RELATIONSHIP_LABELS,
  DIVORCE_DECISION_TYPE_LABELS,
  EXISTING_MARRIAGE_MATCH_LABELS,
  formatDate,
  formerSpouseDisplayName,
  marriageReferenceLabel,
} from "../../../divorceShared";

/** Wizard step 8 (spec §3): a read-back of everything captured, the live
 * duplicate check, and the declarations the submitter must confirm. Nothing
 * here is editable — corrections go back through the earlier steps. */
export default function ReviewDeclarationsStep({ draft, onChange, readOnly }: DivorceWizardStepProps) {
  const duplicate = useMemo(() => runDivorceDuplicateCheck(draft, getDemoData().crvsDivorceRegistrations), [draft]);
  const evidence = activeEvidence(draft.evidence);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Review and declarations</h2>

      <h3 className="crvs-section-title">Applicant</h3>
      <DescriptionList columns={3}>
        <DescriptionItem label="Name" value={applicantDisplayName(draft.applicant)} />
        <DescriptionItem label="Relationship to case" value={DIVORCE_APPLICANT_RELATIONSHIP_LABELS[draft.applicant.relationshipToCase]} />
        <DescriptionItem label="Identity verification" value={draft.applicant.identityVerification.replace(/_/g, " ").toLowerCase()} />
        <DescriptionItem label="Authorization basis" value={draft.applicant.authorizationBasis} />
      </DescriptionList>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Existing marriage
      </h3>
      <DescriptionList columns={3}>
        <DescriptionItem label="Match status" value={EXISTING_MARRIAGE_MATCH_LABELS[draft.existingMarriage.status]} />
        <DescriptionItem label="Marriage number" value={marriageReferenceLabel(draft)} />
        <DescriptionItem label="Marriage date" value={formatDate(draft.existingMarriage.selected?.marriageDate)} />
      </DescriptionList>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Former spouses
      </h3>
      <DescriptionList columns={2}>
        <DescriptionItem label="Former spouse 1" value={formerSpouseDisplayName(draft.formerSpouse1)} />
        <DescriptionItem label="Former spouse 2" value={formerSpouseDisplayName(draft.formerSpouse2)} />
        <DescriptionItem label="Former spouse 1 identity" value={draft.formerSpouse1.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
        <DescriptionItem label="Former spouse 2 identity" value={draft.formerSpouse2.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
      </DescriptionList>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Court decision
      </h3>
      <DescriptionList columns={3}>
        <DescriptionItem label="Country" value={draft.judgment.country} />
        <DescriptionItem label="Court or authority" value={draft.judgment.courtOrAuthorityName} />
        <DescriptionItem label="Court case number" value={draft.judgment.courtCaseNumber} />
        <DescriptionItem label="Judgment number" value={draft.judgment.judgmentNumber} />
        <DescriptionItem label="Judgment date" value={formatDate(draft.judgment.judgmentDate)} />
        <DescriptionItem label="Final on" value={draft.judgment.finalityDate ? formatDate(draft.judgment.finalityDate) : "Not reported"} />
        <DescriptionItem label="Decision type" value={DIVORCE_DECISION_TYPE_LABELS[draft.judgment.decisionType]} />
        <DescriptionItem label="Effective date" value={formatDate(draft.judgment.registrationEffectiveDate)} />
        <DescriptionItem label="Foreign decision" value={draft.judgment.isForeign ? "Yes" : "No"} />
      </DescriptionList>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Evidence
      </h3>
      {evidence.length === 0 ? (
        <p className="crvs-form-hint">No documents attached.</p>
      ) : (
        <p className="crvs-form-hint">{evidence.map((e) => `${e.documentType.replace(/_/g, " ").toLowerCase()} (${e.fileName})`).join(", ")}</p>
      )}

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Duplicate check
      </h3>
      <div className={`crvs-banner ${duplicate.overallLevel === "EXACT" ? "crvs-banner-danger" : duplicate.overallLevel === "NONE" ? "crvs-banner-info" : "crvs-banner-warning"}`}>
        <Icon name={duplicate.overallLevel === "NONE" ? "task_alt" : "content_copy"} />
        <span>
          Overall match level: <strong>{duplicate.overallLevel}</strong> · {duplicate.candidates.length} candidate(s) · {duplicate.conflicts.length} existing-divorce conflict(s).
          {duplicate.overallLevel === "EXACT" ? " An exact duplicate blocks submission — resolve it first." : ""}
        </span>
      </div>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Declarations
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Checkbox
          label="I declare the information recorded here is accurate and complete to the best of my knowledge."
          checked={draft.accuracyDeclarationConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ accuracyDeclarationConfirmed: !draft.accuracyDeclarationConfirmed })}
          testId="divorce-declaration-accuracy"
        />
        <Checkbox
          label="I confirm I am authorized to submit this divorce registration request."
          checked={draft.authorityToSubmitConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ authorityToSubmitConfirmed: !draft.authorityToSubmitConfirmed })}
          testId="divorce-declaration-authority"
        />
        <Checkbox
          label="I confirm the court decision recorded here is final."
          checked={draft.judgmentFinalConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ judgmentFinalConfirmed: !draft.judgmentFinalConfirmed })}
          testId="divorce-declaration-final"
        />
        <Checkbox
          label="I acknowledge how this personal data will be processed and retained."
          checked={draft.privacyAcknowledged}
          disabled={readOnly}
          onChange={() => onChange({ privacyAcknowledged: !draft.privacyAcknowledged })}
          testId="divorce-declaration-privacy"
        />
        <Checkbox
          label="I confirm this electronic submission has the same effect as a signed paper submission."
          checked={draft.electronicSubmissionConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ electronicSubmissionConfirmed: !draft.electronicSubmissionConfirmed })}
          testId="divorce-declaration-electronic"
        />
      </div>

      <p className="crvs-form-hint" style={{ marginTop: 12 }}>
        Submitting sends this case for review. The configured review allowance is {divorcePolicyConfig.sla.reviewDays} days; a correction request must be answered within{" "}
        {divorcePolicyConfig.sla.correctionResponseDays} days. Submitting does not register the divorce — a Civil Registrar approves it, then registers it as a separate final step.
      </p>
    </div>
  );
}
