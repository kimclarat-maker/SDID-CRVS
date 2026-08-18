import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import Filter from "./filters";
import { useFetchErrorLogs } from "@/hooks/useFetchErrorLogs";

function LogCode() {
  const { filters } = useContext(FilterContext);
  const { logs, fetchErrorLogsData, loadingLogs } = useFetchErrorLogs();

  const fetchData = () => {
    if (filters?.errorCode && filters.errorCode) {
      fetchErrorLogsData(filters.errorCode);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.errorCode]);
  return (
    <div>
      <Filter loading={loadingLogs} />
      <List data={logs} loading={loadingLogs} totalPages={0} />
    </div>
  );
}

export default LogCode;
