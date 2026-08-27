import Button from "@/components/button";
import Icon from "@/components/icon";
import { DivorceWizardStepKey, DivorceWizardStepProps } from "../wizardTypes";
import ErrorSummary from "../ErrorSummary";
import { validateDivorceStep } from "../validation";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import {
  DIVORCE_DECISION_TYPE_LABELS,
  DIVORCE_RELATIONSHIP_LABELS,
  DIVORCE_SOURCE_LABELS,
  EXISTING_MARRIAGE_STATUS_LABELS,
  PublicDivorceSubmissionSource,
  applicantDisplayName,
  divorceDocumentLabel,
  formatDate,
  formerSpouseDisplayName,
  maskDocumentNumber,
} from "../../../divorceShared";

type ReviewDeclarationStepProps = DivorceWizardStepProps & {
  onEditStep: (step: DivorceWizardStepKey) => void;
};

type DeclarationKey =
  | "accuracyDeclarationConfirmed"
  | "authorityToSubmitConfirmed"
  | "judgmentFinalConfirmed"
  | "privacyAcknowledged"
  | "electronicSubmissionConfirmed";

const DECLARATIONS: { key: DeclarationKey; fieldId: string; text: string }[] = [
  {
    key: "accuracyDeclarationConfirmed",
    fieldId: "divorce-declaration-accuracy",
    text: "I declare that the information in this registration request is true, complete and accurate to the best of my knowledge, and that the documents I have uploaded are genuine copies of the originals.",
  },
  {
    key: "authorityToSubmitConfirmed",
    fieldId: "divorce-declaration-authority",
    text: "I declare that I am entitled to submit this request — either as one of the former spouses, or under the authority I described earlier.",
  },
  {
    key: "judgmentFinalConfirmed",
    fieldId: "divorce-declaration-final",
    text: "I confirm that the court decision has already been granted and is final, and that it is not under appeal.",
  },
  {
    key: "privacyAcknowledged",
    fieldId: "divorce-declaration-privacy",
    text: "I acknowledge that the information and documents I have provided will be used to process this registration, shared only with the staff handling it, and retained as part of the civil register.",
  },
  {
    key: "electronicSubmissionConfirmed",
    fieldId: "divorce-declaration-electronic",
    text: "I confirm that I am submitting this request electronically, and that this submission has the same effect as a request signed at a registration office.",
  },
];

type SummarySection = {
  step: DivorceWizardStepKey;
  heading: string;
  rows: { label: string; value: string }[];
};

const yesNo = (value: boolean) => (value ? "Yes" : "No");

/** Wizard step 10 — the full request, grouped by section, with an edit link
 * back to each step, followed by the five declarations the registration
 * record requires before it can be submitted. */
export default function ReviewDeclarationStep({ draft, onChange, errors, readOnly, onEditStep }: ReviewDeclarationStepProps) {
  const { applicant, judgment, existingMarriage, processingOffice } = draft;
  const attached = draft.evidence.filter((e) => !e.removed);

  const sections: SummarySection[] = [
    {
      step: "source",
      heading: "How this divorce is being registered",
      rows: [
        { label: "Submitted as", value: DIVORCE_SOURCE_LABELS[draft.source as PublicDivorceSubmissionSource] || draft.source.replace(/_/g, " ").toLowerCase() },
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
        { label: "Relationship to this divorce", value: DIVORCE_RELATIONSHIP_LABELS[applicant.relationshipToCase] },
        ...(applicant.authorizationBasis ? [{ label: "Authority to submit", value: applicant.authorizationBasis }] : []),
      ],
    },
    {
      step: "marriage",
      heading: "The marriage this divorce ends",
      rows: existingMarriage.selected
        ? [
            { label: "Marriage registration number", value: existingMarriage.selected.registrationNumber },
            { label: "Spouses on the marriage record", value: `${existingMarriage.selected.spouse1Name} and ${existingMarriage.selected.spouse2Name}` },
            { label: "Date of marriage", value: formatDate(existingMarriage.selected.marriageDate) },
            { label: "Place of marriage", value: existingMarriage.selected.marriagePlace || existingMarriage.selected.officeName || "—" },
          ]
        : [{ label: "Marriage record", value: EXISTING_MARRIAGE_STATUS_LABELS[existingMarriage.status] }],
    },
    {
      step: "spouse1",
      heading: "Former spouse 1",
      rows: [
        { label: "Name", value: formerSpouseDisplayName(draft.formerSpouse1) },
        { label: "Identity document", value: maskDocumentNumber(draft.formerSpouse1.documentNumber) },
        { label: "Date of birth", value: formatDate(draft.formerSpouse1.dateOfBirth) },
      ],
    },
    {
      step: "spouse2",
      heading: "Former spouse 2",
      rows: [
        { label: "Name", value: formerSpouseDisplayName(draft.formerSpouse2) },
        { label: "Identity document", value: maskDocumentNumber(draft.formerSpouse2.documentNumber) },
        { label: "Date of birth", value: formatDate(draft.formerSpouse2.dateOfBirth) },
      ],
    },
    {
      step: "judgment",
      heading: "The court decision",
      rows: [
        { label: "Country", value: judgment.country || "—" },
        { label: "Court or authority", value: judgment.courtOrAuthorityName || "—" },
        { label: "Court case number", value: judgment.courtCaseNumber || "—" },
        { label: "Judgment or order number", value: judgment.judgmentNumber || "—" },
        { label: "Judgment date", value: formatDate(judgment.judgmentDate) },
        { label: "Final on", value: formatDate(judgment.finalityDate) },
        { label: "Type of decision", value: DIVORCE_DECISION_TYPE_LABELS[judgment.decisionType] },
        { label: "Takes effect", value: formatDate(judgment.registrationEffectiveDate) },
        { label: "Issued abroad", value: yesNo(judgment.isForeign) },
      ],
    },
    {
      step: "documents",
      heading: "Supporting documents",
      rows:
        attached.length > 0
          ? attached.map((item) => ({ label: divorceDocumentLabel(item.documentType), value: item.fileName }))
          : [{ label: "Documents", value: "None uploaded" }],
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
    .map((section) => ({ section, problems: validateDivorceStep(section.step, draft) }))
    .filter((entry) => entry.problems.length > 0);

  // Written out per key rather than with a computed property so the patch
  // stays a checked Partial<DivorceRegistration> instead of a string index.
  const setDeclaration = (key: DeclarationKey, value: boolean) => {
    switch (key) {
      case "accuracyDeclarationConfirmed":
        onChange({ accuracyDeclarationConfirmed: value });
        return;
      case "authorityToSubmitConfirmed":
        onChange({ authorityToSubmitConfirmed: value });
        return;
      case "judgmentFinalConfirmed":
        onChange({ judgmentFinalConfirmed: value });
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
        <section key={section.step} style={{ marginTop: 20 }} aria-labelledby={`divorce-review-${section.step}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h3 id={`divorce-review-${section.step}`} style={{ margin: 0 }}>
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
                testId={`divorce-review-edit-${section.step}`}
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
        All five are required. Submitting this request registers a decision the court has already made — it does not ask
        a court for anything, and it does not change what the court decided.
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
            {divorcePolicyConfig.sla.reviewDays} working days. If anything needs correcting you will receive a secure
            link and have {divorcePolicyConfig.sla.correctionResponseDays} days to respond.
            {!divorcePolicyConfig.fees.required && " No fee is payable for this service."}
          </p>
        </div>
      </div>
    </div>
  );
}
