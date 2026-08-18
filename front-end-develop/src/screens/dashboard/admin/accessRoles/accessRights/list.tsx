import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import { RoleType } from "@/types/ROLE";
import DeleteData from "@/components/Modal/DeleteModal";
import AddAccessRight from "../add/accessRight";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: RoleType[];
  fetchData: (e: any) => void;
  paginationLayout?: any;
  loading?: boolean;
  totalPages?: number;
  setFilters: (e: any) => void;
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
  setFilters,
}: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof RoleType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<RoleType>();
  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      offset: 0,
      limit: dataKey,
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      offset: dataKey,
      limit: 10,
    }));
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
    defineAccess({ method: "update", module: "accessrights" })
      ? {
          name: translation.edit,
          icon: "edit",
          onClick: (rowData: any) => handleModal("addModal", true, rowData),
        }
      : undefined,
    defineAccess({ method: "delete", module: "accessrights" })
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
        // onSearch={(t: string) => fetchData({ search: t })}
        // searchPlaceholder={translation.search + "..."}
      >
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">
            {translation.access_role}
          </HeaderCell>
          <CompactCell dataKey="role.name" />
        </Column>
        <Column fullText resizable flexGrow={1}>
          <HeaderCell className="textBold">{translation.module}</HeaderCell>
          <CompactCell dataKey="module" />
        </Column>
        <Column flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.post}</HeaderCell>
          <CompactCell dataKey="post" />
        </Column>
        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">{translation.get}</HeaderCell>
          <CompactCell dataKey="get" />
        </Column>
        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">{translation.update}</HeaderCell>
          <CompactCell dataKey="update" />
        </Column>
        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">{translation.delete}</HeaderCell>
          <CompactCell dataKey="delete" />
        </Column>
        {(defineAccess({ method: "update", module: "accessrights" }) ||
          defineAccess({ method: "delete", module: "accessrights" })) && (
          <Column flexGrow={1}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ActionCell actions={actions} />
          </Column>
        )}
      </Table>
      <Modal
        show={modal.addModal}
        title={`${selectedData?.module} ${translation.permissions}`}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddAccessRight
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
            url={`/configuration/access-rights/${selectedData?._id}`}
            refreshListData={fetchData}
            data={{
              accessRightId: selectedData?._id,
            }}
          />
        )}
      </Modal>
    </>
  );
}

export default List;
