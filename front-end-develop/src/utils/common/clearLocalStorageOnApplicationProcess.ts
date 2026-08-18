export const handleClearStorageApplicationProcess = () => {
  sessionStorage.removeItem("requestId");
  sessionStorage.removeItem("applicantCategory");
  sessionStorage.removeItem("identifier");
  sessionStorage.removeItem("documentType");
  sessionStorage.removeItem("applicantInformation");
  sessionStorage.removeItem("oldApplicantInformation");
  sessionStorage.removeItem("institutionInformation");
  sessionStorage.removeItem("phoneNumber");
  sessionStorage.removeItem("selfie");
  sessionStorage.removeItem("familyMembers");
  sessionStorage.removeItem("applicantCategoryValue");
  sessionStorage.removeItem("verificationType");
  sessionStorage.removeItem("documentTypeInfo");
};
