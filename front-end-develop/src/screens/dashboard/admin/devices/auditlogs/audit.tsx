import { LanguageContext } from "@/context/LanguageContext";
import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useFetchDeviceAuditLogs } from "@/hooks/useDevices";
import List from "./list";
import Button from "@/components/button";

interface Props {
  deviceId: string;
  tab?: string;
}

const AuditLogs: React.FC<Props> = ({ deviceId, tab }) => {
  const { translation } = useContext(LanguageContext);
  const [filters, setFilters] = React.useState({});
  const { data, fetchDeviceData, loading } = useFetchDeviceAuditLogs();

  const fetchData = useCallback(() => {
    if (!deviceId) return;
    if (tab && tab !== "3") return;
    fetchDeviceData(deviceId);
  }, [deviceId, tab, fetchDeviceData]);

  useEffect(() => {
    fetchData();
  }, [deviceId]);

  return (
    <>
      <div>
        <Button text={translation.refresh} onClick={fetchData} />
      </div>
      <br />
      <List
        loading={loading}
        data={data}
        fetchData={fetchData}
        setFilters={setFilters}
      />
    </>
  );
};

export default AuditLogs;
