import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import Header from "@/components/header";
import { LanguageContext } from "@/context/LanguageContext";
import { Breadcrumb, Text } from "rsuite";
import { Link } from "react-router-dom";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";

const page = "REJECTED";

function Rejected() {
  const { filters } = useContext(FilterContext);
  const { translation } = useContext(LanguageContext);
  const { data, loading, fetchEnrollmentData, totalPages } =
    useFetchEnrollments();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      ...filters?.[page],
      ...params,
    };
    fetchEnrollmentData({
      ...filterBy,
      status: "REJECTED",
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters?.[page]);
  }, [filters?.[page]]);

  return (
    <>
      <Breadcrumb separator={<div className="breadcrumb-separator">&gt;</div>}>
        <Breadcrumb.Item as={Link} to="/dashboard/admin/request">
          {translation.requests.toUpperCase()}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <Text className="textBold">{translation.rejected.toUpperCase()}</Text>
        </Breadcrumb.Item>
      </Breadcrumb>
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

export default Rejected;
