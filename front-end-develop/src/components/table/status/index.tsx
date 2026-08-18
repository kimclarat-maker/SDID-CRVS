import { appStatus } from "@/constants/appStatuses";
import { LanguageContext } from "@/context/LanguageContext";
import capitalizeText from "@/utils/common/capitalizeText";
import React, { useContext } from "react";
import { Table as LibTable } from "rsuite";
import { StatusBadge } from "./StatusBadge";

const { Cell } = LibTable;

interface StatusCellProps {
  rowData?: any;
  dataKey: string;
}

export const StatusCell: React.FC<StatusCellProps> = ({
  rowData,
  dataKey,
  ...props
}) => {
  const { translation } = useContext(LanguageContext);
  const rawStatus = capitalizeText(rowData?.[dataKey]);
  const label = appStatus(translation.default, rawStatus)?.status || rawStatus;

  return (
    <Cell {...props} style={{ padding: 8 }}>
      <div style={{ marginTop: 5 }}>
        <StatusBadge label={label} status={rawStatus} />
      </div>
    </Cell>
  );
};
