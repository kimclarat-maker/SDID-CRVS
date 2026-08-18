import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import AddHolidayType from "../add";
import { FilterContext } from "@/context/FilterContext";
import DeleteData from "@/components/Modal/DeleteModal";
import { HolidayType } from "@/types/Holidays";
import { get } from "lodash";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: HolidayType[];
  loading: boolean;
  fetchData: () => void;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [sortColumn, setSortColumn] = useState<keyof HolidayType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [selectedData, setSelectedData] = useState<HolidayType>();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof HolidayType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleChangeLimit = (dataKey: number) => {
    setPage(page);
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      holidayList: {
        ...prev.holidayList,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      holidayList: {
        ...prev.holidayList,
        page: dataKey,
        limit: 10,
      },
    }));
  };

  const handleModal = (modal: string, action: boolean, item?: HolidayType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [
    // {
    //   name: translation.edit,
    //   icon: "edit",
    //   onClick: (rowData: any) => handleModal("addModal", true, rowData),
    // },
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
            sortColumn: sortColumn as keyof HolidayType,
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
      >
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.name}</HeaderCell>
          <CompactCell dataKey="date" />
        </Column>

        <Column flexGrow={1}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>

      <Modal
        show={modal.addModal}
        title=""
        handleClose={() => handleModal("addModal", false)}
      >
        <AddHolidayType
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
        <DeleteData
          secretText={selectedData?.name || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/configuration/holidays/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            documentTypeId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
