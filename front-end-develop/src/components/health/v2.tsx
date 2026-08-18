import React, { useContext, useEffect } from "react";
import {
  ButtonToolbar,
  Checkbox,
  List,
  Panel,
  PanelGroup,
  Stack,
  Modal as LibModal,
  TagGroup,
  Tag,
  Progress,
  Text,
  Heading,
  IconButton,
} from "rsuite";

import "./styles.css";
import { LanguageContext } from "@/context/LanguageContext";
import Button from "../button";
import { useFetchOfflineStats, useFetchOnlineStats } from "@/hooks/useHealth";
import capitalizeText from "@/utils/common/capitalizeText";
import Icon from "../icon";
import Loading from "../loader";

interface Props {
  isOnline?: boolean;
  isLocalServiceActive?: boolean;
  localServiceHealthData?: any;
  showMore?: boolean;
  retryLocalService?: () => void;
  closeModal?: () => void;
}

const Health: React.FC<Props> = ({
  isOnline,
  localServiceHealthData,
  showMore,
  closeModal,
}) => {
  const { translation } = useContext(LanguageContext);

  const {
    loading: loadingOffline,
    data: offlineData,
    fetchOfflineStatsData,
  } = useFetchOfflineStats();
  const {
    loading: loadingOnline,
    data: onlineData,
    fetchOnlineSyncData,
  } = useFetchOnlineStats();

  useEffect(() => {
    // fetchOfflineStatsData();
    // fetchOnlineSyncData();
  }, []);

  const calculateHealth = (syncedToCentral: number, totalOffline: number) => {
    const percentage = (syncedToCentral / totalOffline) * 100;

    return Math.round(percentage);
  };

  const style = {
    width: 60,
    display: "inline-block",
    marginRight: 10,
  };

  return (
    <div>
      {showMore ? (
        <PanelGroup
          defaultActiveKey="1"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <Panel
            eventKey="1"
            header={
              <Stack>
                <Stack.Item grow={1}>
                  <Heading level={5}>
                    {translation.offline_sync_statistics}
                  </Heading>
                </Stack.Item>
                <Stack.Item>
                  <IconButton
                    icon={<Icon name="refresh" />}
                    onClick={() => fetchOfflineStatsData()}
                    circle
                  />
                </Stack.Item>
              </Stack>
            }
          >
            {loadingOffline ? (
              <center>
                <Loading />
              </center>
            ) : (
              <List>
                {Object.keys(offlineData?.data?.moduleDetails || {}).map(
                  (key, i) => {
                    const p = calculateHealth(
                      offlineData?.data?.moduleDetails[key]?.syncedToCentral,
                      offlineData?.data?.moduleDetails[key]?.totalOffline
                    );
                    return (
                      <List.Item key={i}>
                        <Stack spacing={16}>
                          <Stack.Item>
                            <Text className="textBold">
                              {capitalizeText(key)}
                            </Text>
                          </Stack.Item>

                          <Stack.Item grow={1}>
                            {/* //style={{ width: 300 }} */}
                            <TagGroup>
                              <Tag>
                                {translation.synced_to_central}:{" "}
                                {
                                  offlineData?.data?.moduleDetails[key]
                                    ?.syncedToCentral
                                }
                              </Tag>
                              <Tag>
                                {translation.total_offline}:{" "}
                                {
                                  offlineData?.data?.moduleDetails[key]
                                    ?.totalOffline
                                }
                              </Tag>
                            </TagGroup>
                            {key?.toUpperCase() === "ENROLLMENT" &&
                              onlineData?.enrollmentCount && (
                                <Tag>
                                  {translation.online}:{" "}
                                  {onlineData?.enrollmentCount}
                                </Tag>
                              )}

                            {key?.toUpperCase() === "PRE-ENROLLMENT" &&
                              onlineData?.enrollmentCount && (
                                <Tag>
                                  {translation.online}:{" "}
                                  {onlineData?.preEnrollmentCount}
                                </Tag>
                              )}

                            {key?.toUpperCase() === "MEDIA" &&
                              onlineData?.enrollmentCount && (
                                <Tag>
                                  {translation.online}: {onlineData?.mediaCount}
                                </Tag>
                              )}
                          </Stack.Item>

                          <Stack.Item>
                            <div style={style}>
                              <Progress.Circle
                                percent={p}
                                strokeColor={
                                  p === 100
                                    ? "green"
                                    : p > 50
                                    ? "orange"
                                    : "red"
                                }
                              />
                            </div>
                          </Stack.Item>
                        </Stack>
                      </List.Item>
                    );
                  }
                )}
              </List>
            )}
          </Panel>
          <Panel
            eventKey="2"
            header={
              <Heading level={5}>
                {translation.local_database_health_network_status}
              </Heading>
            }
          >
            <List>
              {localServiceHealthData?.services &&
                localServiceHealthData.services?.map(
                  (e: { service: string; status: string }, i: number) => (
                    <List.Item key={i}>
                      <Stack>
                        <Stack.Item grow={1}>
                          <span className="health-key">{e.service}</span>
                        </Stack.Item>
                        <Stack.Item>
                          <Checkbox
                            checked={
                              e.status?.toUpperCase() === "UP" ? true : false
                            }
                          />
                        </Stack.Item>
                      </Stack>
                    </List.Item>
                  )
                )}
            </List>

            <br />
            <LibModal.Footer>
              <ButtonToolbar>
                {closeModal && (
                  <Button
                    text={translation.close}
                    onClick={closeModal}
                    appearance="default"
                  />
                )}
                {/* {retryLocalService && (
              <Button text={translation.retry} onClick={retryLocalService} />
            )} */}
              </ButtonToolbar>
            </LibModal.Footer>
          </Panel>
        </PanelGroup>
      ) : (
        <Stack
          className={`health-network-main ${isOnline ? "online" : "offline"}`}
        ></Stack>
      )}
    </div>
  );
};

export default Health;
