import toastMessage from "@/utils/common/toastMessage";
import api, { apiHandler } from "..";
import { customFilter } from "@/utils/common/customFilter";
import axios from "axios";
import { cfg } from "@/constants/cfg";

const API_BASE_URL =
  cfg.VITE_NODE_ENV === "production"
    ? cfg.VITE_PRODUCTION_API + "/analytics"
    : "http://10.10.73.7:5002/api";

export const fetchSummaryAnalytics = async (params?: any) => {
  try {
    let { center } = params || {};
    delete params.firstName;
    delete params.lastName;
    delete params.phoneNumber;
    delete params.preEnrollmentNumber;
    delete params.limit;
    delete params.offset;

    const options = {
      method: "GET",
      url: `/analytics/summary`,
      params: {
        ...params,
        center: customFilter(center)
      }
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchGeneralAnalytics = async (params?: any) => {
  try {
    let { province } = params || {};

    delete params.firstName;
    delete params.lastName;
    delete params.phoneNumber;
    delete params.preEnrollmentNumber;
    delete params.limit;
    delete params.offset;

    const options = {
      method: "GET",
      url: `/reports/dashboard`,
      params: {
        ...params,
        province: customFilter(province)
      }
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

let analyticsAPI: any = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

const getAnalyticsToken = () => {
  // Resolve from the configured app storage key first, then fall back for legacy key.
  const appStorageKey = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";
  const raw =
    sessionStorage.getItem(appStorageKey) ||
    sessionStorage.getItem("ENROLLMENT");

  if (!raw) return null;

  try {
    return JSON.parse(raw)?.token || null;
  } catch {
    return null;
  }
};

analyticsAPI.interceptors.request.use((config: any) => {
  const token = getAnalyticsToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  if (cfg.VITE_API_KEY) {
    config.headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
  }

  if (cfg.VITE_API_SECRET_KEY) {
    config.headers["x-sdid-api-secret-key"] = cfg.VITE_API_SECRET_KEY;
  }

  return config;
});

analyticsAPI.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalConfig = error?.config;
    const status = error?.response?.status;

    // Retry once for analytics endpoints after refreshing auth headers.
    if (status === 401 && originalConfig && !originalConfig._analyticsRetried) {
      originalConfig._analyticsRetried = true;
      originalConfig.headers = originalConfig.headers || {};

      const token = getAnalyticsToken();
      if (token) {
        originalConfig.headers.Authorization = `Bearer ${token}`;
      } else if (originalConfig.headers?.Authorization) {
        delete originalConfig.headers.Authorization;
      }

      if (cfg.VITE_API_KEY) {
        originalConfig.headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
      }

      if (cfg.VITE_API_SECRET_KEY) {
        originalConfig.headers["x-sdid-api-secret-key"] =
          cfg.VITE_API_SECRET_KEY;
      }

      return analyticsAPI(originalConfig);
    }

    return Promise.reject(error);
  }
);

export const getAggregates = async (
  date: any,
  hour: any = null,
  fromHour: any = null,
  toHour: any = null
) => {
  const params: any = { date };
  if (hour !== null) params.hour = hour;
  if (fromHour !== null) params.from_hour = fromHour;
  if (toHour !== null) params.to_hour = toHour;

  const response = await analyticsAPI.get("/aggregates", { params });
  return response.data;
};

export const getOperatorProductivity = async (
  date: any,
  type: string,
  hour = null,
  fromHour = null,
  toHour = null
) => {
  const params: any = { date, type };
  if (hour !== null) params.hour = hour;
  if (fromHour !== null) params.from_hour = fromHour;
  if (toHour !== null) params.to_hour = toHour;

  const response = await analyticsAPI.get("/operators", { params });
  return response.data;
};

export const manualTrigger = async (date: any, hour: any) => {
  const response = await analyticsAPI.post("/manual", null, {
    params: { date, hour }
  });
  return response.data;
};

export const backfillDay = async (date: any) => {
  const response = await analyticsAPI.post("/backfill", null, {
    params: { date },
    timeout: 300000 // 5 minutes timeout for full day processing
  });
  return response.data;
};

export const exportOperatorCSV = async (
  date: any,
  type: any,
  fromHour = 8,
  toHour = 19
) => {
  const params = {
    date,
    type,
    from_hour: fromHour,
    to_hour: toHour
  };
  const response = await analyticsAPI.get("/export/csv", {
    params,
    responseType: "blob"
  });

  // Trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  // Format filename
  const dateObj = new Date(date);
  const prefix = type === "enrollment" ? "E" : "P";
  const filename = `${prefix}-${dateObj
    .getDate()
    .toString()
    .padStart(2, "0")}-${(dateObj.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${dateObj.getFullYear()}.csv`;

  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const getSummary = async (date: any, fromHour = 8, toHour = 19) => {
  const response = await analyticsAPI.get("/export/summary", {
    params: { date, from_hour: fromHour, to_hour: toHour }
  });
  return response.data.summary;
};

export const downloadGraphs = async (date: any, fromHour = 8, toHour = 19) => {
  const params = { date, from_hour: fromHour, to_hour: toHour };
  const response = await analyticsAPI.get("/export/graphs", {
    params,
    responseType: "blob",
    timeout: 120000 // 2 minutes for graph generation
  });

  // Trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  // Format filename
  const dateObj = new Date(date);
  const filename = `analytics_${dateObj
    .getDate()
    .toString()
    .padStart(2, "0")}-${(dateObj.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${dateObj.getFullYear()}.zip`;

  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
