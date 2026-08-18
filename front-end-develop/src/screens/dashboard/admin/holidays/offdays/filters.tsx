import Filters from "@/components/filters";
import Button from "@/components/button";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "@/components/Modal";
import Add from "./add";
import { Stack } from "rsuite";
import useExportData from "@/hooks/useExport";
// import CenterFilter from "@/components/filters/center";

function OffDayFilter({
  fetchData,
  data,
  centerId,
  offdays,
}: {
  fetchData: (e: any) => void;
  data: any[];
  centerId: string;
  offdays: string[];
}) {
  const { translation } = useContext(LanguageContext);
  const [modal, setModal] = useState({
    formModal: false,
  });

  const { exporting, exportData } = useExportData();

  const handleModal = (modal: string, action: boolean) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));
  };

  const formateData = () => {
    return data.map((el: any) => {
      return {
        name: el.name,
        shortName: el.shortName,
        capacity: el.capacity,
        country: el.country,
        province: el?.province,
        district: el?.district,
        sector: el?.sector,
        cell: el?.cell,
        offdays: el?.offdays,
      };
    });
  };

  let filtersList = [
    <Stack.Item>
      {/* <CenterFilter type="offday" fetchData={fetchData} /> */}
    </Stack.Item>,
  ];

  if (centerId && centerId !== "") {
    filtersList.push(<Stack.Item grow={1} />);
    filtersList.push(
      <Stack.Item>
        <Button
          text={translation.export}
          onClick={() =>
            exportData({
              data: formateData(),
              format: "csv",
              filename: "Center Offdays",
            })
          }
          appearance="ghost"
          startIcon="file_save"
          loading={exporting}
        />
      </Stack.Item>,

      <Stack.Item>
        <Button
          text={translation.refresh}
          startIcon="refresh"
          onClick={() => fetchData(centerId)}
          appearance="default"
        />
      </Stack.Item>,
      <Stack.Item>
        <Button
          startIcon="add"
          onClick={() => handleModal("formModal", true)}
        />
      </Stack.Item>
    );
  }

  return (
    <>
      <Filters sections={filtersList} />
      <Modal
        show={modal.formModal}
        title={translation.offday}
        handleClose={() => handleModal("formModal", false)}
      >
        <Add
          handleClose={() => handleModal("formModal", false)}
          fetchData={() => fetchData(centerId)}
          centerId={centerId}
          offdays={offdays}
        />
      </Modal>
    </>
  );
}

export default OffDayFilter;
