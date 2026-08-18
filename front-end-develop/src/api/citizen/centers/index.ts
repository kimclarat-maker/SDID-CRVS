import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchCenters = async () => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/centers`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};
