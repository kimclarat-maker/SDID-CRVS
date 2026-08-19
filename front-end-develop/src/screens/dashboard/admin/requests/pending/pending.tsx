import List from "./list";
import { useContext, useEffect, useState } from "react";
import ReportFilters from "./filters";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";
import { getDefaultDates } from "@/constants/DEFAULTFILTERS";
import PageHeader from "@/components/pageHeader";
import { LanguageContext } from "@/context/LanguageContext";

function Pending() {
  const { translation } = useContext(LanguageContext);
  const DEFAULT_FILTERS = {
    ...getDefaultDates(2),
    offset: 0,
    limit: 10,
  };

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, loading, fetchEnrollmentData, totalPages } =
    useFetchEnrollments();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      ...params,
    };

    let body = {
      ...filterBy,
      status: "PENDING",
    };

    fetchEnrollmentData(body);
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <>
      <PageHeader
        title={translation.pending}
        breadcrumb={[
          { label: translation.requests },
          { label: translation.pending },
        ]}
      />
      <ReportFilters filters={filters} setFilters={setFilters} />
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

export default Pending;
