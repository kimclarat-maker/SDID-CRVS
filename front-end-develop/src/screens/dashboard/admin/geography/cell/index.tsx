import List from "./list";
import { useEffect, useState } from "react";
import Filter from "./filters";
import { useFetchCells } from "@/hooks/geography/useCell";

function Cells() {
  const { cells, loadingCells, fetchCellsData, totalPages } = useFetchCells();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    setFilters((prev: any) => {
      const updatedFilters = {
        ...prev,
        ...params,
      };

      fetchCellsData({
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
      <div data-testid="cells-filter">
        <Filter fetchData={fetchData} />
      </div>
      <div data-testid="cells-list">
        <List
          data={cells}
          loading={loadingCells}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Cells;
