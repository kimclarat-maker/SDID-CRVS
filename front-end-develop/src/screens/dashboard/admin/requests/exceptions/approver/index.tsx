import List from "./list";
import { useContext, useEffect, useState } from "react";
import AppFilters from "./filters";

import { useFetchEnrollmentSelfieSkip } from "@/hooks/useFetchSkipSelfie";
import { getDefaultDates } from "@/constants/DEFAULTFILTERS";

function PairValidatorExceptions({ tab }: { tab: string }) {
  const DEFAULT_FILTERS = {
    ...getDefaultDates(2),
    offset: 0,
    limit: 10,
    search: undefined,
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, loading, fetchEnrollmentSkipSelfieData, totalPages } =
    useFetchEnrollmentSelfieSkip();

  const fetchData = (params: any = {}) => {
    let payload: any = {
      ...filters,
      fatherNames: params.fatherNames,
      motherNames: params.fatherNames,
      firstName: params.firstName,
      lastName: params.lastName,
      preEnrollmentNo:
        params.search && params.search !== "" ? params.search : undefined,
      approverSelfieSkipStatus: params.approverSelfieSkipStatus || "PENDING",
    };

    if (params.startDate !== "" && params.endDate !== "") {
      payload.startDate = params.startDate;
      payload.endDate = params.endDate;
    }
    fetchEnrollmentSkipSelfieData(payload);
  };

  useEffect(() => {
    if (tab !== "pair") return;
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
      />
    </>
  );
}

export default PairValidatorExceptions;
