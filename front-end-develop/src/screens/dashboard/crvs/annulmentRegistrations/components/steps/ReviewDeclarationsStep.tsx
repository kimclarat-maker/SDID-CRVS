import { useEffect, useState } from "react";
import Checkbox from "@/components/checkbox";
import Icon from "@/components/icon";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { AnnulmentWizardStepProps } from "../wizardTypes";
import { runAnnulmentDuplicateCheck } from "@/demo/services/crvsAnnulmentRegistrations";
import { AnnulmentDuplicateCandidate, overallAnnulmentMatchLevel } from "@/domain/crvs/annulmentDuplicateDetection";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import {
  activeEvidence,
  affectedPartyDisplayName,
  ANNULMENT_APPLICANT_RELATIONSHIP_LABELS,
  ANNULMENT_DECISION_TYPE_LABELS,
  applicantDisplayName,
  EXISTING_MARRIAGE_MATCH_LABELS,
  formatDate,
  marriageReferenceLabel,
} from "../../../annulmentShared";

/** Wizard step 7 (final): a read-back of everything captured, the live
 * duplicate check, and the declarations the submitter must confirm. Nothing
 * here is editable — corrections go back through the earlier steps (mirrors
 * the divorce module's ReviewDeclarationsStep). The duplicate check runs
 * asynchronously (runAnnulmentDuplicateCheck resolves via demoDelay), unlike
 * divorce's synchronous equivalent, so this is driven by an effect rather
 * than a plain useMemo. */
export default function ReviewDeclarationsStep({ draft, onChange, readOnly }: AnnulmentWizardStepProps) {
  const [duplicate, setDuplicate] = useState<{ candidates: AnnulmentDuplicateCandidate[]; overallMatchLevel: ReturnType<typeof overallAnnulmentMatchLevel> } | undefined>();
  const evidence = activeEvidence(draft.evidence);

  useEffect(() => {
    let cancelled = false;
    runAnnulmentDuplicateCheck(
      {
        marriageApplicationId: draft.existingMarriage.selected?.marriageApplicationId,
        courtCaseNumber: draft.decision.courtCaseNumber,
        decisionNumber: draft.decision.decisionNumber,
      },
      draft.id
    ).then((res) => {
      if (!cancelled) setDuplicate(res);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.id, draft.existingMarriage.selected?.marriageApplicationId, draft.decision.courtCaseNumber, draft.decision.decisionNumber]);

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Review and declarations</h2>

      <h3 className="crvs-section-title">Applicant</h3>
      <DescriptionList columns={3}>
        <DescriptionItem label="Name" value={applicantDisplayName(draft.applicant)} />
        <DescriptionItem label="Relationship to case" value={ANNULMENT_APPLICANT_RELATIONSHIP_LABELS[draft.applicant.relationshipToCase]} />
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
        Affected parties
      </h3>
      <DescriptionList columns={2}>
        <DescriptionItem label="Affected party 1" value={affectedPartyDisplayName(draft.affectedParty1)} />
        <DescriptionItem label="Affected party 2" value={affectedPartyDisplayName(draft.affectedParty2)} />
        <DescriptionItem label="Affected party 1 identity" value={draft.affectedParty1.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
        <DescriptionItem label="Affected party 2 identity" value={draft.affectedParty2.identityMatchConfidence.replace(/_/g, " ").toLowerCase()} />
      </DescriptionList>

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Annulment decision
      </h3>
      <DescriptionList columns={3}>
        <DescriptionItem label="Country" value={draft.decision.country} />
        <DescriptionItem label="Court or authority" value={draft.decision.courtOrAuthorityName} />
        <DescriptionItem label="Jurisdiction" value={draft.decision.jurisdiction} />
        <DescriptionItem label="Court case number" value={draft.decision.courtCaseNumber} />
        <DescriptionItem label="Decision number" value={draft.decision.decisionNumber} />
        <DescriptionItem label="Decision date" value={formatDate(draft.decision.decisionDate)} />
        <DescriptionItem label="Final on" value={draft.decision.finalityDate ? formatDate(draft.decision.finalityDate) : "Not reported"} />
        <DescriptionItem label="Decision type" value={ANNULMENT_DECISION_TYPE_LABELS[draft.decision.decisionType]} />
        <DescriptionItem label="Describes marriage as" value={draft.decision.describesMarriageAs} />
        <DescriptionItem label="Foreign decision" value={draft.decision.isForeign ? "Yes" : "No"} />
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
      {!duplicate ? (
        <p className="crvs-form-hint">Checking for duplicate annulment registrations…</p>
      ) : (
        <div className={`crvs-banner ${duplicate.overallMatchLevel === "EXACT" ? "crvs-banner-danger" : duplicate.overallMatchLevel === "NONE" ? "crvs-banner-info" : "crvs-banner-warning"}`}>
          <Icon name={duplicate.overallMatchLevel === "NONE" ? "task_alt" : "content_copy"} />
          <span>
            Overall match level: <strong>{duplicate.overallMatchLevel}</strong> · {duplicate.candidates.length} candidate(s).
            {duplicate.overallMatchLevel === "EXACT" ? " An exact duplicate blocks submission — resolve it first." : ""}
          </span>
        </div>
      )}

      <h3 className="crvs-section-title" style={{ marginTop: 16 }}>
        Declarations
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Checkbox
          label="I declare the information recorded here is accurate and complete to the best of my knowledge."
          checked={draft.accuracyDeclarationConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ accuracyDeclarationConfirmed: !draft.accuracyDeclarationConfirmed })}
          testId="annulment-declaration-accuracy"
        />
        <Checkbox
          label="I confirm I am authorized to submit this annulment registration request."
          checked={draft.authorityToSubmitConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ authorityToSubmitConfirmed: !draft.authorityToSubmitConfirmed })}
          testId="annulment-declaration-authority"
        />
        <Checkbox
          label="I confirm an authoritative annulment decision exists for this marriage."
          checked={draft.authoritativeDecisionExistsConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ authoritativeDecisionExistsConfirmed: !draft.authoritativeDecisionExistsConfirmed })}
          testId="annulment-declaration-decision-exists"
        />
        <Checkbox
          label="I confirm the uploaded copy of the decision is complete."
          checked={draft.decisionCompleteConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ decisionCompleteConfirmed: !draft.decisionCompleteConfirmed })}
          testId="annulment-declaration-decision-complete"
        />
        <Checkbox
          label="I acknowledge how this personal data will be processed and retained."
          checked={draft.privacyAcknowledged}
          disabled={readOnly}
          onChange={() => onChange({ privacyAcknowledged: !draft.privacyAcknowledged })}
          testId="annulment-declaration-privacy"
        />
        <Checkbox
          label="I confirm this electronic submission has the same effect as a signed paper submission."
          checked={draft.electronicSubmissionConfirmed}
          disabled={readOnly}
          onChange={() => onChange({ electronicSubmissionConfirmed: !draft.electronicSubmissionConfirmed })}
          testId="annulment-declaration-electronic"
        />
      </div>

      <p className="crvs-form-hint" style={{ marginTop: 12 }}>
        Submitting sends this case for review. The configured review allowance is {annulmentPolicyConfig.sla.reviewDays} days; a correction request must be answered within{" "}
        {annulmentPolicyConfig.sla.correctionResponseDays} days. Submitting does not register the annulment or determine its legal effect — a Civil Registrar reviews it, authorized staff classify its legal
        effect, and only then is it registered as a separate final step.
      </p>
    </div>
  );
}
