// Which evidence document types are required, driven by the case shape
// rather than hard-coded per screen (spec §9 step 5: "Display required
// evidence dynamically according to health-facility birth / community birth /
// late registration / parent-verification results / exception type").
import { BirthRegistrationCase } from "./types";

export type RequiredEvidence = {
  documentType: string;
  reason: string;
};

export function requiredEvidenceFor(
  input: Pick<
    BirthRegistrationCase,
    "sourceType" | "isLate" | "occurrenceType" | "mother" | "father" | "exception"
  >
): RequiredEvidence[] {
  const required: RequiredEvidence[] = [];

  if (input.occurrenceType === "FACILITY") {
    required.push({ documentType: "Facility birth notification", reason: "Health-facility birth" });
  } else {
    required.push({ documentType: "Attestation of birth", reason: "Community or home birth — no facility notification" });
  }

  if (input.mother.verification !== "VERIFIED") {
    required.push({ documentType: "Mother's identity document", reason: "Mother's identity is not yet verified" });
  }

  if (input.father.availability === "PROVIDED_UNVERIFIED") {
    required.push({ documentType: "Father's identity document", reason: "Father's identity is not yet verified" });
  }

  if (input.isLate) {
    required.push({ documentType: "Late-registration evidence", reason: "Registration is beyond the standard window" });
  }

  if (input.exception) {
    required.push({ documentType: "Exception supporting evidence", reason: `Exception: ${input.exception.type}` });
  }

  return required;
}

export function missingEvidence(
  input: Pick<BirthRegistrationCase, "sourceType" | "isLate" | "occurrenceType" | "mother" | "father" | "exception" | "evidence">
): RequiredEvidence[] {
  const present = new Set(
    input.evidence.filter((e) => !e.removed).map((e) => e.documentType.toLowerCase())
  );
  return requiredEvidenceFor(input).filter((r) => !present.has(r.documentType.toLowerCase()));
}
