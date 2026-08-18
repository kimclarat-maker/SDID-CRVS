import List from "./list";
import { useContext, useEffect, useState } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchRollBacks } from "@/hooks/useFetchRollBacks";
import { Breadcrumb, Text } from "rsuite";
import { Link, useSearchParams } from "react-router-dom";
import { getFiltersFromSearchParams } from "@/utils/common/convertObjectIntoUrlParams";

function RollBacks() {
  const [filters, setFilters] = useState({});
  const { translation } = useContext(LanguageContext);
  const { data, loading, fetchRollBackData, totalPages } = useFetchRollBacks();
  const [searchParams] = useSearchParams();

  const fetchData = (params: any = {}) => {
    fetchRollBackData({
      ...params,
      offset: params.offset || 0,
      limit: params.limit || 10,
      preEnrollmentNumber:
        params.search && params.search !== "" ? params.search : undefined,
      ...getFiltersFromSearchParams(searchParams),
      status: "ROLLBACK",
      enrollmentStatus: params?.enrollmentStatus?.value,
      preEnrollmentStatus: params?.preEnrollmentStatus?.value,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <>
      {/* <Breadcrumb separator={<div className="breadcrumb-separator">&gt;</div>}>
        <Breadcrumb.Item as={Link} to="/dashboard/admin/request">
          {translation.requests.toUpperCase()}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <Text className="textBold">
            {translation.roll_back.toUpperCase()}
          </Text>
        </Breadcrumb.Item>
      </Breadcrumb> */}
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

export default RollBacks;
