import { useFetchRole } from "@/hooks/useRole";
import Filters from "./filters";
import List from "./list";
import { useContext, useEffect, useState } from "react";
import { ButtonToolbar } from "rsuite";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { defineAccess } from "@/utils/common/permissions";
import Modal from "@/components/Modal";
import AddRole from "../add/role";

function Roles() {
  const [open, setOpen] = useState(false);
  const { translation } = useContext(LanguageContext);
  const { roles, loadingRoles, fetchRolesData, totalPages } = useFetchRole();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any = {}) => {
    let paramsFilter = {
      offset: params.offset || 0,
      limit: params.limit || 10,
      ...params,
      search: params.search && params.search !== "" ? params.search : undefined,
      value: params?.value,
    };

    delete paramsFilter.permission;
    fetchRolesData(paramsFilter);
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <div className="row">
      <div className="mb-3">
        <ButtonToolbar>
          {defineAccess({ method: "post", module: "roles" }) && (
            <Button
              text={translation.add}
              startIcon="add"
              onClick={() => setOpen(true)}
            />
          )}
        </ButtonToolbar>
      </div>
      <div>
        <Filters filters={filters} setFilters={setFilters} />
        <br />
        <List
          data={roles}
          fetchData={fetchData}
          loading={loadingRoles}
          totalPages={totalPages}
        />
      </div>
      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.role}
      >
        <AddRole handleClose={() => setOpen(false)} />
      </Modal>
    </div>
  );
}

export default Roles;
