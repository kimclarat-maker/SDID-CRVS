import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { get } from "lodash";
import ConcatNameCell from "@/components/table/concatNameCell";

const { Column, HeaderCell, Cell } = LibTable;

interface DataItemProps {
  cell: string;
  district: string;
  sector: string;
  village: string;
  first_name: string;
  last_name: string;
}

interface ListProps {
  data: DataItemProps[];
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function OperatorList({ data }: ListProps) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <Table data={data}>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.first_name}</HeaderCell>
          <ConcatNameCell dataKey={["first_name", "last_name"]} />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.id_number}</HeaderCell>
          <CompactCell dataKey="operator_id" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.total}</HeaderCell>
          <CompactCell dataKey="count" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.district}</HeaderCell>
          <CompactCell dataKey="district" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.sector}</HeaderCell>
          <CompactCell dataKey="sector" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.cell}</HeaderCell>
          <CompactCell dataKey="cell" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.village}</HeaderCell>
          <CompactCell dataKey="village" />
        </Column>
      </Table>
    </>
  );
}

export default OperatorList;
