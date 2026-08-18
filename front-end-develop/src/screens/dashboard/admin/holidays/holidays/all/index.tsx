import List from "./list";
import { useEffect } from "react";
import { useHolidaysAll } from "@/hooks/useHolidays";

function AllHolidays({ refresh }: { refresh?: boolean }) {
  const { allHolidays, loadingAllHolidays, fetchAllHolidaysData } =
    useHolidaysAll();

  useEffect(() => {
    fetchAllHolidaysData();
  }, []);

  useEffect(() => {
    fetchAllHolidaysData();
  }, [refresh]);

  return (
    <>
      <List
        data={allHolidays}
        loading={loadingAllHolidays}
        fetchData={fetchAllHolidaysData}
      />
    </>
  );
}

export default AllHolidays;
