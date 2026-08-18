import Filters from "@/components/filters";
import Button from "@/components/button";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "@/components/Modal";
import AddMenu from "../add/menus/add";
import { Stack } from "rsuite";
interface FilterProps {
  fetchData: () => void;
}

function MenuFilters({ fetchData }: FilterProps) {
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
    <>
      {/* <Filters
        title={translation.menus}
        sections={[
          <Stack.Item grow={1} />,
          <Stack.Item></Stack.Item>,
          <Stack.Item>
            <Button
              text={translation.add}
              onClick={() => handleModal("addModal", true)}
              startIcon="add"
              size="sm"
            />
          </Stack.Item>,
        ]}
      /> */}
      <Modal
        show={modal.addModal}
        handleClose={() => handleModal("addModal", false)}
        title={translation.menu}
      >
        <AddMenu
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
        />
      </Modal>
    </>
  );
}

export default MenuFilters;
