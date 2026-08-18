import { fetchNotifications } from "@/api/notifications";
import { NotificationType } from "@/types/Notification";
import { useState } from "react";

export const useFetchNotifications = () => {
  const [loadingNotifications, setLoading] = useState(false);
  const [data, setData] = useState<NotificationType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingNotifications,
    data,
    fetchNotificationsData,
    totalPages,
  };
};
