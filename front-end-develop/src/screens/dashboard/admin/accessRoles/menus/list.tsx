import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import AddMenu from "../add/menus/add";
import { FilterContext } from "@/context/FilterContext";
import { MenuType } from "@/types/ROLE";
import DeleteData from "@/components/Modal/DeleteModal";
import { AccessRoles } from "./accessRoles";
import { get } from "lodash";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: any[];
  totalPages: number;
  loading: boolean;
  fetchData: () => void;
  paginationLayout?: any;
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
  totalPages,
  loading,
  fetchData,
  paginationLayout,
}: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [selectedData, setSelectedData] = useState<MenuType>();
  const [sortColumn, setSortColumn] = useState<keyof MenuType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { setFilters } = useContext(FilterContext);
  const [modal, setModal] = useState({
    addModal: false,
    roleModal: false,
    deleteModal: false,
  });
  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      menus: {
        ...prev.menus,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      menus: {
        ...prev.menus,
        offset: dataKey,
        limit: 10,
      },
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof MenuType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleModal = (modal: string, action: boolean, item?: MenuType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [
    {
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("addModal", true, rowData),
    },
    {
      name: translation.delete,
      icon: "delete",
      onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
    },
  ];

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
            sortColumn: sortColumn as keyof ListProps,
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
          <HeaderCell className="textBold">
            {translation.access_roles}
          </HeaderCell>
          <AccessRoles dataKey="accessRoles" />
        </Column>

        <Column flexGrow={1}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>
      <Modal
        show={modal.addModal}
        title={translation.menu}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddMenu
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
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
            url={`/configuration/menus/${selectedData?._id}`}
            refreshListData={fetchData}
            data={{
              menuId: selectedData?._id,
            }}
          />
        )}
      </Modal>
    </>
  );
}

export default List;
