import { useFetchModules } from "@/hooks/useModules";
import Filters from "./filters";
import List from "./list";
import { useEffect, useState } from "react";

function Modules() {
  const [filters, setFilters] = useState({});
  const { modules, loadingModules, fetchModulesData, totalPages } =
    useFetchModules();

  const fetchData = (params: any = {}) => {
    fetchModulesData({
      offset: params?.offset || 0,
      limit: params?.limit || 10,
      search: params?.search,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <div className="row">
      <div>
        <Filters filters={filters} setFilters={setFilters} />
        <br />
        <List
          data={modules}
          filters={filters}
          setFilters={setFilters}
          loading={loadingModules}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Modules;
