import { fetchRequestByIdentifierLogs } from "@/api/applogs/requestLogs";
import { GETByRequestIdentifierLogsParameters } from "@/types/LogsType";
import { useState } from "react";

export const useFetchByRequestLogs = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [totalPages, setTotal] = useState();
  const [logs, setData] = useState<any[]>([]);

  const fetchRequestIDLogsData = async (
    params: GETByRequestIdentifierLogsParameters
  ) => {
    setLoading(true);
    try {
      const data: any = await fetchRequestByIdentifierLogs(params);

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

  return { loadingLogs, logs, fetchRequestIDLogsData, totalPages };
};
