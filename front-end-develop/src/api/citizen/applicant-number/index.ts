import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchApplicantByApplicantNumber = async (
  applicantNumber: string
) => {
  try {
    // "nida" is a legacy backend route segment, not a display term — kept for backend compatibility.
    const options = {
      method: "GET",
      url: `/citizen-info/nida/applicant-number/${applicantNumber}`,
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
  }
};
