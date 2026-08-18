import { fetchApplicationLogs } from "@/api/applogs/applicationLogs";
import { GETParameters } from "@/types/LogsType";
import { useState } from "react";

export const useFetchAppLogs = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [totalPages, setTotal] = useState<number>(0);
  const [logs, setData] = useState<any[]>([]);

  const fetchAppLogsData = async (params: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchApplicationLogs(params);

      if (data && data.data) {
        setData(data.data.data);

        setTotal(data.data.total);

        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchAppLogsData, totalPages };
};
