import React, { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { Table as LibTable, List, Stack } from "rsuite";
import CardCount from "@/components/card/count";
import Modal from "@/components/Modal";
import capitalizeText from "@/utils/common/capitalizeText";
import Table from "@/components/table";
import { get } from "lodash";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {props.dataKey === "hour" ? `${value}:00` : value}
    </Cell>
  );
};

interface Props {
  loading: boolean;
  aggregateData: any;
}

const Counts: React.FC<Props> = ({ loading, aggregateData }) => {
  const { translation } = useContext(LanguageContext);
  const [open, setModal] = useState(false);
  const [type, setType] = useState("");
  const [data, setData] = useState([]);

  const renderList = () => {
    if (Array.isArray(data)) {
      return (
        <Table data={data}>
          <Column fullText sortable flexGrow={1} resizable>
            <HeaderCell className="textBold">{translation?.time}</HeaderCell>
            <CompactCell dataKey="hour" />
          </Column>

          <Column fullText sortable flexGrow={1} resizable>
            <HeaderCell className="textBold">{translation.total}</HeaderCell>
            <CompactCell dataKey="enrollment" />
          </Column>
        </Table>
      );
    }
    return (
      <List>
        {Object.keys(data)?.map((k: any, i) => {
          return (
            <List.Item key={i}>
              <Stack>
                <Stack.Item grow={1}>{k?.toUpperCase()}</Stack.Item>
                <Stack.Item>{data[k]}</Stack.Item>
              </Stack>
            </List.Item>
          );
        })}
      </List>
    );
  };

  return (
    <div className="row">
      <div className="col-4">
        <CardCount
          name={translation.total_enrollments}
          count={aggregateData?.hourly_count || 0}
          color="var(--color-primary-500)"
          loading={loading}
          onClick={() => {
            setModal(true);
            setType("hourly_breakdown");
            setData(aggregateData?.hourly_breakdown);
          }}
        />
      </div>
      <div className="col-4">
        <CardCount
          name={translation.hourly_covered}
          count={aggregateData?.hours_included || 0}
          color="var(--status-success)"
          loading={loading}
          onClick={() => {
            setModal(true);
            setType("hourly_breakdown");
            setData(aggregateData?.hourly_breakdown);
          }}
        />
      </div>
      <div className="col-4">
        <CardCount
          name={translation.total_districts}
          count={
            Object.keys(aggregateData?.district_aggregates || {}).filter(
              (el) => el !== "dgie" && el !== "other" && el !== "irembo"
            ).length || 0
          }
          color="var(--color-accent-600)"
          loading={loading}
          onClick={() => {
            setModal(true);
            setType("total districts");
            setData(aggregateData?.district_aggregates);
          }}
        />
      </div>
      <Modal
        show={open}
        handleClose={() => setModal(false)}
        title={capitalizeText(type?.replace("_", " "))}
      >
        <div className="card-body rs-modal-body">{renderList()}</div>
      </Modal>
    </div>
  );
};

export default Counts;
