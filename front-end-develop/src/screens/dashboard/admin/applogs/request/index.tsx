import { useEffect, useState } from "react";
import List from "./list";
import { useFetchByRequestLogs } from "@/hooks/useFetchByRequestLogs";
import moment from "moment";
import CustomTabs from "@/components/tabs";
import Reviewer from "./reviewer";
import LogsFilters from "./filters";
import Appointments from "./appointments";
import AddPrenrollment from "./request";

function RequestIDLogs() {
  const { logs, fetchRequestIDLogsData, loadingLogs } = useFetchByRequestLogs();

  const [filters, setFilters] = useState<any>({
    startDate: moment().subtract("d", 30).format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });

  const fetchData = (params: any = {}) => {
    params.fromDay = params.startDate || moment().format("YYYY-MM-DD");
    (params.toDay = params.endDate || moment().format("YYYY-MM-DD")),
      (params.identifier =
        params.identifier && params.identifier !== ""
          ? params.identifier.trim()
          : undefined);
    params.order = params?.order || "desc";
    fetchRequestIDLogsData(params);
  };

  return (
    <div>
      <LogsFilters
        setFilters={(newFilters) => fetchData(newFilters)}
        filters={filters}
        loading={loadingLogs}
      />
      <CustomTabs
        options={[
          {
            title: "Request Information",
            data: <AddPrenrollment data={logs} />,
          },

          {
            title: "Appointments",
            data: <Appointments data={logs} />,
          },
          {
            title: "Reviewer",
            data: <Reviewer data={logs} />,
          },
        ]}
      />
    </div>
  );
}

export default RequestIDLogs;
