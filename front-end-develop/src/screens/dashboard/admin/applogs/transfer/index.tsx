import AppFilters from "../filters";
import List from "../error/list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import { useFetchDevices } from "@/hooks/useDevices";

function Devices({ status }: { status?: string }) {
  const { filters } = useContext(FilterContext);

  const { data, loading, fetchDeviceData, totalPages } = useFetchDevices();

  const fetchData = (params: any = {}) => {
    fetchDeviceData({
      offset: params.offset || 0,
      limit: params.limit || 10,
      type: params?.type,
      status,
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters.accounts]);

  return (
    <>
      <AppFilters page={`${status}Devices`} />
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

export default Devices;
