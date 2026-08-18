import Button from "@/components/button";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "@/components/Modal";
import { Stack } from "rsuite";
import Add from "./add";
import Filters from "@/components/filters";

interface FilterProps {
  fetchData: () => void;
}

function MessageFilters({ fetchData }: FilterProps) {
  const { translation } = useContext(LanguageContext);
  const [modal, setModal] = useState({
    addModal: false,
  });

  const handleModal = (modal: string, action: boolean) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));
  };

  return (
    <Stack wrap style={{ marginBlock: "1rem" }}>
      {/* <Filters title={translation.sms_template} /> */}
      <Stack.Item grow={1} />
      <Stack.Item>
        <Button
          text={translation.add}
          onClick={() => handleModal("addModal", true)}
          startIcon="add"
        />
      </Stack.Item>

      <Modal
        show={modal.addModal}
        title={translation.sms_template}
        handleClose={() => handleModal("addModal", false)}
      >
        <Add
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
        />
      </Modal>
    </Stack>
  );
}

export default MessageFilters;
