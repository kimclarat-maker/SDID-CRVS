import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useEffect, useMemo } from "react";
import { Avatar, List, Stack, Text } from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import { AccountType } from "@/types/Account";
import { useFetchDeviceAssignmentHistory } from "@/hooks/useDevices";

interface Props {
  deviceId: string;
}

const Historical: React.FC<Props> = ({ deviceId }) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchDeviceData, loading } = useFetchDeviceAssignmentHistory();

  useEffect(() => {
    fetchDeviceData(deviceId);
  }, [deviceId]);

  return (
    <div>
      {loading ? (
        <center>
          <Loading />
        </center>
      ) : (
        data?.length > 0 && (
          <List bordered>
            {data.map((el: AccountType, i: number) => {
              return (
                <List.Item key={i}>
                  <Stack spacing={16}>
                    <Stack.Item>
                      <Avatar
                        circle
                        size="sm"
                        src={(el as any).photo || userImagePlaceholder}
                      />
                    </Stack.Item>
                    <Stack.Item grow={1}>
                      <Text>
                        {(el as any).firstName || ""}{" "}
                        {(el as any).lastName || ""}
                      </Text>
                    </Stack.Item>
                    <Stack.Item></Stack.Item>
                  </Stack>
                </List.Item>
              );
            })}
          </List>
        )
      )}
    </div>
  );
};

export default Historical;
