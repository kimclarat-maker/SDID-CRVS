import React from "react";
import { Link } from "react-router-dom";
import { Table as LibTable, Tag, TagGroup, Text } from "rsuite";

const { Cell } = LibTable;

interface LinkCellProps {
  rowData?: any;
  dataKey: string;
  onClick: (e: any) => void;
}

export const LinkCell: React.FC<LinkCellProps> = ({
  rowData,
  dataKey,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default anchor behavior
    onClick(rowData);
  };
  return (
    <Cell {...props}>
      <Link to="#" onClick={handleClick}>
        {rowData[dataKey]}
      </Link>
    </Cell>
  );
};
