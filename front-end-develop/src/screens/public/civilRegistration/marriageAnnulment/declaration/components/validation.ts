// Per-step validation for the public marriage-annulment registration wizard.
// Every rule that quotes a requirement reads it from annulmentPolicyConfig —
// the wizard never hardcodes which decision fields, documents or
// declarations are mandatory (spec §6/§7). Mirrors divorce's validation.ts
// structure exactly.
import { AnnulmentRegistration } from "@/domain/crvs/types";
import { annulmentPolicyConfig, isDecisionFinalityValid, requiresAuthorizationBasis } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentFieldError, AnnulmentWizardStepKey } from "./wizardTypes";
import { affectedPartiesConflict, annulmentDocumentLabel, requiredAnnulmentDocuments } from "../../marriageAnnulmentShared";

const DECISION_FIELD_LABELS: Record<(typeof annulmentPolicyConfig.requiredDecisionFields)[number], { label: string; fieldId: string }> = {
  country: { label: "Country where the decision was issued", fieldId: "annulment-decision-country" },
  courtOrAuthorityName: { label: "Court or authority name", fieldId: "annulment-decision-court" },
  jurisdiction: { label: "Jurisdiction", fieldId: "annulment-decision-jurisdiction" },
  courtCaseNumber: { label: "Court case number", fieldId: "annulment-decision-case-number" },
  decisionNumber: { label: "Decision number", fieldId: "annulment-decision-number" },
  decisionDate: { label: "Decision date", fieldId: "annulment-decision-date" },
  finalityDate: { label: "Date the decision became final", fieldId: "annulment-decision-finality-date" },
  decisionType: { label: "Type of decision", fieldId: "annulment-decision-type" },
  describesMarriageAs: { label: "Whether the decision describes the marriage as void or voidable", fieldId: "annulment-decision-describes-marriage-as" },
};

const decisionValue = (draft: AnnulmentRegistration, field: (typeof annulmentPolicyConfig.requiredDecisionFields)[number]): string =>
  (draft.decision[field] as string | undefined) || "";

const MARRIAGE_DOCUMENT_TYPE = "MARRIAGE_CERTIFICATE_OR_RECORD";

