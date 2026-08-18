import Button from "@/components/button";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { ReactNode, useContext, useEffect, useState } from "react";

import { Table as LibTable, Tag, TagGroup } from "rsuite";

const { Cell } = LibTable;

export const ArrayCell = ({
  rowData,
  dataKey,
  children,
  title,
  fieldName,
  ...props
}: {
  rowData?: any;
  dataKey: string;
  title: string;
  children: ReactNode;
  fieldName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(rowData[dataKey]);
  }, [rowData]);

  return (
    <>
      <Cell {...props}>
        <TagGroup>
          {data?.slice(0, 3)?.map((el: any, i: number) => (
            <Tag key={i}>
              {fieldName && typeof fieldName === "string"
                ? el[fieldName]
                : Array.isArray(el)
                ? el[0].value
                : typeof el === "object"
                ? JSON.stringify(el)
                : el}
            </Tag>
          ))}
          {data?.length > 3 && (
            <Button
              text={"+" + data.length}
              size="sm"
              endIcon="arrow_drop_down"
              appearance="default"
              onClick={() => setOpen(true)}
              styles={{ marginLeft: ".5rem" }}
            />
          )}
        </TagGroup>
      </Cell>
      <Modal show={open} title={title} handleClose={() => setOpen(false)}>
        {children}
      </Modal>
    </>
  );
};
