import List from "./list";
import { useEffect, useState } from "react";
import { useHolidaysByYear } from "@/hooks/useHolidays";
import { Stack } from "rsuite";
import Button from "@/components/button";
import Input from "@/components/input";

function CustomHolidays({ refresh }: { refresh?: boolean }) {
  const [error, setError] = useState<{ year?: string }>({});
  const [year, setYear] = useState(new Date().getFullYear());
  const { holidaysByYear, loadingHolidaysByYear, fetchHolidaysByYearData } =
    useHolidaysByYear();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const fetchData = () => {
    fetchHolidaysByYearData(year);
  };

  return (
    <>
      <Stack wrap spacing={8}>
        <Stack.Item>
          <Input
            name="year"
            value={year.toString()}
            onChange={(e) => setYear(Number(e))}
            type="number"
            error={error.year}
          />
        </Stack.Item>
        <Stack.Item>
          <Button
            startIcon="search"
            onClick={fetchData}
            loading={loadingHolidaysByYear}
          />
        </Stack.Item>
      </Stack>
      <List
        data={holidaysByYear}
        loading={loadingHolidaysByYear}
        fetchData={fetchData}
      />
    </>
  );
}

export default CustomHolidays;
