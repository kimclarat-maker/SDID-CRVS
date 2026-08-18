import List from "./list";
import NotificationFilters from "./filters";
import { useFetchNotifications } from "@/hooks/useNotification";
import { useEffect } from "react";

function Notifications() {
  const { data, loadingNotifications, fetchNotificationsData, totalPages } =
    useFetchNotifications();

  const fetchData = () => {
    fetchNotificationsData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <NotificationFilters page="notifications" />
      <br />
      <List
        data={data}
        loading={loadingNotifications}
        totalPages={totalPages}
        fetchData={fetchData}
      />
    </div>
  );
}

export default Notifications;
