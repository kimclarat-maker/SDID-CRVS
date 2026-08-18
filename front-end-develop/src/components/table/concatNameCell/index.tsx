import { Table as LibTable } from "rsuite";
import { get } from "lodash";

const { Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const { rowData, dataKey } = props;

  // If dataKey is an array, concatenate the values of the keys
  const value = dataKey
    .map((key: string) => get(rowData, key, "")) // ["Umujyi wa Kigali", "Nyarugenge", "Gitega", "Akabeza", ""]
    .filter((val: string) => val) // ["Umujyi wa Kigali", "Nyarugenge", "Gitega", "Akabeza"]
    .join(" - ");

  return <Cell {...props}>{value}</Cell>;
};

const ConcatNameCell = ({
  rowData,
  dataKey,
  ...props
}: {
  rowData?: any;
  dataKey: string[];
}) => {
  return (
    <CompactCell
      rowData={rowData} // Pass rowData to CompactCell
      dataKey={dataKey}
      {...props}
    />
  );
};

export default ConcatNameCell;
