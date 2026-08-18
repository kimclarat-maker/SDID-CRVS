import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import AppFilters from "./filters";
import { useFetchSchedules } from "@/hooks/useFetchSchedules";
import { useSearchParams } from "react-router-dom";
import { getFiltersFromSearchParams } from "@/utils/common/convertObjectIntoUrlParams";

function ScheduleTable({ tab }: { tab?: string }) {
  const { filters } = useContext(FilterContext);
  const { data, loading, fetchSchedulesData, totalPages } = useFetchSchedules();
  const [searchParams] = useSearchParams();

  const fetchData = (params: any = {}) => {
    fetchSchedulesData({
      offset: params.offset || 0,
      limit: params.limit || 10,
      appointmentNo: params.appointmentNo,
      requestNo: params.requestNo,
      center: params.center?.value,
      status: params.status?.value,
      startDate: params.startDate,
      endDate: params.endDate,
      ...getFiltersFromSearchParams(searchParams),
    });
  };

  useEffect(() => {
    if (tab && tab !== "table") return;
    fetchData(filters);
  }, [filters, tab]);

  return (
    <>
      <AppFilters />
      <br />
      <List
        data={data}
        loading={loading}
        fetchData={fetchData}
        totalPages={totalPages}
      />
    </>
  );
}

export default ScheduleTable;
