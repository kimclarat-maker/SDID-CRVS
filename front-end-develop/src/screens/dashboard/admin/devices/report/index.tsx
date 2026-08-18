import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useEffect } from "react";
import { List, Stack } from "rsuite";
import { AccountType } from "@/types/Account";
import { useFetchDeviceReport } from "@/hooks/useDevices";

interface Props {
  deviceId: string;
}

const Report: React.FC<Props> = ({ deviceId }) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchDeviceData, loading } = useFetchDeviceReport();

  const [filters, setFilters] = React.useState({});

  useEffect(() => {
    fetchDeviceData(filters);
  }, []);

  if (loading) return <Loading isFullScreen />;

  const renderItem = () => {
    return (
      <List.Item>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.total_devices}:</Stack.Item>
          <Stack.Item> {data?.totalDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.active_devices}:</Stack.Item>
          <Stack.Item> {data?.activeDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.active}:</Stack.Item>
          <Stack.Item> {data?.activeDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.inactive}:</Stack.Item>
          <Stack.Item> {data?.inactiveDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.maintenance}:</Stack.Item>
          <Stack.Item> {data?.maintenanceDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.damaged}:</Stack.Item>
          <Stack.Item> {data?.damagedDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.retired}:</Stack.Item>
          <Stack.Item> {data?.retiredDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.retired}:</Stack.Item>
          <Stack.Item> {data?.assignedDevices || 0}</Stack.Item>
        </Stack>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{translation.retired}:</Stack.Item>
          <Stack.Item> {data?.unassignedDevices || 0}</Stack.Item>
        </Stack>
      </List.Item>
    );
  };

  return (
    <div className="rs-modal-body">
      <List>
        <List.Item>
          {translation.total_devices}: {data?.total || 0}
        </List.Item>
      </List>
    </div>
  );
};

export default Report;
