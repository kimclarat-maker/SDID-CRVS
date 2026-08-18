import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { DistrictTypes } from "@/types/geography";
import { FilterContext } from "@/context/FilterContext";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import { StatusCell } from "@/components/table/status";
import AddDistrict from "./add";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: DistrictTypes[];
  totalPages: number;
  loading: boolean;
  fetchData: (e: any) => void;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, totalPages, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof DistrictTypes>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { setFilters } = useContext(FilterContext);
  const [selectedData, setSelectedData] = useState<DistrictTypes>();
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
    sortColumn: keyof DistrictTypes;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleModal = (
    modal: string,
    action: boolean,
    item?: DistrictTypes
  ) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [];

  if (
    defineAccess({
      method: "UPDATE",
      module: "geography",
    })
  ) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("addModal", true, rowData),
    });
  }

  if (
    defineAccess({
      method: "DELETE",
      module: "geography",
    })
  ) {
    actions.push({
      name: translation.delete,
      icon: "delete",
      onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
    });
  }
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
            sortColumn: sortColumn as keyof DistrictTypes,
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
        onSearch={(t: string) => fetchData({ name: t, offset: 0 })}
        searchPlaceholder={translation.search + " " + translation.code}
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.code}</HeaderCell>
          <CompactCell dataKey="code" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.country}</HeaderCell>
          <CompactCell dataKey="countryName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.province}</HeaderCell>
          <CompactCell dataKey="province" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.district_name}
          </HeaderCell>
          <CompactCell dataKey="name" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>
        <Column flexGrow={1} resizable minWidth={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>

      <Modal
        show={modal.addModal}
        title=""
        handleClose={() => handleModal("addModal", false)}
      >
        <AddDistrict
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
        <DeleteData
          secretText={selectedData?.name || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/geo/districts/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            districtId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
