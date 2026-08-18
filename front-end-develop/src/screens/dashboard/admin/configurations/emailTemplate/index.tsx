import { useContext, useEffect } from "react";
import Filters from "./filters";
import List from "./list";
import { FilterContext } from "@/context/FilterContext";
import { useFetchEmailTemplate } from "@/hooks/useEmail";

function EmailTemplate() {
  const { filters } = useContext(FilterContext);
  const { emailTemplateData, fetchEmailTemplateData, loadingEmailTemplate } =
    useFetchEmailTemplate();

  const fetchData = () => {
    fetchEmailTemplateData({
      offset: filters?.messageTemplate?.offset || 0,
      limit: filters?.messageTemplate?.limit || 10,
      search: filters?.emailTemplate?.search || undefined,
    });
  };

  useEffect(() => {
    fetchData();
  }, [filters.messageTemplate]);

  return (
    <>
      <Filters fetchData={fetchData} />
      <List
        data={emailTemplateData}
        loading={loadingEmailTemplate}
        fetchData={fetchData}
      />
    </>
  );
}

export default EmailTemplate;
