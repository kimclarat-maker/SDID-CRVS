import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";

const findByAnyIdentifier = (identifier: string) => {
  const db = getDemoData();
  const term = identifier.trim().toUpperCase();

  const applicant = db.applicants.find(
    (a) => a.identityNumber.toUpperCase() === term
  );
  if (applicant) return applicant;

  const application = db.applications.find(
    (a) => a.reference.toUpperCase() === term
  );
  if (application) {
    return db.applicants.find((a) => a.id === application.applicantId);
  }

  return undefined;
};

// Shape mirrors the fields the citizen-info screens read directly
// (firstName/lastName/dob/gender/nationality/phoneNumber/photo).
export const demoFetchApplicantByDocumentNumber = async (
  documentNumber: string
) => {
  const applicant = findByAnyIdentifier(documentNumber);
  if (!applicant) {
    throw new Error("No demo applicant found for that identity number.");
  }

  return demoDelay({
    identityNumber: applicant.identityNumber,
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    dob: applicant.dob,
    gender: applicant.gender,
    citizenshipStatus: applicant.citizenshipStatus,
    phoneNumber: applicant.phoneNumber,
    email: applicant.email,
    region: applicant.region,
    district: applicant.district,
    localArea: applicant.localArea,
    photo: applicant.photo,
  });
};

export const demoFetchApplicantPhoneNumbers = async (
  documentNumber: string
) => {
  const applicant = findByAnyIdentifier(documentNumber);
  return demoDelay(applicant ? [applicant.phoneNumber] : []);
};
