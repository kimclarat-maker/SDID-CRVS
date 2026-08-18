import { fetchModuleLogs } from "@/api/applogs/moduleLogs";
import { GETModuleLogsParameters } from "@/types/LogsType";
import { useState } from "react";

export const useFetchModuleLogs = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [totalPages, setTotal] = useState();
  const [logs, setData] = useState<any[]>([]);

  const fetchModuleLogsData = async (params: GETModuleLogsParameters) => {
    setLoading(true);
    try {
      const data = await fetchModuleLogs(params);

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

  return { loadingLogs, logs, fetchModuleLogsData, totalPages };
};
