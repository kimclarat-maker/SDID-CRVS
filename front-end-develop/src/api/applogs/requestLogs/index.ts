import toastMessage from "@/utils/common/toastMessage";
import { GETByRequestIdentifierLogsParameters } from "@/types/LogsType";
import api from "../..";
import { defineAccess } from "@/utils/common/permissions";
import { isDemoMode } from "@/demo/config";
import { demoFetchRequestByIdentifierLogs } from "@/demo/services/logs";

export const fetchRequestByIdentifierLogs = async (
  params?: GETByRequestIdentifierLogsParameters
) => {
  try {
    //access
    const hasAccess = defineAccess({ method: "get", module: "logs" });

    if (!hasAccess) return;

    if (isDemoMode()) return demoFetchRequestByIdentifierLogs();

    if (!params?.identifier)
      return toastMessage("error", "MISSING PARAMS: identifier ");

    const options = {
      method: "GET",
      url: `/analytics/application-logs/by-request-identifier/${params?.identifier}`,
      params: {
        ...params,
        fromDay: params?.fromDay,
        toDay: params?.toDay,
        identifier: params?.identifier,
        offset: params?.offset || 0,
        limit: params?.limit || 10,
      },
    };

    const { data } = await api(options);

    return {
      data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};
