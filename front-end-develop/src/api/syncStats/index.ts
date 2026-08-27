import axios from "axios";
import api, { apiHandler } from "..";
import { getStorage } from "@/utils/storage";
import { cfg } from "@/constants/cfg";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchOnlineSyncedAnalytics,
  demoFetchOfflineSyncedAnalytics,
} from "@/demo/services/adminOps";

export const fetchOnlineSyncedAnalytics = async (params?: any) => {
  if (isDemoMode()) return demoFetchOnlineSyncedAnalytics();
  try {
    const user = await getStorage();

    const baseUrl = await apiHandler("apiGateway");

    const centerId = user?.account?.centerId || undefined;

    if (!centerId) return;

    let url = `${baseUrl}/dashboard/stats?centerId=${centerId}`;

    const options = {
      method: "GET",
      url,
      params,
      headers: {
        authorization: `Bearer ${user.token}`,
        "x-sdid-api-key": cfg.VITE_API_KEY,
        "x-sdid-api-secret-key": cfg.VITE_API_SECRET_KEY,
      },
    };

    const { data } = await axios(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchOfflineSyncedAnalytics = async (params?: any) => {
  if (isDemoMode()) return demoFetchOfflineSyncedAnalytics();
  try {
    const options = {
      method: "GET",
      url: `/sync/statistics`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
