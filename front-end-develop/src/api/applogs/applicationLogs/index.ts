import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/LogsType";
import api from "../..";
import { defineAccess } from "@/utils/common/permissions";
import moment from "moment";
import { isDemoMode } from "@/demo/config";
import { demoFetchApplicationLogs } from "@/demo/services/logs";

export const fetchApplicationLogs = async (params?: GETParameters) => {
  try {
    //access
    const hasAccess = defineAccess({ method: "get", module: "logs" });

    if (!hasAccess) return;

    if (isDemoMode()) return demoFetchApplicationLogs(params);

    if (params && !params.fromDay) {
      params.fromDay = moment().subtract(7, "d").format("YYYY-MM-DD");
    }

    if (params && !params.toDay) {
      params.toDay = moment().format("YYYY-MM-DD");
    }

    const options = {
      method: "GET",
      url: `/analytics/application-logs`,
      params: {
        fromDay: params?.fromDay,
        toDay: params?.toDay,
        page: params?.offset || 0,
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
