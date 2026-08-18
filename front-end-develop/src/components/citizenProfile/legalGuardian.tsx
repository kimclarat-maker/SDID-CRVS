import Table from "@/components/table";
import { Table as LibTable, List as LibList, Stack } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";

import { get } from "lodash";

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

function LegalGuardian({ data, loading }: ListProps) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <Table data={data} loading={loading}>
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.id_number}</HeaderCell>
          <CompactCell dataKey="idNumber" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>
      </Table>
    </>
  );
}

export default LegalGuardian;
