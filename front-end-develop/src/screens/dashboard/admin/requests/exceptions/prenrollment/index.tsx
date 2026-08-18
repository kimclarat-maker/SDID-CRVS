import List from "./list";
import { useEffect, useState } from "react";
import AppFilters from "./filters";

import { useFetchPrenrollmentSelfieSkip } from "@/hooks/useFetchSkipSelfie";
import { getDefaultDates } from "@/constants/DEFAULTFILTERS";

function Exceptions({ tab }: { tab: string }) {
  const DEFAULT_FILTERS = {
    ...getDefaultDates(2),
    offset: 0,
    limit: 10,
    search: undefined,
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, loading, fetchPrenrollmentSkipSelfieData, totalPages } =
    useFetchPrenrollmentSelfieSkip();

  const fetchData = (params: any = {}) => {
    let requestBody = {
      ...params,
      search: undefined,
      preEnrollmentNumber:
        params.search && params.search !== "" ? params.search : undefined,
    };

    if (params.search && params.search !== "") {
      delete params.startDate;
      delete params.endDate;
    }

    if (params.search && params.search !== "") {
      delete params.startDate;
      delete params.endDate;
    }

    fetchPrenrollmentSkipSelfieData(requestBody);
  };

  useEffect(() => {
    if (tab !== "prenrollment") return;
    fetchData(filters);
  }, [filters]);

  return (
    <>
      <AppFilters setFilters={setFilters} filters={filters} />
      <br />
      <List
        data={data}
        loading={loading}
        setFilters={setFilters}
        totalPages={totalPages}
        fetchData={fetchData}
      />
    </>
  );
}

export default Exceptions;
