import {
  fetchAccountNIDLogs,
  fetchSessionActivityLogs,
  fetchAccountActivityLogs,
  fetchAccountActivityLogsBySessionId,
} from "@/api/applogs/accountNIDLogs";
import { GETAccountNIDLogsParameters } from "@/types/LogsType";
import { useState } from "react";

export const useFetchAccountNIDLogs = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [totalPages, setTotal] = useState<number>();
  const [logs, setData] = useState<any[]>([]);

  const fetchAccountIDLogsData = async (
    params: GETAccountNIDLogsParameters
  ) => {
    setLoading(true);
    try {
      const data = await fetchAccountNIDLogs(params);

      if (data && data.data) {
        setData([]);

        setTotal(0);

        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchAccountIDLogsData, totalPages };
};

export const useFetchGetActivityLogsBySessionId = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState<number>();
  const [logs, setData] = useState<any[]>([]);

  const fetchSessionActivityLogsData = async () => {
    setLoading(true);
    try {
      const data = await fetchSessionActivityLogs();

      if (data && data.data.data) {
        setData(data.data.data);

        setLoading(false);

        setTotalPages(0);
      }
    } catch (error) {
      console.error("Failed to fetch session activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchSessionActivityLogsData, totalPages };
};

export const useFetchGetAccountActivityLogsByIdentifier = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [logs, setData] = useState<any[]>([]);

  const fetchAccountActivityLogsData = async () => {
    setLoading(true);
    try {
      const data = await fetchAccountActivityLogs();

      if (data && data.data) {
        setData([]);

        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchAccountActivityLogsData };
};

type SessionFilterType = {
  sessionId: string;
  startDate: string;
  endDate: string;
  identifier: string;
  limit: number;
  offset: number;
  mainModule?: string;
};

export const useFetchGetAccountActivityLogsBySessionId = () => {
  const [loadingLogs, setLoading] = useState(false);
  const [logs, setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>();

  const fetchAccountActivityLogsData = async (params: SessionFilterType) => {
    setLoading(true);
    try {
      const data = await fetchAccountActivityLogsBySessionId();

      if (data && data.data) {
        setData([]);
        setTotalPages(0);

        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loadingLogs, logs, fetchAccountActivityLogsData, totalPages };
};
