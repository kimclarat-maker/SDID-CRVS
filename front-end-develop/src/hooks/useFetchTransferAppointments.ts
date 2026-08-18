import { fetchReports } from "@/api/reports";
import { GETParameters, ReportType } from "@/types/Report";
import { useState } from "react";

export const useFetchReport = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<ReportType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchReportData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchReports(params);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchReportData,
    setLoading,
    totalPages,
  };
};
