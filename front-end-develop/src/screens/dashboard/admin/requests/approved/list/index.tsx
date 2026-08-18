import List from "./list";
import { useContext, useEffect, useState } from "react";
import ReportFilters from "./filters";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";
import { Heading } from "rsuite";
import { useSearchParams } from "react-router-dom";
import { getFiltersFromSearchParams } from "@/utils/common/convertObjectIntoUrlParams";
import { getDefaultDates } from "@/constants/DEFAULTFILTERS";

function Approved({ tab }: { tab: string }) {
  const DEFAULT_FILTERS = {
    ...getDefaultDates(2),
    status: "APPROVED",
    offset: 0,
    limit: 10,
    search: undefined,
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { translation } = useContext(LanguageContext);
  const { data, loading, fetchEnrollmentData, totalPages } =
    useFetchEnrollments();
  const [searchParams] = useSearchParams();

  const fetchData = () => {
    let payload: any = {
      ...filters,
      enrollmentNumber:
        filters?.search && filters.search !== "" ? filters.search : undefined,
      ...getFiltersFromSearchParams(searchParams),
      status: "APPROVED",
    };

    if (payload.preEnrollmentNo === "") {
      delete payload.preEnrollmentNo;
    }

    if (!payload.startDate || payload.startDate === "") {
      delete payload.startDate;
    }

    if (!payload.endDate || payload.endDate === "") {
      delete payload.endDate;
    }

    if (payload.search) {
      delete payload.search;
    }

    fetchEnrollmentData(payload);
  };

  useEffect(() => {
    if (tab !== "approved") return;
    fetchData();
  }, [filters, tab]);

  return (
    <>
      <ReportFilters filters={filters} setFilters={setFilters} />
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

export default Approved;
