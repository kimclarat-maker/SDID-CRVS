import moment from "moment";
import React from "react";
import { Table as LibTable, Text } from "rsuite";

const { Cell } = LibTable;

interface StatusCellProps {
  rowData?: any;
  dataKey: string;
  formatTime?: string;
}

export const DateCell: React.FC<StatusCellProps> = ({
  rowData,
  dataKey,
  formatTime = "ll",
  ...props
}) => {
  return (
    <Cell {...props} style={{ padding: 8 }}>
      <div style={{ marginTop: 5 }}>
        <Text>
          {rowData[dataKey] && rowData[dataKey] !== ""
            ? moment(rowData[dataKey]).format(formatTime)
            : ""}
        </Text>
      </div>
    </Cell>
  );
};
