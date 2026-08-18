import { useEffect } from "react";
import SMSFilters from "./filters";
import List from "./list";
import { useFetchSMSSettings } from "@/hooks/useSMS";

function SMSConfiguration() {
  const { loadingSmsSettings, smsSettingsData, fetchSMSSettingsData } =
    useFetchSMSSettings();

  const fetchData = () => {
    fetchSMSSettingsData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <SMSFilters fetchData={fetchData} />
      <List
        data={smsSettingsData}
        loading={loadingSmsSettings}
        fetchData={fetchData}
      />
    </>
  );
}

export default SMSConfiguration;
