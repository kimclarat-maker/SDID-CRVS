import List from "./list";
import AppFilters from "./filters";
import { useEffect } from "react";
import { useFetchAlerts } from "@/hooks/useFetchAlerts";

function Alerts() {
  const { data, loading, fetchAlertsData, totalPages } = useFetchAlerts();

  const fetchData = () => {
    fetchAlertsData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <AppFilters page="alerts" />
      <br />
      <List
        data={data}
        loading={loading}
        totalPages={totalPages}
        fetchData={fetchData}
      />
    </div>
  );
}

export default Alerts;
