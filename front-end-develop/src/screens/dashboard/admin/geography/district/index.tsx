import List from "./list";
import { useEffect, useState } from "react";
import Filter from "./filters";
import { useFetchDistricts } from "@/hooks/geography/useDistrict";

function Provinces() {
  const { districts, loadingDistricts, fetchDistrictsData, totalPages } =
    useFetchDistricts();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    setFilters((prev: any) => {
      const updatedFilters = {
        ...prev,
        ...params,
      };

      fetchDistrictsData({
        ...updatedFilters,
        order: updatedFilters?.order || "desc",
        limit: 10,
      });

      return updatedFilters;
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, []);

  return (
    <div className="row">
      <div data-testid="districts-filter">
        <Filter fetchData={fetchData} />
      </div>
      <div data-testid="districts-list">
        <List
          data={districts}
          loading={loadingDistricts}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Provinces;
