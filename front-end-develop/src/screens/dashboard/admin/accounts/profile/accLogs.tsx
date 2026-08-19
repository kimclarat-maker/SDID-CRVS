import Button from "@/components/button";
import Card from "@/components/card";
import Empty from "@/components/empty";
import Loading from "@/components/loader";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchAccountIdentityLogs } from "@/hooks/useFetchAccountIdentityLogs";
import capitalizeText from "@/utils/common/capitalizeText";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import {
  List,
  Panel,
  PanelGroup,
  Stack,
  Tag,
  TagGroup,
  Text,
  Timeline,
} from "rsuite";
import StackItem from "rsuite/esm/Stack/StackItem";

function Logs({ idNumber, fromMenu }: { idNumber: string; fromMenu: boolean }) {
  const { translation } = useContext(LanguageContext);
  const [open, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>({});
  const { loadingLogs, logs, fetchAccountIDLogsData } =
    useFetchAccountIdentityLogs();

  useEffect(() => {
    fetchAccountIDLogsData({
      fromDay: moment().subtract("d", 365).format("YYYY-MM-DD"),
      toDay: moment().format("YYYY-MM-DD"),
      identityNumber: idNumber,
      offset: 0,
      limit: 50,
      // "data.method": "string";
      // module: string;
      // accountAction: "string";
    });
  }, []);

  const renderItem = (data: any) => {
    return (
      <>
        <StackItem grow={1}>
          <Stack spacing={16}>
            <StackItem grow={1}>
              <TagGroup>
                <Tag className={`${data.action}`}>
                  {capitalizeText(data.action)}
                </Tag>
              </TagGroup>
              <Text style={{ fontSize: 12, marginBottom: "1rem" }}>
                {data.date}
              </Text>
            </StackItem>
            <StackItem>
              <div>
                <Button
                  appearance="default"
                  startIcon="visibility"
                  text={translation.view}
                  onClick={() => {
                    setOpenModal(true);
                    setSelectedData(data);
                  }}
                  size="sm"
                />
              </div>
            </StackItem>
          </Stack>
          <List>
            <List.Item>
              <Stack spacing={16}>
                <StackItem grow={1}>
                  <Text style={{ fontSize: 14 }}>{translation.center}:</Text>
                </StackItem>
                <StackItem grow={1}>
                  <Text style={{ fontSize: 14 }} className="textBold">
                    {data.center}
                  </Text>
                </StackItem>
              </Stack>
            </List.Item>
            <List.Item>
              <Stack spacing={16}>
                <StackItem grow={1}>
                  <Text style={{ fontSize: 14 }}>
                    {translation.request_number}:
                  </Text>
                </StackItem>
                <StackItem grow={1}>
                  <Text style={{ fontSize: 14 }} className="textBold">
                    {data.requestNo}
                  </Text>
                </StackItem>
              </Stack>
            </List.Item>
          </List>
        </StackItem>
      </>
    );
  };

  if (loadingLogs)
    return (
      <div
        style={{
          position: "relative",
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loading isFullScreen />
      </div>
    );
  if (logs.length === 0 && fromMenu)
    return <Empty title={translation.no_data_found} />;
  return (
    <PanelGroup accordion>
      <Panel header={translation.logs} defaultExpanded>
        <Card>
          <div style={{ maxHeight: "100vh", overflowY: "auto" }}>
            <Timeline>
              {logs.map((el, i) => {
                return (
                  <Timeline.Item key={i}>
                    <Stack className="mb-2" spacing={16}>
                      {renderItem({
                        ...el,
                        action: el.module,
                        date: moment(el.createdAt).format("lll"),
                        requestNo: el?.newData?.requestNo,
                        center: el?.data?.center,
                      })}
                    </Stack>
                    {el.data.modifiedBy && (
                      <Text
                        style={{ fontSize: 12, opacity: 0.7 }}
                        className="mb-2"
                      >
                        {translation.modified_by}:{" "}
                        {el.data.modifiedBy.firstName}{" "}
                        {el.data.modifiedBy.lastName}
                      </Text>
                    )}

                    <div>
                      {el.action === "transfer" && (
                        <div>
                          {el?.oldData?.center && (
                            <div
                              className="card mb-2"
                              style={{ backgroundColor: "var(--rs-gray-100)" }}
                            >
                              <div className="card-body">
                                <Text style={{ fontSize: 14 }}>
                                  {el?.oldData?.center}
                                </Text>
                              </div>
                            </div>
                          )}
                          <div
                            className="card"
                            style={{ backgroundColor: "var(--rs-primary-100)" }}
                          >
                            <div className="card-body">
                              <Text style={{ fontSize: 14 }}>
                                {el?.newData?.center}
                              </Text>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>
        </Card>
        <Modal
          size="lg"
          show={open}
          handleClose={() => setOpenModal(false)}
          title={translation.logs}
        >
          {selectedData && selectedData?.data?.module === "SMSService" ? (
            <Text>{selectedData.data.message}</Text>
          ) : selectedData?.data?.module === "MailService" ? (
            <div
              dangerouslySetInnerHTML={{
                __html: selectedData.data.html.replace(/body\{[^\}]+\}/, ""),
              }}
            />
          ) : (
            <div></div>
          )}
        </Modal>
      </Panel>
    </PanelGroup>
  );
}

export default Logs;
