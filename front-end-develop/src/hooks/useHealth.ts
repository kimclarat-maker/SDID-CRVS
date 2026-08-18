import { fetchDevices, fetchDeviceByID } from "@/api/device";
import {
  fetchOfflineSyncedAnalytics,
  fetchOnlineSyncedAnalytics,
} from "@/api/syncStats";
import { DeviceType, GETParameters } from "@/types/Device";
import { useState } from "react";

export const useFetchOfflineStats = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});

  const fetchOfflineStatsData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchOfflineSyncedAnalytics(params);

      setData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return { data, loading, fetchOfflineStatsData, setLoading };
};
export const useFetchOnlineStats = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});

  const fetchOnlineSyncData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchOnlineSyncedAnalytics(params);

      setData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return { data, loading, fetchOnlineSyncData, setLoading };
};
