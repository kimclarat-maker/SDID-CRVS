import toastMessage from "@/utils/common/toastMessage";
import api from "../../..";
import { isDemoMode } from "@/demo/config";
import { demoFetchApplicantPhoneNumbers } from "@/demo/services/applicants";

export const fetchApplicantPhoneNumbers = async (documentNumber: string) => {
  if (isDemoMode()) return demoFetchApplicantPhoneNumbers(documentNumber);

  try {
    // "nida" is a legacy backend route segment, not a display term — kept for backend compatibility.
    const options = {
      method: "GET",
      url: `/citizen-info/nida/phone-numbers/${documentNumber}`,
    };

    const { data } = await api(options);

    return data?.data || [];
  } catch (error) {
    toastMessage("error", error);
  }
};
