import List from "./list";
import { useEffect, useState } from "react";
import Filter from "./filters";
import { useFetchSectors } from "@/hooks/geography/useSector";

function Sectors() {
  const { sectors, loadingSectors, fetchSectorsData, totalPages } =
    useFetchSectors();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    setFilters((prev: any) => {
      const updatedFilters = {
        ...prev,
        ...params,
      };

      fetchSectorsData({
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
      <div data-testid="sectors-filter">
        <Filter fetchData={fetchData} />
      </div>
      <div data-testid="sectors-list">
        <List
          data={sectors}
          loading={loadingSectors}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Sectors;
