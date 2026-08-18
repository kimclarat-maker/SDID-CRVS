import React from "react";
import { Table as LibTable, Text } from "rsuite";

const { Cell } = LibTable;

interface ImageCellProps {
  name: string | string[];
  rowData?: any;
  dataKey: string;
}

export const ImageCell: React.FC<ImageCellProps> = ({
  rowData,
  name,
  dataKey,
  ...props
}) => {
  return (
    <Cell {...props} style={{ padding: 8 }}>
      <div
        style={{
          width: 30,
          height: 30,
          background: "var(--rs-gray-200)",
          borderRadius: 50,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {rowData[dataKey] && rowData[dataKey] !== "" ? (
          <img
            src={rowData[dataKey]}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          Array.isArray(name) &&
          name.map((el, i) => {
            return (
              <div key={i}>
                <Text className="textBold" style={{ fontSize: 12 }}>
                  {rowData[el]?.charAt(0)}
                </Text>
              </div>
            );
          })
        )}
      </div>
    </Cell>
  );
};
