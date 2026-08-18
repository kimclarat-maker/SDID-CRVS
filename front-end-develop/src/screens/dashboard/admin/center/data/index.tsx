import { useFetchCenters } from "@/hooks/useCenters";
import List from "../list";
import { useEffect, useState } from "react";
import CenterFilters from "../filters";

function DataCenters({ status }: { status: string }) {
  const [filters, setFilters] = useState();
  const { centers, loadingCenters, fetchCentersData, totalPages } =
    useFetchCenters();

  const fetchData = (params: any = {}) => {
    fetchCentersData({
      offset: params.offset || 0,
      limit: params.limit || 10,
      country: params?.country?.label,
      province: params?.province?.label,
      district: params?.district?.label,
      sector: params?.sector?.label,
      cell: params?.cell?.label,
      status,
      search: params.search && params.search !== "" ? params.search : undefined,
      centerType: params?.centerType?.value,
      centerLevel: params?.centerLevel?.value,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <>
      <br />
      <CenterFilters filters={filters} setFilters={setFilters} />
      <br />
      <List
        data={centers}
        loading={loadingCenters}
        fetchData={fetchData}
        totalPages={totalPages}
      />
    </>
  );
}

export default DataCenters;
