import { useEffect } from "react";
import Filters from "./filters";
import List from "./list";
import { useFetchSMSTemplate } from "@/hooks/useSMS";

function SMSTemplate() {
  const { smsTemplateData, fetchSMSTemplateData, loadingSmsSettings } =
    useFetchSMSTemplate();

  const fetchData = () => {
    fetchSMSTemplateData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Filters fetchData={fetchData} />
      <List
        data={smsTemplateData}
        loading={loadingSmsSettings}
        fetchData={fetchData}
      />
    </>
  );
}

export default SMSTemplate;
