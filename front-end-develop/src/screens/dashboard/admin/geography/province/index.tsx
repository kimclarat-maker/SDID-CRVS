import List from "./list";
import { useEffect, useState } from "react";
import Filter from "./filters";
import { useFetchProvinces } from "@/hooks/geography/useProvince";

function Provinces() {
  const { provinces, loadingProvinces, fetchProvincesData, totalPages } =
    useFetchProvinces();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    fetchProvincesData({
      ...params,
      search:
        params.search && params.search !== ""
          ? params.search.trim()
          : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <div className="row">
      <div data-testid="provinces-filter">
        <Filter fetchData={fetchData} />
      </div>
      <div data-testid="provinces-list">
        <List
          data={provinces}
          loading={loadingProvinces}
          fetchData={fetchData}
          totalPages={totalPages}
          setFilters={setFilters}
        />
      </div>
    </div>
  );
}

export default Provinces;
