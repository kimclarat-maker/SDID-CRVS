import { Table as LibTable } from "rsuite";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Table from "@/components/table";
import { useNavigate } from "react-router-dom";
import toastMessage from "@/utils/common/toastMessage";
import { convertObjectIntoUrlParams } from "@/utils/common/convertObjectIntoUrlParams";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

const ChartTableView = ({
  data,
  loading,
  status,
  statuses,
}: {
  data: any;
  loading?: boolean;
  status?: string;
  statuses?: string[];
}) => {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  const formate = data.filter((el: any) => el.center !== "Unknown Center");

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <Table data={formate} loading={loading}>
        {formate.length > 0 &&
          formate[0] &&
          Object.keys(formate[0]).map((el, i) => {
            if (
              el === "startDate" ||
              el === "endDate" ||
              el === "centerId" ||
              el === "gender"
            )
              return;
            return (
              <>
                <Column flexGrow={1} fullText resizable minWidth={200} key={i}>
                  <HeaderCell className="textBold">
                    {translation[el]}
                  </HeaderCell>
                  <CompactCell dataKey={el} />
                </Column>
              </>
            );
          })}

        <Column width={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              let body: any = {
                startDate: rowData.startDate,
                endDate: rowData.endDate,
                status,
                gender: rowData.gender,
                statuses: rowData.statuses,
              };

              if (rowData.centerId) {
                body.center = rowData.centerId;
              }

              if (!status && statuses) {
                body.statuses = statuses;
              }
              const filters = convertObjectIntoUrlParams(body);

              if (rowData.startDate) {
                navigate(`/dashboard/admin/requests-query?${filters}`);
                return;
              }
              toastMessage("error", translation.no_data);
            }}
          />
        </Column>
      </Table>
    </div>
  );
};

export default ChartTableView;
