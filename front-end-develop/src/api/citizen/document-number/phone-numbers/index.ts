import toastMessage from "@/utils/common/toastMessage";
import api from "../../..";

export const fetchApplicantPhoneNumbers = async (documentNumber: string) => {
  try {
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
