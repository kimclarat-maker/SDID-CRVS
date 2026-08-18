import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import AddRole from "../add/role";
import { RoleType } from "@/types/ROLE";
import DeleteData from "@/components/Modal/DeleteModal";
import { FilterContext } from "@/context/FilterContext";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";
import { StatusCell } from "@/components/table/status";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: RoleType[];
  fetchData: (e: any) => void;
  paginationLayout?: any;
  loading?: boolean;
  totalPages?: number;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({
  data,
  fetchData,
  paginationLayout,
  loading,
  totalPages,
}: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof RoleType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<RoleType>();
  const { setFilters } = useContext(FilterContext);
  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);
    fetchData({
      offset: 0,
      limit: dataKey,
    });
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    fetchData({
      offset: dataKey,
      limit: 10,
    });
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof RoleType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleModal = (modal: string, action: boolean, item?: RoleType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: any = [
    defineAccess({ method: "update", module: "roles" })
      ? {
          name: translation.edit,
          icon: "edit",
          onClick: (rowData: any) => handleModal("addModal", true, rowData),
        }
      : undefined,
    defineAccess({ method: "delete", module: "roles" })
      ? {
          name: translation.delete,
          icon: "delete",
          onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
        }
      : undefined,
  ].filter((action) => action !== undefined);

  return (
    <>
      <Table
        data={onSort({
          data,
          sortColumn,
          sortType,
        })}
        handleSortClick={({ sortColumn, sortType }) =>
          handleSortClick({
            sortColumn: sortColumn as keyof RoleType,
            sortType,
          })
        }
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
        totalPages={totalPages}
        paginationLayout={paginationLayout}
      >
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.name}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.category}</HeaderCell>
          <StatusCell dataKey="value" />
        </Column>

        {(defineAccess({ method: "update", module: "roles" }) ||
          defineAccess({ method: "update", module: "roles" })) && (
          <Column flexGrow={1}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ActionCell actions={actions} />
          </Column>
        )}
      </Table>
      <Modal
        show={modal.addModal}
        title={translation.role}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddRole
          handleClose={() => handleModal("addModal", false)}
          fetchData={() => fetchData({})}
          selectedData={selectedData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        {selectedData && (
          <DeleteData
            secretText={selectedData?.name || ""}
            handleCloseModal={() => handleModal("deleteModal", false)}
            url={`/configuration/roles/${selectedData?._id}`}
            refreshListData={fetchData}
            data={{
              roleId: selectedData?._id,
            }}
          />
        )}
      </Modal>
    </>
  );
}

export default List;
