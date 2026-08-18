import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import Filters from "@/components/filters";
import { Stack } from "rsuite";
import Button from "@/components/button";
import ImportData from "@/components/import";
import AddProvince from "./add";
import { createProvince } from "@/api/geography/province";
import { defineAccess } from "@/utils/common/permissions";

interface FilterProps {
  fetchData: () => void;
}

function Filter({ fetchData }: FilterProps) {
  const { translation } = useContext(LanguageContext);
  const [modal, setModal] = useState({
    addModal: false,
    importModal: false,
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
        title={translation.provinces}
        sections={[
          <Stack.Item grow={1} />,
          <Stack.Item></Stack.Item>,
          <Stack.Item>
            <Button
              text={translation.import}
              onClick={() => handleModal("importModal", true)}
              appearance="ghost"
              startIcon="place_item"
            />
          </Stack.Item>,
          <Stack.Item>
            {defineAccess({
              method: "POST",
              module: "geography",
            }) && (
              <Button
                text={translation.add}
                onClick={() => handleModal("addModal", true)}
                startIcon="add"
              />
            )}
          </Stack.Item>,
        ]}
      /> */}
      <Modal
        show={modal.addModal}
        title=""
        handleClose={() => handleModal("addModal", false)}
      >
        <AddProvince
          fetchData={fetchData}
          handleClose={() => handleModal("addModal", false)}
        />
      </Modal>

      <Modal
        show={modal.importModal}
        title={translation.import}
        handleClose={() => handleModal("importModal", false)}
      >
        <ImportData
          handleClose={() => handleModal("importModal", false)}
          saveData={createProvince}
          refreshData={fetchData}
          type="province"
        />
      </Modal>
    </>
  );
}

export default Filter;
