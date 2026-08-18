import List from "./list";
import { useEffect, useState } from "react";
import Filter from "./filters";
import { useFetchVillages } from "@/hooks/geography/useVillage";

function Villages() {
  const { villages, loadingVillages, fetchVillagesData, totalPages } =
    useFetchVillages();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    setFilters((prev: any) => {
      const updatedFilters = {
        ...prev,
        ...params,
      };

      fetchVillagesData({
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
      <div data-testid="villages-filter">
        <Filter fetchData={fetchData} />
      </div>
      <div data-testid="villages-list">
        <List
          data={villages}
          loading={loadingVillages}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Villages;
