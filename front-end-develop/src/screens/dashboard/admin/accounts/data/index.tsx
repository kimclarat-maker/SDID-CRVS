import { useFetchAccounts } from "@/hooks/useAccounts";
import AppFilters from "../filters";
import List from "../list";
import { useContext, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import AddAccount from "../add";
import { LanguageContext } from "@/context/LanguageContext";
import { ButtonToolbar, Heading, Stack } from "rsuite";
import Button from "@/components/button";
import { defineAccess } from "@/utils/common/permissions";

function Accounts({ status }: { status?: string }) {
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState();

  const { data, loading, fetchAccountData, totalPages } = useFetchAccounts();

  const fetchData = (params: any = {}) => {
    fetchAccountData(
      {
        offset: params.offset || 0,
        limit: params.limit || 10,
        center: params?.center?.value,
        status,
        search:
          params.search && params.search !== "" ? params.search : undefined,
        firstName: params?.firstName,
        lastName: params?.lastName,
        email:
          params?.email && params?.email !== "" ? params?.email : undefined,
        idNumber:
          params?.idNumber && params?.idNumber !== ""
            ? params?.idNumber
            : undefined,
        phoneNumber:
          params?.phoneNumber && params?.phoneNumber !== ""
            ? params?.phoneNumber
            : undefined,
      },
      true
    );
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const canCreateAccount = defineAccess({
    method: "post",
    module: "account",
  });

  const canUpdateAccount = defineAccess({
    method: "PATCH",
    module: "account",
  });

  return (
    <>
      <Stack>
        <Stack.Item grow={1}></Stack.Item>
        <Stack.Item>
          <ButtonToolbar>
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
            {canCreateAccount && (
              <Button
                text={translation.add}
                startIcon="add"
                onClick={() => setOpen(true)}
              />
            )}
          </ButtonToolbar>
        </Stack.Item>
      </Stack>

      <br />
      <AppFilters filters={filters} setFilters={setFilters} />
      <br />

      <List
        data={data}
        loading={loading}
        fetchData={fetchData}
        totalPages={totalPages}
      />

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.account}
        size="lg"
      >
        <AddAccount handleClose={() => setOpen(false)} fetchData={fetchData} />
      </Modal>
    </>
  );
}

export default Accounts;
