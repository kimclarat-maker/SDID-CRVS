import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchAllSources = async ({
  requestId,
  fields,
}: {
  requestId: string;
  fields?: string;
}) => {
  try {
    const options = {
      method: "GET",
      url: `/requests/citizen-info/all-sources`,
      params: {
        requestId,
        fields,
      },
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchAllSourcesInfo = async (requestId: string) => {
  try {
    const options = {
      method: "GET",
      url: `/requests/citizen-info/all-sources/${requestId}`,
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
  }
};
