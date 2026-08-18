import React from "react";
import { IconButton, Table as LibTable } from "rsuite";
import Icon from "../icon";

const { Cell } = LibTable;

interface Props {
  rowKey?: string;
  expandedRowKeys: string[];
  onChange: (rowData: any) => void;
  [key: string]: any;
}

const ExpandCell: React.FC<Props> = ({
  rowData,
  rowKey = "id",
  expandedRowKeys,
  onChange,
  ...props
}) => {
  const rowId = rowData?.["id"];
  return (
    <Cell {...props} style={{ padding: 5 }}>
      <IconButton
        appearance="subtle"
        onClick={() => {
          onChange(rowData);
        }}
        icon={
          expandedRowKeys.some((key) => key === rowId) ? (
            <Icon name="indeterminate_check_box" />
          ) : (
            <Icon name="add_box" />
          )
        }
      />
    </Cell>
  );
};

export default ExpandCell;
