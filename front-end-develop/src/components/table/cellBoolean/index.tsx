import React from "react";
import { Table as LibTable, Checkbox } from "rsuite";

const { Cell } = LibTable;

interface BooleanCellProps {
  rowData?: any;
  dataKey: string;
}

export const BooleanCell: React.FC<BooleanCellProps> = ({
  rowData,
  dataKey,
  ...props
}) => {
  return (
    <Cell {...props} style={{ padding: 8 }}>
      <div>
        <Checkbox checked={rowData[dataKey]} />
      </div>
    </Cell>
  );
};
