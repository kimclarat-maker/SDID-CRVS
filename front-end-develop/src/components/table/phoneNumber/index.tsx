import moment from "moment";
import React from "react";
import { Table as LibTable, Tag, TagGroup, Text } from "rsuite";

const { Cell } = LibTable;

interface StatusCellProps {
  rowData?: any;
  dataKey: string;
}

export const PhoneNumberCell: React.FC<StatusCellProps> = ({
  rowData,
  dataKey,
  ...props
}) => {
  return (
    <Cell {...props}>
      <div>
        {rowData[dataKey] && typeof rowData[dataKey] === "string" && (
          <Text>{rowData[dataKey]}</Text>
        )}

        {rowData[dataKey] && Array.isArray(rowData[dataKey]) && (
          <TagGroup>
            {rowData[dataKey].map((el, i) => (
              <Tag key={i}>{el}</Tag>
            ))}
            <Tag></Tag>
          </TagGroup>
        )}
      </div>
    </Cell>
  );
};
