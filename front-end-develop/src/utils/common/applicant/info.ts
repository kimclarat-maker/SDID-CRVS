import { getStorage } from "@/utils/storage";

export const getApplicantDetails = async () => {
  // Retrieve applicant details from storage
  let applicant = await getStorage("applicantInformation");
  let identifier = await getStorage("identifier");
  let documentType = await getStorage("documentType");

  // Retrieve insurer details from storage
  const insurerIdentifier = await getStorage("insurerIdentifier");
  const insurerInformation = await getStorage("insurerInformation");
  const insurerDocumentType = await getStorage("insurerDocumentType");

  // Override applicant details with insurer details if available
  if (insurerIdentifier) {
    identifier = insurerIdentifier;
  }

  if (insurerInformation) {
    applicant = insurerInformation;
  }

  if (insurerDocumentType) {
    documentType = insurerDocumentType;
  }

  console.log("applicant", {
    documentType,
    identifier,
    applicant,
  });

  // Return the combined applicant details
  return {
    documentType,
    identifier,
    applicant,
  };
};
