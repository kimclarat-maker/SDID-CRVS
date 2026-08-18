import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchApplicantByApplicantNumber = async (
  applicantNumber: string
) => {
  try {
    const options = {
      method: "GET",
      url: `/citizen-info/nida/applicant-number/${applicantNumber}`,
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
  }
};
