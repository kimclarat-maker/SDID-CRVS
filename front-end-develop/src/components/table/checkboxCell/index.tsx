import capitalizeText from "@/utils/common/capitalizeText";
import React, { useEffect, useState } from "react";
import { Checkbox, Table as LibTable, Tag, TagGroup } from "rsuite";

const { Cell } = LibTable;

interface CheckboxCellProps {
  rowData?: any;
  dataKey: string;
  handleCheck?: () => void;
  checked?: boolean;
}

export const CheckboxCell: React.FC<CheckboxCellProps> = ({
  rowData,
  dataKey,
  checked,
  handleCheck,
  ...props
}) => {
  return (
    <Cell {...props} style={{ padding: 8 }}>
      <div>
        <Checkbox onChange={handleCheck} checked={checked || rowData[dataKey]}>
          {rowData[dataKey]}
        </Checkbox>
      </div>
    </Cell>
  );
};
