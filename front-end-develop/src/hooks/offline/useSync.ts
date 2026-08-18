import { fetchOfflineSync } from "@/api/offline";
import { useState } from "react";

export const useFetchOfflineSync = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchOfflineSyncData = async () => {
    setLoading(true);

    try {
      const data: any = await fetchOfflineSync();

      if (data) {
        setData(data);

        data.total && setTotalPages(data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch access rights:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchOfflineSyncData,
    setLoading,
    totalPages,
  };
};
