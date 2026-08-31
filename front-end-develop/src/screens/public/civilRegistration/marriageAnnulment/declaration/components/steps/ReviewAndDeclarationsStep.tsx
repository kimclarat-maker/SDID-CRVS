import Button from "@/components/button";
import Icon from "@/components/icon";
import { AnnulmentWizardStepKey, AnnulmentWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { validateAnnulmentStep } from "../validation";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import {
  ANNULMENT_DECISION_TYPE_LABELS,
  ANNULMENT_DESCRIBES_MARRIAGE_LABELS,
  ANNULMENT_RELATIONSHIP_LABELS,
  ANNULMENT_SOURCE_LABELS,
  EXISTING_MARRIAGE_MATCH_STATUS_LABELS,
  PublicAnnulmentSubmissionSource,
  affectedPartyDisplayName,
  annulmentDocumentLabel,
  applicantDisplayName,
  formatDate,
  maskDocumentNumber,
} from "../../../marriageAnnulmentShared";

type ReviewAndDeclarationsStepProps = AnnulmentWizardStepProps & {
  onEditStep: (step: AnnulmentWizardStepKey) => void;
};

type DeclarationKey =
  | "accuracyDeclarationConfirmed"
  | "authorityToSubmitConfirmed"
  | "authoritativeDecisionExistsConfirmed"
  | "decisionCompleteConfirmed"
  | "privacyAcknowledged"
  | "electronicSubmissionConfirmed";

const DECLARATIONS: { key: DeclarationKey; fieldId: string; text: string }[] = [
  {
    key: "accuracyDeclarationConfirmed",
    fieldId: "annulment-declaration-accuracy",
    text: "I declare that the information in this registration request is true, complete and accurate to the best of my knowledge, and that the documents I have uploaded are genuine copies of the originals.",
  },
  {
    key: "authorityToSubmitConfirmed",
    fieldId: "annulment-declaration-authority",
    text: "I declare that I am entitled to submit this request — either as one of the two affected people, or under the authority I described earlier.",
  },
  {
    key: "authoritativeDecisionExistsConfirmed",
    fieldId: "annulment-declaration-decision-exists",
    text: "I confirm that a court or other legally recognized authority has already made an annulment decision, and that this request only registers that existing decision.",
  },
  {
    key: "decisionCompleteConfirmed",
    fieldId: "annulment-declaration-decision-complete",
    text: "I confirm that the decision document I have uploaded is complete, and not a partial or draft copy.",
  },
  {
    key: "privacyAcknowledged",
    fieldId: "annulment-declaration-privacy",
    text: "I acknowledge that the information and documents I have provided will be used to process this registration, shared only with the staff handling it, and retained as part of the civil register.",
  },
  {
    key: "electronicSubmissionConfirmed",
    fieldId: "annulment-declaration-electronic",
    text: "I confirm that I am submitting this request electronically, and that this submission has the same effect as a request signed at a registration office.",
  },
];

type SummarySection = {
  step: AnnulmentWizardStepKey;
  heading: string;
  rows: { label: string; value: string }[];
};

const yesNo = (value: boolean) => (value ? "Yes" : "No");

/** Wizard step 10 — the full request, grouped by section, with an edit link
 * back to each step, followed by the six declarations the registration
 * record requires before it can be submitted. There is deliberately no
 * "marriage was invalid" declaration anywhere here — only the authoritative
 * decision, once reviewed by staff, can establish that (spec §1, §11 Step
 * 10). */
export default function ReviewAndDeclarationsStep({ draft, onChange, errors, readOnly, onEditStep }: ReviewAndDeclarationsStepProps) {
  const { applicant, decision, existingMarriage, processingOffice } = draft;
  const attached = draft.evidence.filter((e) => !e.removed);

  const sections: SummarySection[] = [
    {
      step: "source",
      heading: "How this annulment is being registered",
      rows: [
        { label: "Submitted as", value: ANNULMENT_SOURCE_LABELS[draft.source as PublicAnnulmentSubmissionSource] || draft.source.replace(/_/g, " ").toLowerCase() },
        { label: "Reference", value: draft.reference },
      ],
    },
    {
      step: "applicant",
      heading: "About you",
      rows: [
        { label: "Name", value: applicantDisplayName(applicant) },
        { label: "Identity document", value: `${applicant.documentType.replace(/_/g, " ").toLowerCase()} · ${maskDocumentNumber(applicant.documentNumber)}` },
        { label: "Date of birth", value: formatDate(applicant.dateOfBirth) },
        { label: "Nationality", value: applicant.nationality || "—" },
        { label: "Residence", value: applicant.residence || "—" },
        { label: "Contact", value: [applicant.phone, applicant.email].filter(Boolean).join(" · ") || "—" },
        { label: "Relationship to this annulment", value: ANNULMENT_RELATIONSHIP_LABELS[applicant.relationshipToCase] },
        ...(applicant.authorizationBasis ? [{ label: "Authority to submit", value: applicant.authorizationBasis }] : []),
      ],
    },
    {
      step: "existingMarriage",
      heading: "The marriage this decision annuls",
      rows: existingMarriage.selected
        ? [
            { label: "Marriage registration number", value: existingMarriage.selected.registrationNumber },
            { label: "Affected people on the marriage record", value: `${existingMarriage.selected.party1Name} and ${existingMarriage.selected.party2Name}` },
            { label: "Date of marriage", value: formatDate(existingMarriage.selected.marriageDate) },
            { label: "Place of marriage", value: existingMarriage.selected.marriagePlace || existingMarriage.selected.officeName || "—" },
          ]
        : [{ label: "Marriage record", value: EXISTING_MARRIAGE_MATCH_STATUS_LABELS[existingMarriage.status] }],
    },
    {
      step: "firstAffectedPerson",
      heading: "First affected person",
      rows: [
        { label: "Name", value: affectedPartyDisplayName(draft.affectedParty1) },
        { label: "Identity document", value: maskDocumentNumber(draft.affectedParty1.documentNumber) },
        { label: "Date of birth", value: formatDate(draft.affectedParty1.dateOfBirth) },
      ],
    },
    {
      step: "secondAffectedPerson",
      heading: "Second affected person",
      rows: [
        { label: "Name", value: affectedPartyDisplayName(draft.affectedParty2) },
        { label: "Identity document", value: maskDocumentNumber(draft.affectedParty2.documentNumber) },
        { label: "Date of birth", value: formatDate(draft.affectedParty2.dateOfBirth) },
      ],
    },
    {
      step: "decision",
      heading: "The annulment decision",
      rows: [
        { label: "Country", value: decision.country || "—" },
        { label: "Court or authority", value: decision.courtOrAuthorityName || "—" },
        { label: "Court case number", value: decision.courtCaseNumber || "—" },
        { label: "Decision number", value: decision.decisionNumber || "—" },
        { label: "Decision date", value: formatDate(decision.decisionDate) },
        { label: "Final on", value: formatDate(decision.finalityDate) },
        { label: "Type of decision", value: ANNULMENT_DECISION_TYPE_LABELS[decision.decisionType] },
        { label: "Takes effect", value: formatDate(decision.effectiveDate) },
        { label: "Describes the marriage as", value: ANNULMENT_DESCRIBES_MARRIAGE_LABELS[decision.describesMarriageAs] },
        { label: "Issued abroad", value: yesNo(decision.isForeign) },
      ],
    },
    {
      step: "evidence",
      heading: "Supporting evidence",
      rows:
        attached.length > 0
          ? attached.map((item) => ({ label: annulmentDocumentLabel(item.documentType), value: item.fileName }))
          : [{ label: "Documents", value: "None uploaded" }],
    },
    {
      step: "checks",
      heading: "Verification",
      rows: [
        { label: "Applicant identity", value: draft.applicant.identityVerification.replace(/_/g, " ").toLowerCase() },
        { label: "First affected person identity", value: draft.affectedParty1.identityVerification.replace(/_/g, " ").toLowerCase() },
        { label: "Second affected person identity", value: draft.affectedParty2.identityVerification.replace(/_/g, " ").toLowerCase() },
      ],
    },
    {
      step: "office",
      heading: "Processing office",
      rows: [
        { label: "Office", value: processingOffice.selectedProcessingOfficeName || "—" },
        { label: "Jurisdiction", value: processingOffice.jurisdictionResult.replace(/_/g, " ").toLowerCase() },
        { label: "Embassy or consular route", value: yesNo(processingOffice.embassyOrForeignOfficePath) },
        ...(processingOffice.alternativeReason ? [{ label: "Reason for an alternative office", value: processingOffice.alternativeReason }] : []),
      ],
    },
  ];

  const outstanding = sections
    .map((section) => ({ section, problems: validateAnnulmentStep(section.step, draft) }))
    .filter((entry) => entry.problems.length > 0);

  // Written out per key rather than with a computed property so the patch
  // stays a checked Partial<AnnulmentRegistration> instead of a string index.
  const setDeclaration = (key: DeclarationKey, value: boolean) => {
    switch (key) {
      case "accuracyDeclarationConfirmed":
        onChange({ accuracyDeclarationConfirmed: value });
        return;
      case "authorityToSubmitConfirmed":
        onChange({ authorityToSubmitConfirmed: value });
        return;
      case "authoritativeDecisionExistsConfirmed":
        onChange({ authoritativeDecisionExistsConfirmed: value });
        return;
      case "decisionCompleteConfirmed":
        onChange({ decisionCompleteConfirmed: value });
        return;
      case "privacyAcknowledged":
        onChange({ privacyAcknowledged: value });
        return;
      case "electronicSubmissionConfirmed":
        onChange({ electronicSubmissionConfirmed: value });
        return;
      default:
        return;
    }
  };

  return (
    <div className="crvs-review-section">
      <h2 className="crvs-section-title">Review and declare</h2>
      <ErrorSummary errors={errors} />

      <p className="crvs-form-hint">
        Check every section below. Use “Edit” to go back and change anything — nothing is submitted until you select
        Submit at the bottom of this page.
      </p>

      {outstanding.length > 0 && (
        <div className="crvs-banner crvs-banner-warning" style={{ alignItems: "flex-start" }}>
          <Icon name="warning" />
          <div>
            <strong>Some sections are not finished yet</strong>
            <ul style={{ margin: "6px 0 0", paddingInlineStart: 20 }}>
              {outstanding.map((entry) => (
                <li key={entry.section.step}>
                  {entry.section.heading} — {entry.problems[0].message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.step} style={{ marginTop: 20 }} aria-labelledby={`annulment-review-${section.step}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h3 id={`annulment-review-${section.step}`} style={{ margin: 0 }}>
              {section.heading}
            </h3>
            {!readOnly && (
              <Button
                text="Edit"
                size="sm"
                appearance="ghost"
                startIcon="edit"
                type="button"
                onClick={() => onEditStep(section.step)}
                testId={`annulment-review-edit-${section.step}`}
              />
            )}
          </div>
          <dl className="crvs-form-grid" style={{ margin: "8px 0 0" }}>
            {section.rows.map((row) => (
              <div key={`${section.step}-${row.label}-${row.value}`}>
                <dt className="crvs-form-hint">{row.label}</dt>
                <dd style={{ margin: 0 }}>{row.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <h3 style={{ marginTop: 24 }}>Your declarations</h3>
      <p className="crvs-form-hint">
        All six are required. Submitting this request registers a decision a court or authority has already made — it
        does not ask anyone to decide anything about the marriage, and it does not change what the decision says.
      </p>

      {DECLARATIONS.map((declaration) => (
        <div className="crvs-form-group" key={declaration.key}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
            <input
              type="checkbox"
              id={declaration.fieldId}
              checked={draft[declaration.key]}
              disabled={readOnly}
              onChange={(e) => setDeclaration(declaration.key, e.target.checked)}
              data-testid={declaration.fieldId}
            />
            {declaration.text}
          </label>
        </div>
      ))}

      <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16, alignItems: "flex-start" }}>
        <Icon name="schedule" />
        <div>
          <strong>After you submit</strong>
          <p style={{ margin: "6px 0 0" }}>
            You will get a reference to track the request. A registration officer reviews it within about{" "}
            {annulmentPolicyConfig.sla.reviewDays} working days. If anything needs correcting you will receive a secure
            link and have {annulmentPolicyConfig.sla.correctionResponseDays} days to respond.
          </p>
        </div>
      </div>
    </div>
  );
}
