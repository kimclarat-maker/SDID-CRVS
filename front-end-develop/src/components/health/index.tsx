import React, { useContext, useEffect, useState } from "react";
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
  Toggle
} from "rsuite";

import "./styles.css";
import { LanguageContext } from "@/context/LanguageContext";
import Button from "../button";
import Icon from "../icon";
import { getStorage } from "@/utils/storage";
import { syncAccountData } from "@/api/accounts";
import { fetchAPIServiceInfo } from "@/api/health";
import { apiHandler } from "@/api";
import { cfg } from "@/constants/cfg";

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
  closeModal
}) => {
  const { translation } = useContext(LanguageContext);
  const [loginType, setLoginType] = useState<string | undefined>();
  const [hasUpdatedOfflineService, setHasUpdatedOffflineService] =
    useState<boolean>(true);
  const [offlineEnvironment, setEnvironment] = useState<any>();

  const openInNewTab = (path: string = "") => {
    window.open(path, "_blank");
  };

  useEffect(() => {
    const loginType: any = localStorage.getItem("loginType");
    loginType && setLoginType(loginType);
  }, []);

  const switchLocalService = async () => {
    const loginType: any = localStorage.getItem("loginType");

    let updatedLoginType =
      loginType === '"remote"' || loginType === "remote" ? "local" : "remote";

    localStorage.setItem("loginType", updatedLoginType);
    setLoginType(updatedLoginType);

    if (updatedLoginType === "local" && loginType === "remote") {
      const user = await getStorage();
      await syncAccountData(user);
      await chekOfflineServiceInfo(updatedLoginType);
    } else {
      localStorage.removeItem("envOffline");
      setEnvironment(undefined);
    }
  };

  const chekOfflineServiceInfo = async (loginType: string) => {
    try {
      const data = await fetchAPIServiceInfo();

      const apiBaseUrl = await apiHandler();
      const offline = data.apiGatewayBaseUrl + "/api/v1";

      const envOffline = {
        env: offline.includes("dev") ? "uat" : "prod",
        version: data.version,
        loginType,
        apiBaseUrl,
        offline
      };
      setEnvironment(envOffline);

      localStorage.setItem("envOffline", JSON.stringify(envOffline));
      setHasUpdatedOffflineService(true);
    } catch (error: any) {
      if (error?.response?.statusCode === 404) {
        setHasUpdatedOffflineService(false);
      }
    }
  };

  useEffect(() => {
    const loginType: any = localStorage.getItem("loginType");
    if (loginType === "local") {
      chekOfflineServiceInfo(loginType);
    }
  }, []);

  const isRunningLocal = loginType === '"local"' || loginType === "local";

  return (
    <div>
      <Panel className="healthStripPanel">
        <Stack className="healthStripRow">
          <Stack.Item grow={1}>
            <div className="healthStripStatus">
              <div
                className={`healthStripIcon ${isOnline ? "online" : "offline"}`}
              >
                <Icon name={isOnline ? "cloud_done" : "cloud_off"} />
              </div>
              <div>
                <div className="healthStripLabelRow">
                  <span className="healthStripLabel">
                    {isRunningLocal
                      ? `Running Local ${
                          offlineEnvironment?.env
                            ? `(${offlineEnvironment?.env} - v${offlineEnvironment?.version})`
                            : ""
                        }`
                      : "Running Remote"}
                  </span>
                  <span
                    className={`healthStripPill ${isOnline ? "online" : "offline"}`}
                  >
                    {isOnline ? "Connected" : "Offline"}
                  </span>
                </div>
                <div className="healthStripSubtext">
                  {isRunningLocal
                    ? "Requests are served from the local capture service on this device"
                    : "Requests are served from the cloud API · local capture service not active"}
                </div>
              </div>
            </div>
          </Stack.Item>
          <Stack.Item>
            <ButtonToolbar>
              <Button
                text={
                  loginType === "remote" || loginType === '"remote"'
                    ? `Switch Local ${
                        offlineEnvironment?.env
                          ? `(${offlineEnvironment?.env} - v${offlineEnvironment?.version})`
                          : ""
                      }`
                    : "Switch to Remote"
                }
                onClick={switchLocalService}
                appearance="ghost"
                disabled={!hasUpdatedOfflineService}
              />
              <Button
                onClick={() =>
                  openInNewTab(cfg.VITE_OFFLINE_PACKAGE_DOWNLOAD_URL)
                }
                text={isRunningLocal ? "Update Local Service" : "Download Local Service"}
              />
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </Panel>
      {showMore ? (
        <PanelGroup
          defaultActiveKey="1"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
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
