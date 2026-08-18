import { useEffect } from "react";
import EmailFilters from "./filters";
import List from "./list";
import { useFetchEmailSettings } from "@/hooks/useEmail";

function EmailConfiguration() {
  const { loadingEmailSettings, emailSettingsData, fetchEmailSettingsData } =
    useFetchEmailSettings();

  const fetchData = () => {
    fetchEmailSettingsData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <EmailFilters fetchData={fetchData} />
      <List
        data={emailSettingsData}
        loading={loadingEmailSettings}
        fetchData={fetchEmailSettingsData}
      />
    </>
  );
}

export default EmailConfiguration;
