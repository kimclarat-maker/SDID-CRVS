import List from "./list";
import { useContext, useEffect, useState } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchRollBacks } from "@/hooks/useFetchRollBacks";
import { Breadcrumb, Text } from "rsuite";
import { Link, useSearchParams } from "react-router-dom";
import { getFiltersFromSearchParams } from "@/utils/common/convertObjectIntoUrlParams";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";

function Offline() {
  const [filters, setFilters] = useState({});
  const { translation } = useContext(LanguageContext);
  const { data, loading, fetchEnrollmentData, totalPages } =
    useFetchEnrollments();
  const [searchParams] = useSearchParams();

  const fetchData = (params: any = {}) => {
    fetchEnrollmentData(
      {
        ...params,
        offset: params.offset || 0,
        limit: params.limit || 10,
        preEnrollmentNumber:
          params.search && params.search !== "" ? params.search : undefined,
        ...getFiltersFromSearchParams(searchParams),
      },
      "OFFLINE"
    );
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <>
      <ReportFilters setFilters={setFilters} filters={filters} />
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

export default Offline;
