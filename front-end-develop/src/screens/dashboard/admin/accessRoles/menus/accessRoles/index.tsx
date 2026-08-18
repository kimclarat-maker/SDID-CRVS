import Button from "@/components/button";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";

import { Table as LibTable, Tag, TagGroup } from "rsuite";
import List from "../../roles/list";

const { Cell } = LibTable;

export const AccessRoles = ({
  rowData,
  dataKey,
  ...props
}: {
  rowData?: any;
  dataKey: string;
}) => {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const { translation } = useContext(LanguageContext);

  useEffect(() => {
    setRoles(rowData[dataKey]);
  }, []);

  return (
    <>
      <Cell {...props}>
        <TagGroup>
          {roles?.slice(0, 3)?.map((el: any, i: number) => (
            <Tag key={i}>{el}</Tag>
          ))}
          {roles?.length > 3 && (
            <Button
              text={"+" + roles.length}
              size="sm"
              endIcon="arrow_drop_down"
              appearance="default"
              onClick={() => setOpen(true)}
              styles={{ marginLeft: ".5rem" }}
            />
          )}
        </TagGroup>
      </Cell>
      <Modal
        show={open}
        title={translation.access_roles}
        handleClose={() => setOpen(false)}
      >
        {/* <List data={roles} /> */}
        <></>
      </Modal>
    </>
  );
};
