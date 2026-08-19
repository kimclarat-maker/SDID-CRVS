import { useContext, useState } from "react";
import Modal from "@/components/Modal";
import Add from "./add";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import CustomTabs from "@/components/tabs";
import DataCenters from "./data";
import PageHeader from "@/components/pageHeader";

function Centers() {
  const { translation } = useContext(LanguageContext);
  const [filters, setFilters] = useState();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={translation.centers}
        action={
          <Button
            text={translation.add}
            startIcon="add"
            onClick={() => setOpen(true)}
          />
        }
      />

      <CustomTabs
        options={[
          {
            title: translation.active,
            data: <DataCenters status="active" />,
          },
          {
            title: translation.inactive,
            data: <DataCenters status="inactive" />,
          },
        ]}
      />
      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.account}
      >
        <Add handleClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export default Centers;
