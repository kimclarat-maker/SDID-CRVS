import List from "./list";
import { useContext, useEffect, useState } from "react";
import { FilterContext } from "@/context/FilterContext";
import AppFilters from "./filters";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchSchedulesTransferred } from "@/hooks/useFetchSchedulesTransferred";
import { ButtonToolbar } from "rsuite";
import Button from "@/components/button";
import Modal from "@/components/Modal";
import NewTransfer from "./add";

function Transfers() {
  const { filters } = useContext(FilterContext);
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const { data, loading, fetchTransferredSchedulesData, totalPages } =
    useFetchSchedulesTransferred();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      ...filters?.schedulesTable,
      ...params,
    };
    fetchTransferredSchedulesData({
      ...filterBy,
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, []);

  return (
    <>
      <ButtonToolbar>
        <Button
          text={translation.new_transfer}
          startIcon="add"
          onClick={() => setOpen(true)}
        />
        {/* <Button
          text={translation.import}
          startIcon="attach_file"
          onClick={() => alert("Coming soon")}
          appearance="ghost"
        />
        <Button
          text={translation.export}
          startIcon="download"
          onClick={() => alert("Coming soon")}
          appearance="ghost"
        /> */}
      </ButtonToolbar>
      <br />
      <AppFilters page="transfers" />
      <br />

      <List
        data={data}
        loading={loading}
        fetchData={fetchData}
        totalPages={totalPages}
      />

      <Modal show={open} handleClose={() => setOpen(false)}>
        <NewTransfer handleClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export default Transfers;
