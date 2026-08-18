import toastMessage from "@/utils/common/toastMessage";
import api from "../..";
import { defineAccess } from "@/utils/common/permissions";

export const fetchErrorLogs = async (errorCode: string) => {
  try {
    //access
    const hasAccess = defineAccess({ method: "get", module: "logs" });

    if (!hasAccess) return;

    const options = {
      method: "GET",
      url: `/analytics/error-logs/${errorCode}`,
    };

    const { data } = await api(options);

    return {
      data: data._id ? [data] : data,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};
