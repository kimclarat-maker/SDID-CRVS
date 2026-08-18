import { fetchErrorLogs } from "@/api/applogs/errorLogs";
import { useState } from "react";

export const useFetchErrorLogs = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [logs, setData] = useState<any[]>([]);

  const fetchErrorLogsData = async (errorCode: string) => {
    setLoading(true);
    try {
      const data = await fetchErrorLogs(errorCode);

      if (data && data.data) {
        setData(data.data);

        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchErrorLogsData };
};
