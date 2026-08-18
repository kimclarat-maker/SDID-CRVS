import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: any[];
  loading: boolean;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function SupportingDocuments({ data, loading }: ListProps) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <Table data={data} loading={loading}>
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.name}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => alert("Connected soon")}
          />
        </Column>
      </Table>
    </>
  );
}

export default SupportingDocuments;
