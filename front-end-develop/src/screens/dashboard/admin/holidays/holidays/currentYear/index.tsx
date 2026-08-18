import List from "./list";
import { useEffect } from "react";
import { useHolidays } from "@/hooks/useHolidays";

function CurrentYearHolidays({ refresh }: { refresh?: boolean }) {
  const { holidays, loadingHolidays, fetchHolidaysData } = useHolidays();

  useEffect(() => {
    fetchHolidaysData();
  }, []);

  useEffect(() => {
    fetchHolidaysData();
  }, [refresh]);

  return (
    <>
      <List data={holidays} loading={loadingHolidays} />
    </>
  );
}

export default CurrentYearHolidays;
