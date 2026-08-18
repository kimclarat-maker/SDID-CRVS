import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { Stack } from "rsuite";
import Filters from "@/components/filters";
import Button from "@/components/button";
import Modal from "@/components/Modal";
import AddSMS from "./add";

function SMSFilters({ fetchData }: { fetchData: () => void }) {
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
      {/* <Filters title={translation.sms_configuration} /> */}
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
        title={translation.sms_confuguration}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddSMS
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
        />
      </Modal>
    </Stack>
  );
}

export default SMSFilters;
