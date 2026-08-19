import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchApplicantByNIN = async (nin: string) => {
  try {
    // "nida"/"nin" are legacy backend route segments, not display terms — kept for backend compatibility.
    const options = {
      method: "GET",
      url: `/citizen-info/nida/nin/${nin}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};
