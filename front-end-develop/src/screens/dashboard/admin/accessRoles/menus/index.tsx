import Filters from "./filters";
import List from "./list";
import { useFetchRoleMenus } from "@/hooks/useRole";
import { FilterContext } from "@/context/FilterContext";
import { useContext, useEffect } from "react";

function Menus() {
  const { filters } = useContext(FilterContext);
  const { menus, loadingMenus, fetchRoleMenusData, totalPages } =
    useFetchRoleMenus();

  const fetchData = () => [
    fetchRoleMenusData({
      offset: filters.menus?.offset || 0,
      limit: filters?.menus?.limit || 10,
      search: filters?.menus?.search,
    }),
  ];

  useEffect(() => {
    fetchData();
  }, [filters.menus]);

  return (
    <div className="row">
      <Filters fetchData={fetchData} />
      {/* <div>
        <List
          data={menus}
          loading={loadingMenus}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div> */}
    </div>
  );
}

export default Menus;
