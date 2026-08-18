import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ImageCell } from "@/components/table/image";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import ConcatNameCell from "@/components/table/concatNameCell";
import { Prenrollment } from "@/types/Prenrollment";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: Prenrollment[];
  setData: (data: Prenrollment) => void;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value || ""}
    </Cell>
  );
};

function List({ data, setData }: ListProps) {
  const { translation } = useContext(LanguageContext);

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <Table data={data}>
        <Column width={60} align="center">
          <HeaderCell className="textBold">{translation.photo}</HeaderCell>
          <ImageCell dataKey="selfie" name={["firstName", "lastName"]} />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.surname}</HeaderCell>
          <ConcatNameCell dataKey={["firstName", "lastName"]} />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.father_name}
          </HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">
            {translation.mother_name}
          </HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.address}</HeaderCell>
          <ConcatNameCell
            dataKey={[
              "country",
              "province",
              "district",
              "sector",
              "cell",
              "village",
            ]}
          />
        </Column>

        <Column flexGrow={1} minWidth={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => setData(rowData)}
            appearance="primary"
            buttonText={translation.select}
          />
        </Column>
      </Table>
    </div>
  );
}

export default List;
