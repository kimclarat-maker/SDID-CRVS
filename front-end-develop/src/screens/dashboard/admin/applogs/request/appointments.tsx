import { useContext, useEffect, useState } from "react";
import { Table as LibTable, Text } from "rsuite";
import { useFetchByRequestLogs } from "@/hooks/useFetchByRequestLogs";
import moment from "moment";
import { get } from "lodash";
import { dataPreEnrollment } from "@/constants/dummy/pre-enrollment";
import { LanguageContext } from "@/context/LanguageContext";
import Table from "@/components/table";
import { DateCell } from "@/components/table/date";
import { StatusCell } from "@/components/table/status";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function Appointments({ data }: { data: any }) {
  const { translation } = useContext(LanguageContext);
  const [logs, setLogs] = useState<any>([]);

  useEffect(() => {
    let results = [];
    for (let el of data) {
      if (el?.data?.method === "addAppointment") {
        results.push({
          type: "NEW",
          appointmentNo: el?.newData?.appointmentNo,
          appointmentDate: el?.newData?.appointmentDate,
          phoneNumber: el?.newData?.phoneNumber,
          requestNo: el?.newData?.requestNo,
          status: el?.newData?.status,
        });
      }

      if (el?.data?.method === "updateAppointment" && el.newData) {
        results.push({
          type: "RESCHEDULE",
          appointmentNo: el?.newData?.appointmentNo,
          phoneNumber: el?.newData?.phoneNumber,
          requestNo: el?.newData?.requestNo,
          status: el?.newData?.status,
          center: el?.newData?.center?.name,
          postedDate: el?.postedDate,
          appointmentDate:
            el?.newData?.appointmentDate +
            " " +
            el?.newData?.timeSlot?.name +
            " - " +
            el?.newData?.timeSlot?.nameEndTime,
        });
      }
    }
    setLogs(results);
  }, [data]);

  return (
    <div>
      <Table data={logs}>
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">
            {translation.request_number}
          </HeaderCell>
          <CompactCell dataKey="requestNo" />
        </Column>
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <CompactCell dataKey="type" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.appointment_number}
          </HeaderCell>
          <CompactCell dataKey="appointmentNo" />
        </Column>

        <Column flexGrow={1} fullText resizable width={300}>
          <HeaderCell className="textBold">
            {translation.appointment_date}
          </HeaderCell>
          <CompactCell dataKey="appointmentDate" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="center" />
        </Column>
        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.posted_date}
          </HeaderCell>
          <DateCell dataKey="postedDate" formatTime="lll" />
        </Column>
      </Table>
    </div>
  );
}

export default Appointments;
