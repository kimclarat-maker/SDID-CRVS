import { Table as LibTable } from "rsuite";
import Button from "@/components/button";

const { Cell } = LibTable;

const ButtonCell = ({
  onClick,
  rowData,
  dataKey,
  icon,
  buttonText,
  appearance,
  selectedId,
  loading,
  ...props
}: {
  onClick: (value: any, type?: string) => void;
  rowData?: any;
  dataKey: string;
  icon?: string;
  buttonText?: string;
  appearance?: "link" | "subtle" | "default" | "primary" | "ghost" | undefined;
  selectedId?: string;
  loading?: boolean;
}) => {
  return (
    <Cell {...props}>
      <Button
        styles={{ marginTop: -5 }}
        startIcon={icon || "visibility"}
        appearance={appearance || "subtle"}
        size="sm"
        onClick={() => onClick(rowData)}
        text={buttonText || ""}
        loading={loading}
      />
    </Cell>
  );
};

export default ButtonCell;
