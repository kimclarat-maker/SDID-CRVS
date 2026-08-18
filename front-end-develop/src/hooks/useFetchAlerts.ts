import { fetchAlerts } from "@/api/alerts";
import { AlertType } from "@/types/Alert";
import { NotificationType } from "@/types/Notification";
import { useState } from "react";

export const useFetchAlerts = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AlertType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    fetchAlertsData,
    totalPages,
  };
};
