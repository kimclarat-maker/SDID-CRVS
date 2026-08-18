import { useContext, useEffect, useState } from "react";
import { Table as LibTable, Panel, PanelGroup, Text } from "rsuite";
import { get } from "lodash";
import { LanguageContext } from "@/context/LanguageContext";
import Table from "@/components/table";
import { DateCell } from "@/components/table/date";
import { StatusCell } from "@/components/table/status";
import { LinkCell } from "@/components/table/linkCell";
import Modal from "@/components/Modal";
import InfoCard from "@/components/infoCard";
import ButtonCell from "@/components/table/button/buttonCell";
import { useNavigate } from "react-router-dom";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function AddPrenrollment({ data }: { data: any }) {
  const { translation } = useContext(LanguageContext);
  const [logs, setLogs] = useState<any>([]);
  const [open, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    let results = [];

    for (let el of data) {
      if (el?.newData?.identifier && el?.newData?.documentType) {
        let body: any = {
          applicantCategory: el?.newData?.applicantCategory,
          digitalAmbassadorNid: el?.newData?.digitalAmbassadorNid,
          documentType: el?.newData?.documentType,
          identifier: el?.newData?.identifier,
          ipAddress: el?.newData?.ipAddress,
          language:
            el?.newData?.language === "rw"
              ? "Kinyarwanda"
              : el?.newData?.language === "fr"
              ? "French"
              : "English",
          detectSelfieAttempts: el?.newData?.detectSelfieAttempts,
          createdAt: el?.postedDate,
          status: el?.newData?.status,
          approvedAt: el?.newData?.approvedAt,
          rejectedAt: el?.newData?.rejectedAt,
          data: el,
          preHistoricalInfo: el?.newData?.preHistoricalInfo,
        };
        if (el?.newData?.status === "PENDING_REVIEW") {
          body.operator =
            el?.newData?.digitalAmbassador?.first_name +
            " " +
            el?.newData?.digitalAmbassador?.last_name;
          body.operatorNid = el?.newData?.digitalAmbassador?.id_number;
        } else {
          body.operatorNid = el?.newData?.reviewer?.id_number || "";
          body.operator = el?.newData?.reviewer
            ? el?.newData?.reviewer?.first_name +
              " " +
              el?.newData?.reviewer?.last_name
            : "";
        }
        results.push(body);
      }
    }

    setLogs(results);
  }, [data]);

  console.log("logs", logs);

  return (
    <>
      <div>
        <Table data={logs}>
          <Column fullText flexGrow={1} resizable>
            <HeaderCell className="textBold">
              {translation.identifier}
            </HeaderCell>
            <LinkCell
              dataKey="identifier"
              onClick={(data) => {
                setSelectedData(data.data);
                setOpenModal(true);
              }}
            />
          </Column>

          <Column flexGrow={1} fullText resizable>
            <HeaderCell className="textBold">Applicant category</HeaderCell>
            <CompactCell dataKey="applicantCategory" />
          </Column>

          <Column flexGrow={1} fullText resizable>
            <HeaderCell className="textBold">Document type</HeaderCell>
            <CompactCell dataKey="documentType" />
          </Column>

          <Column flexGrow={1} fullText resizable>
            <HeaderCell className="textBold">IP address</HeaderCell>
            <StatusCell dataKey="ipAddress" />
          </Column>
          <Column flexGrow={1} fullText resizable>
            <HeaderCell className="textBold">Operator NID</HeaderCell>
            <LinkCell
              onClick={(rowData) =>
                navigate(
                  `/dashboard/admin/citizen/id-profile/${rowData.operatorNid}`
                )
              }
              dataKey="operatorNid"
            />
          </Column>
          <Column flexGrow={1} fullText resizable>
            <HeaderCell className="textBold">Operator</HeaderCell>
            <CompactCell dataKey="operator" />
          </Column>
          <Column flexGrow={1} fullText resizable width={200}>
            <HeaderCell className="textBold">Status</HeaderCell>
            <StatusCell dataKey="status" />
          </Column>
          <Column flexGrow={1} fullText resizable width={200}>
            <HeaderCell className="textBold">Created date</HeaderCell>
            <DateCell dataKey="createdAt" formatTime="lll" />
          </Column>
          <Column width={80}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ButtonCell
              dataKey="_id"
              onClick={(rowData: any) => {
                setOpenModal(true);
                setSelectedData(rowData);
              }}
              appearance="primary"
            />
          </Column>
        </Table>
      </div>
      {console.log(selectedData)}
      <Modal
        show={open}
        handleClose={() => setOpenModal(false)}
        title={selectedData.identifier}
        size="lg"
      >
        <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <PanelGroup accordion>
            <Panel accessKey="newData" header={<Text>New Data</Text>}>
              <InfoCard
                {...selectedData?.data?.newData}
                size={12}
                isFromLogs
                historicalData={
                  selectedData?.preHistoricalInfo
                    ? JSON.parse(selectedData?.preHistoricalInfo)?.nida || {}
                    : {}
                }
              />
            </Panel>
            {selectedData?.data?.oldData && (
              <Panel accessKey="oldData" header={<Text>Old Data</Text>}>
                <InfoCard
                  {...selectedData?.data?.oldData}
                  size={12}
                  isFromLogs
                  historicalData={
                    selectedData?.preHistoricalInfo
                      ? JSON.parse(selectedData?.preHistoricalInfo)?.nida || {}
                      : {}
                  }
                />
              </Panel>
            )}
          </PanelGroup>
        </div>
      </Modal>
    </>
  );
}

export default AddPrenrollment;
