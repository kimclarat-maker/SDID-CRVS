import Card from "@/components/card";
import Empty from "@/components/empty";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchConnectedDevices, useFetchDevices } from "@/hooks/useDevices";
import { getStorage } from "@/utils/storage";
import React, { useContext, useEffect, useState } from "react";
import { List, Stack, Tag, Text } from "rsuite";

interface Props {
  enabledCapture: boolean;
}

const Device: React.FC<Props> = ({ enabledCapture }) => {
  const { translation } = useContext(LanguageContext);

  const { data, fetchDeviceData, loading } = useFetchDevices();

  const {
    data: connectedDevices,
    fetchDeviceConnectedData,
    loading: loadingDevices,
  } = useFetchConnectedDevices();

  useEffect(() => {
    const getData = async () => {
      if (enabledCapture) {
        const user = await getStorage();
        fetchDeviceConnectedData();
        fetchDeviceData({
          offset: 0,
          limit: 10,
          accountId: user?.account?._id,
        });
      }
    };

    getData();
  }, []);

  const renderItem = (el: any, i: number) => {
    // if (!el) return;
    return (
      <List.Item key={i}>
        <Stack spacing={16}>
          <Stack.Item grow={1}>{el.name + " " + el.serialNumber}:</Stack.Item>
          <Stack.Item>
            <Tag
              color={
                el.assignmentStatus?.toUpperCase() === "ASSIGNED"
                  ? "green"
                  : "red"
              }
            >
              {el.assignmentStatus}
            </Tag>
          </Stack.Item>
        </Stack>
      </List.Item>
    );
  };

  return (
    <Card
      header={<Text className="textBold">{translation.assigned_devices}</Text>}
    >
      {loadingDevices || loading ? (
        <Loading isFullScreen />
      ) : data.length > 0 ? (
        <List>{data?.map((el: any, i: number) => renderItem(el, i))}</List>
      ) : (
        <Empty
          isFullScreen
          title={translation.no_device_connected_title}
          description={translation.no_device_connected_desc}
        />
      )}
    </Card>
  );
};

export default Device;
