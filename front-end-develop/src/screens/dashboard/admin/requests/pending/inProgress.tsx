import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";

const page = "APPROVAL_IN_PROGRESS";

function InProgress() {
  const { filters } = useContext(FilterContext);
  const { data, loading, fetchEnrollmentData, totalPages } =
    useFetchEnrollments();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      ...filters?.[page],
      ...params,
    };
    fetchEnrollmentData({
      ...filterBy,
      status: "APPROVAL_IN_PROGRESS",
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters?.[page]);
  }, [filters?.[page]]);

  return (
    <>
      <ReportFilters page={page} />
      <br />
      <List
        data={data}
        loading={loading}
        fetchData={fetchData}
        totalPages={totalPages}
      />
    </>
  );
}

export default InProgress;
