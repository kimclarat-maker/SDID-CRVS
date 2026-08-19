import List from "./list";
import NotificationFilters from "./filters";
import { useFetchNotifications } from "@/hooks/useNotification";
import { useContext, useEffect } from "react";
import PageHeader from "@/components/pageHeader";
import { LanguageContext } from "@/context/LanguageContext";

function Notifications() {
  const { translation } = useContext(LanguageContext);
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
      <PageHeader title={translation.notifications} />
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
