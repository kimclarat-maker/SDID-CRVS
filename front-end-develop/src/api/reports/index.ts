import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, ReportType } from "@/types/Report";
import api from "..";
import { isDemoMode } from "@/demo/config";
import { demoFetchReports } from "@/demo/services/adminOps";

interface ApiResponse {
  data: ReportType[];
  total: number;
}

export const fetchReports = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  if (isDemoMode()) return demoFetchReports();
  try {
    const options = {
      method: "GET",
      url: `/dashboard/reports`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};
