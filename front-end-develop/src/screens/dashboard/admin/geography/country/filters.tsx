import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import Filters from "@/components/filters";
import { Stack } from "rsuite";
import Button from "@/components/button";
import AddCountry from "./add";
import ImportData from "@/components/import";
import { createCountry } from "@/api/geography/countries";
import { defineAccess } from "@/utils/common/permissions";

interface FilterProps {
  fetchData: () => void;
  type: string;
}

function AppCountryFilter({ fetchData }: FilterProps) {
  const { translation } = useContext(LanguageContext);
  const [modal, setModal] = useState({
    countryModal: false,
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
        title={translation.countries}
        sections={[
          <Stack.Item grow={1}></Stack.Item>,
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
                onClick={() => handleModal("countryModal", true)}
                startIcon="add"
              />
            )}
          </Stack.Item>,
        ]}
      /> */}
      <Modal
        show={modal.countryModal}
        title={translation.country}
        handleClose={() => handleModal("countryModal", false)}
      >
        <AddCountry
          fetchData={fetchData}
          handleClose={() => handleModal("countryModal", false)}
        />
      </Modal>

      <Modal
        show={modal.importModal}
        title={translation.import}
        handleClose={() => handleModal("importModal", false)}
      >
        <ImportData
          handleClose={() => handleModal("importModal", false)}
          saveData={createCountry}
          refreshData={fetchData}
          type="country"
        />
      </Modal>
    </>
  );
}

export default AppCountryFilter;
