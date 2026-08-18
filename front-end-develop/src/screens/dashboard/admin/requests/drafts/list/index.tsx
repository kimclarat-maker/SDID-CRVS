import List from "./list";
import { useEffect, useState } from "react";
import AppFilters from "./filters";
import { useFetcDrafts } from "@/hooks/useFetchDrafts";
import { getDefaultDates } from "@/constants/DEFAULTFILTERS";

function Drafts({
  // enrollmentStatus,
  tab,
}: {
  // enrollmentStatus: string;
  tab: string;
}) {
  const DEFAULT_FILTERS = getDefaultDates(2);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, loading, fetchDraftsData, totalPages } = useFetcDrafts();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      offset: 0,
      limit: 10,
      ...filters,
      ...params,
      preEnrollmentNo:
        params.search && params.search !== "" ? params.search : undefined,
      status: "DRAFT",
      // enrollmentStatus,
    };

    if (params.search !== "") {
      delete params.search;
      delete params.startDate;
      delete params.endDate;
    } else {
      delete params.search;
      delete params.startDate;
      delete params.endDate;
    }

    if (params.startDate === "" && params.endDate === "") {
      delete params.startDate;
      delete params.endDate;
    }

    fetchDraftsData({
      ...filterBy,
    });
  };

  useEffect(() => {
    if (tab !== "draft") return;
    fetchData(filters);
  }, [filters, tab]); //enrollmentStatus

  return (
    <>
      <AppFilters filters={filters} setFilters={setFilters} />
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

export default Drafts;