export function validateAnnulmentStep(step: AnnulmentWizardStepKey, draft: AnnulmentRegistration): AnnulmentFieldError[] {
  const errors: AnnulmentFieldError[] = [];
  const push = (fieldId: string, message: string) => errors.push({ fieldId, message });

  switch (step) {
    case "source": {
      if (!draft.source) push("annulment-source-APPLICANT", "Choose who is submitting this registration request.");
      break;
    }

    case "applicant": {
      const { applicant } = draft;
      if (!applicant.firstName?.trim()) push("annulment-applicant-first-name", "Enter the applicant's first name.");
      if (!applicant.lastName?.trim()) push("annulment-applicant-last-name", "Enter the applicant's last name.");
      if (!applicant.dateOfBirth) push("annulment-applicant-dob", "Enter the applicant's date of birth.");
      if (applicant.documentType !== "NONE" && !applicant.documentNumber?.trim()) {
        push("annulment-applicant-document-number", "Enter the identity document number, or set the document type to “None provided”.");
      }
      if (!applicant.phone?.trim() && !applicant.email?.trim()) {
        push("annulment-applicant-phone", "Enter a phone number or an email address so you can be contacted about this request.");
      }
      if (requiresAuthorizationBasis(applicant.relationshipToCase) && !applicant.authorizationBasis?.trim()) {
        push("annulment-applicant-authorization-basis", "Describe the authority under which you are submitting on someone else's behalf.");
      }
      break;
    }

    case "existingMarriage": {
      const { existingMarriage } = draft;
      if (existingMarriage.status === "MATCHED" && existingMarriage.selected) break;
      if (existingMarriage.status === "NOT_FOUND") {
        const hasMarriageEvidence =
          draft.evidence.some((e) => !e.removed && e.documentType === MARRIAGE_DOCUMENT_TYPE) ||
          existingMarriage.notFoundEvidence.some((e) => !e.removed);
        if (!hasMarriageEvidence) {
          push(
            "annulment-marriage-evidence",
            `Upload your ${annulmentDocumentLabel(MARRIAGE_DOCUMENT_TYPE).toLowerCase()} so a registrar can locate the marriage manually.`
          );
        }
        break;
      }
      push("annulment-marriage-search-registration-number", "Search for the marriage record and select it, or record that it cannot be found.");
      break;
    }

    case "firstAffectedPerson":
    case "secondAffectedPerson": {
      const party = step === "firstAffectedPerson" ? draft.affectedParty1 : draft.affectedParty2;
      const prefix = step === "firstAffectedPerson" ? "annulment-party1" : "annulment-party2";
      if (!party.firstName?.trim()) push(`${prefix}-first-name`, "Enter this person's first name.");
      if (!party.lastName?.trim()) push(`${prefix}-last-name`, "Enter this person's last name.");
      if (step === "secondAffectedPerson" && affectedPartiesConflict(draft.affectedParty1, draft.affectedParty2)) {
        push(`${prefix}-document-number`, "The first and second affected persons cannot be the same person. Check the identity details on both steps.");
      }
      break;
    }

    case "decision": {
      annulmentPolicyConfig.requiredDecisionFields.forEach((field) => {
        if (!decisionValue(draft, field)) {
          const meta = DECISION_FIELD_LABELS[field];
          push(meta.fieldId, `${meta.label} is required.`);
        }
      });
      if (
        annulmentPolicyConfig.finality.finalityCannotPrecedeDecision &&
        draft.decision.decisionDate &&
        draft.decision.finalityDate &&
        !isDecisionFinalityValid(draft.decision.decisionDate, draft.decision.finalityDate)
      ) {
        push("annulment-decision-finality-date", "The date the decision became final cannot be earlier than the decision date.");
      }
      break;
    }

    case "evidence": {
      const attached = new Set(draft.evidence.filter((e) => !e.removed).map((e) => e.documentType));
      requiredAnnulmentDocuments(draft.applicant, draft.decision.isForeign).forEach((documentType) => {
        if (!attached.has(documentType)) push("annulment-evidence-dropzone", `${annulmentDocumentLabel(documentType)} has not been uploaded yet.`);
      });
      break;
    }

    case "checks":
      break;

    case "office": {
      const office = draft.processingOffice;
      if (!office.selectedProcessingOfficeName?.trim()) push("annulment-office-selected", "Choose the office that should process this registration.");
      if (
        annulmentPolicyConfig.jurisdiction.alternativeOfficeRequiresReason &&
        office.jurisdictionResult === "ALTERNATIVE_REQUIRES_REASON" &&
        !office.alternativeReason?.trim()
      ) {
        push("annulment-office-alternative-reason", "Explain why you are asking a different office to process this registration.");
      }
      break;
    }

    case "review": {
      if (!draft.accuracyDeclarationConfirmed) push("annulment-declaration-accuracy", "Confirm that the information you have given is accurate.");
      if (!draft.authorityToSubmitConfirmed) push("annulment-declaration-authority", "Confirm that you are entitled to submit this registration request.");
      if (!draft.authoritativeDecisionExistsConfirmed) push("annulment-declaration-decision-exists", "Confirm that an authoritative annulment decision already exists.");
      if (!draft.decisionCompleteConfirmed) push("annulment-declaration-decision-complete", "Confirm that the decision document you uploaded is complete.");
      if (!draft.privacyAcknowledged) push("annulment-declaration-privacy", "Acknowledge the privacy notice.");
      if (!draft.electronicSubmissionConfirmed) push("annulment-declaration-electronic", "Confirm that you are submitting this request electronically.");
      break;
    }

    default:
      break;
  }

  return errors;
}

/** Whether every step passes — used to enable the Submit action on the
 * review step so an incomplete request can never be sent. */
export function allAnnulmentStepsValid(draft: AnnulmentRegistration, steps: AnnulmentWizardStepKey[]): boolean {
  return steps.every((step) => validateAnnulmentStep(step, draft).length === 0);
}
