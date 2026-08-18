import Button from "@/components/button";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "@/components/Modal";
import { Stack } from "rsuite";
import Add from "./add";
import Filters from "@/components/filters";
import { UploadFile } from "@/components/import/upload";

interface FilterProps {
  fetchData: () => void;
}

function HolidaysFilters({ fetchData }: FilterProps) {
  const { translation } = useContext(LanguageContext);
  const [modal, setModal] = useState({
    addModal: false,
    uploadModal: false,
  });

  const handleModal = (modal: string, action: boolean) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));
  };

  return (
    <Stack wrap spacing={16} style={{ marginBlock: "1rem" }}>
      <Filters title={translation.holidays} />
      <Stack.Item grow={1} />
      <Stack.Item>
        <Button
          text={translation.upload_csv}
          onClick={() => handleModal("uploadModal", true)}
          startIcon="add"
          appearance="ghost"
        />
      </Stack.Item>
      <Stack.Item>
        <Button
          text={translation.add}
          onClick={() => handleModal("addModal", true)}
          startIcon="add"
        />
      </Stack.Item>

      <Modal
        show={modal.addModal}
        title=""
        handleClose={() => handleModal("addModal", false)}
      >
        <Add
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
        />
      </Modal>

      <Modal
        show={modal.uploadModal}
        title=""
        handleClose={() => handleModal("uploadModal", false)}
      >
        <UploadFile
          fileApiUrl={`/configuration/holidays/upload`}
          handleClose={() => handleModal("uploadModal", false)}
          accept=".csv"
          refreshData={fetchData}
        />
      </Modal>
    </Stack>
  );
}

export default HolidaysFilters;
