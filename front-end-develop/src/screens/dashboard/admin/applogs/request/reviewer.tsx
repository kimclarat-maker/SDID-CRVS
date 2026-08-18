import { useContext, useEffect, useState } from "react";
import { Table as LibTable } from "rsuite";
import { get } from "lodash";
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

function Reviewer({ data }: { data: any }) {
  const { translation } = useContext(LanguageContext);
  const [logs, setLogs] = useState<any>([]);

  useEffect(() => {
    let results = [],
      reviewerIds: any[] = [];
    for (let el of data) {
      if (
        el?.newData &&
        el?.newData?.reviewer &&
        !reviewerIds.includes(el?.newData && el?.newData?.reviewer?.id)
      ) {
        if (el?.data?.method === "startReview") {
          results.push({
            name:
              el?.newData?.reviewer?.first_name +
              " " +
              el?.newData?.reviewer?.last_name,
            reviewStartedAt: el?.newData?.reviewStartedAt,
            reviewCompletedAt: el?.newData?.reviewCompletedAt,
            center: el?.newData?.center,
            status: el?.newData?.status,
            day: el.day,
            type: "INITIAL",
          });
        } else if (el?.newData && el?.newData?.reviewer) {
          results.push({
            name:
              el?.newData?.reviewer?.first_name +
              " " +
              el?.newData?.reviewer?.last_name,
            reviewStartedAt: el?.newData?.reviewStartedAt,
            reviewCompletedAt: el?.newData?.reviewCompletedAt,
            center: el?.newData?.center,
            status: el?.newData?.status,
            day: el.day,
          });
        }
      }

      if (el?.newData && el?.newData?.reviewer?.id) {
        reviewerIds.push(el?.newData?.reviewer?.id);
      }
    }
    setLogs(results);
  }, [data]);

  return (
    <div>
      <Table data={logs}>
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.name}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.review_started_at}
          </HeaderCell>
          <DateCell dataKey="reviewStartedAt" formatTime="lll" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.review_completed_at}
          </HeaderCell>
          <DateCell dataKey="reviewCompletedAt" formatTime="lll" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>
        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="center" />
        </Column>
      </Table>
    </div>
  );
}

export default Reviewer;
