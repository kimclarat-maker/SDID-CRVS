// Per-step validation for the public divorce-registration wizard. Every
// rule that quotes a requirement reads it from divorcePolicyConfig — the
// wizard never hardcodes which judgment fields, documents or declarations
// are mandatory (spec §6).
import { DivorceRegistration } from "@/domain/crvs/types";
import { divorcePolicyConfig, isJudgmentFinalityValid, requiresAuthorizationBasis } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceFieldError, DivorceWizardStepKey } from "./wizardTypes";
import { applicantIsFormerSpouse, formerSpousesConflict, requiredDivorceDocuments, divorceDocumentLabel } from "../../divorceShared";

const JUDGMENT_FIELD_LABELS: Record<(typeof divorcePolicyConfig.requiredJudgmentFields)[number], { label: string; fieldId: string }> = {
  country: { label: "Country where the decision was issued", fieldId: "divorce-judgment-country" },
  courtOrAuthorityName: { label: "Court or authority name", fieldId: "divorce-judgment-court" },
  courtCaseNumber: { label: "Court case number", fieldId: "divorce-judgment-case-number" },
  judgmentNumber: { label: "Judgment or order number", fieldId: "divorce-judgment-number" },
  judgmentDate: { label: "Judgment date", fieldId: "divorce-judgment-date" },
  finalityDate: { label: "Date the decision became final", fieldId: "divorce-judgment-finality-date" },
  decisionType: { label: "Type of decision", fieldId: "divorce-judgment-decision-type" },
};

const judgmentValue = (draft: DivorceRegistration, field: (typeof divorcePolicyConfig.requiredJudgmentFields)[number]): string =>
  (draft.judgment[field] as string | undefined) || "";

export function validateDivorceStep(step: DivorceWizardStepKey, draft: DivorceRegistration): DivorceFieldError[] {
  const errors: DivorceFieldError[] = [];
  const push = (fieldId: string, message: string) => errors.push({ fieldId, message });

  switch (step) {
    case "source": {
      if (!draft.source) push("divorce-source-APPLICANT", "Choose who is submitting this registration request.");
      break;
    }

    case "applicant": {
      const { applicant } = draft;
      if (!applicant.firstName?.trim()) push("divorce-applicant-first-name", "Enter the applicant's first name.");
      if (!applicant.lastName?.trim()) push("divorce-applicant-last-name", "Enter the applicant's last name.");
      if (!applicant.dateOfBirth) push("divorce-applicant-dob", "Enter the applicant's date of birth.");
      if (applicant.documentType !== "NONE" && !applicant.documentNumber?.trim()) {
        push("divorce-applicant-document-number", "Enter the identity document number, or set the document type to “None provided”.");
      }
      if (!applicant.phone?.trim() && !applicant.email?.trim()) {
        push("divorce-applicant-phone", "Enter a phone number or an email address so you can be contacted about this request.");
      }
      if (requiresAuthorizationBasis(applicant.relationshipToCase) && !applicant.authorizationBasis?.trim()) {
        push("divorce-applicant-authorization-basis", "Describe the authority under which you are submitting on someone else's behalf.");
      }
      break;
    }

    case "marriage": {
      const { existingMarriage } = draft;
      if (existingMarriage.status === "MATCHED" && existingMarriage.selected) break;
      if (existingMarriage.status === "NOT_FOUND") {
        const hasMarriageEvidence = draft.evidence.some((e) => !e.removed && e.documentType === "MARRIAGE_CERTIFICATE_OR_RECORD");
        if (!hasMarriageEvidence) {
          push(
            "divorce-marriage-evidence",
            `Upload your ${divorceDocumentLabel("MARRIAGE_CERTIFICATE_OR_RECORD").toLowerCase()} so a registrar can locate the marriage manually.`
          );
        }
        break;
      }
      push("divorce-marriage-search-registration-number", "Search for your marriage record and select it, or record that it cannot be found.");
      break;
    }

    case "spouse1":
    case "spouse2": {
      const spouse = step === "spouse1" ? draft.formerSpouse1 : draft.formerSpouse2;
      const prefix = step === "spouse1" ? "divorce-spouse1" : "divorce-spouse2";
      if (!spouse.firstName?.trim()) push(`${prefix}-first-name`, "Enter this former spouse's first name.");
      if (!spouse.lastName?.trim()) push(`${prefix}-last-name`, "Enter this former spouse's last name.");
      if (step === "spouse2" && formerSpousesConflict(draft.formerSpouse1, draft.formerSpouse2)) {
        push(`${prefix}-document-number`, "Former spouse 1 and former spouse 2 cannot be the same person. Check the identity details on both steps.");
      }
      break;
    }

    case "judgment": {
      divorcePolicyConfig.requiredJudgmentFields.forEach((field) => {
        if (!judgmentValue(draft, field)) {
          const meta = JUDGMENT_FIELD_LABELS[field];
          push(meta.fieldId, `${meta.label} is required.`);
        }
      });
      if (
        divorcePolicyConfig.finality.finalityCannotPrecedeJudgment &&
        draft.judgment.judgmentDate &&
        draft.judgment.finalityDate &&
        !isJudgmentFinalityValid(draft.judgment.judgmentDate, draft.judgment.finalityDate)
      ) {
        push("divorce-judgment-finality-date", "The date the decision became final cannot be earlier than the judgment date.");
      }
      break;
    }

    case "documents": {
      const attached = new Set(draft.evidence.filter((e) => !e.removed).map((e) => e.documentType));
      requiredDivorceDocuments(draft.applicant, draft.judgment.isForeign).forEach((documentType) => {
        if (!attached.has(documentType)) push("divorce-documents-dropzone", `${divorceDocumentLabel(documentType)} has not been uploaded yet.`);
      });
      break;
    }

    case "checks":
      break;

    case "office": {
      const office = draft.processingOffice;
      if (!office.selectedProcessingOfficeName?.trim()) push("divorce-office-selected", "Choose the office that should process this registration.");
      if (
        divorcePolicyConfig.jurisdiction.alternativeOfficeRequiresReason &&
        office.jurisdictionResult === "ALTERNATIVE_REQUIRES_REASON" &&
        !office.alternativeReason?.trim()
      ) {
        push("divorce-office-alternative-reason", "Explain why you are asking a different office to process this registration.");
      }
      break;
    }

    case "review": {
      if (!draft.accuracyDeclarationConfirmed) push("divorce-declaration-accuracy", "Confirm that the information you have given is accurate.");
      if (!draft.authorityToSubmitConfirmed) push("divorce-declaration-authority", "Confirm that you are entitled to submit this registration request.");
      if (!draft.judgmentFinalConfirmed) push("divorce-declaration-final", "Confirm that the court decision is final.");
      if (!draft.privacyAcknowledged) push("divorce-declaration-privacy", "Acknowledge the privacy notice.");
      if (!draft.electronicSubmissionConfirmed) push("divorce-declaration-electronic", "Confirm that you are submitting this request electronically.");
      break;
    }

    default:
      break;
  }

  return errors;
}

/** Whether every step passes — used to enable the Submit action on the
 * review step so an incomplete request can never be sent. */
export function allDivorceStepsValid(draft: DivorceRegistration, steps: DivorceWizardStepKey[]): boolean {
  return steps.every((step) => validateDivorceStep(step, draft).length === 0);
}

export const applicantIsSpouse = applicantIsFormerSpouse;
