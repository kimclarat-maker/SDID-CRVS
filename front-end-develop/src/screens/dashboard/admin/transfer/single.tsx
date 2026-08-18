import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import { useFetchTransferById } from "@/hooks/useFetchSchedulesTransferred";
import { useParams } from "react-router-dom";
import toastMessage from "@/utils/common/toastMessage";
import Loading from "@/components/loader";
import Empty from "@/components/empty";
import { LanguageContext } from "@/context/LanguageContext";

function Single() {
  const { translation } = useContext(LanguageContext);
  const { id } = useParams();
  const { data, loading, fetchTransferredByIdData } = useFetchTransferById();

  const fetchData = () => {
    if (!id) return toastMessage("error", "No id found");
    fetchTransferredByIdData(id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading isFullScreen />;

  if (!data)
    return (
      <Empty
        title={translation.no_data}
        description={translation.no_data_found_description + " " + id}
      />
    );

  return <>I am here</>;
}

export default Single;
