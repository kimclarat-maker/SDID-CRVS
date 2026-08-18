import List from "./list";
import { useContext, useEffect, useState } from "react";
import { useFetchAccessRights } from "@/hooks/useAccessRights";
import { ButtonToolbar } from "rsuite";
import { LanguageContext } from "@/context/LanguageContext";
import Button from "@/components/button";
import Modal from "@/components/Modal";
import { defineAccess } from "@/utils/common/permissions";
import AppFilters from "./filters";
import AddAccessRight from "../add/accessRight";
import { RoleType } from "@/types/ROLE";

interface FiltersType {
  role?: RoleType;
  search?: string | undefined;
  order?: string;
  module?: string;
  roleId?: string;
  offset?: number;
  limit?: number;
}

function AccessRights() {
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const {
    accessRights,
    loadingAccessRights,
    fetchAccessRightsData,
    totalPages,
  } = useFetchAccessRights();

  const [filters, setFilters] = useState<FiltersType>({
    offset: 0,
    limit: 10,
  } as FiltersType);

  const fetchData = () => {
    fetchAccessRightsData({
      offset: filters.offset || 0,
      limit: filters.limit || 10,
      search:
        filters.search && filters.search !== ""
          ? filters?.search?.trim()
          : undefined,
      order: filters?.order || "desc",
      module: filters?.module,
      roleId: filters?.role?.value || undefined,
    });
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div className="row">
      <ButtonToolbar className="mb-3">
        {defineAccess({ method: "post", module: "accessrights" }) && (
          <Button
            text={translation.add}
            startIcon="add"
            onClick={() => setOpen(true)}
          />
        )}
      </ButtonToolbar>
      <div>
        <AppFilters filters={filters} setFilters={setFilters} />
        <br />
        <List
          data={accessRights}
          fetchData={fetchData}
          loading={loadingAccessRights}
          totalPages={totalPages}
          setFilters={setFilters}
        />
      </div>

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.permission}
      >
        <AddAccessRight
          handleClose={() => setOpen(false)}
          defaultRole={filters?.role}
          fetchData={fetchData}
        />
      </Modal>
    </div>
  );
}

export default AccessRights;
