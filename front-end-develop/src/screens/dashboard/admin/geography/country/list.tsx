import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { CountryTypes } from "@/types/geography";
import AddCountry from "./add";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import { StatusCell } from "@/components/table/status";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: CountryTypes[];
  totalPages: number;
  loading: boolean;
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

function List({ data, totalPages, loading, setFilters }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof CountryTypes>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<CountryTypes>();
  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    onSearch({
      offset: 0,
      limit: dataKey,
    });
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    onSearch({
      offset: dataKey,
      limit: 10,
    });
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof CountryTypes;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleModal = (modal: string, action: boolean, item?: CountryTypes) => {
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

  const onSearch = (v?: any) => {
    setFilters((prev: any) => {
      return {
        ...prev,
        ...v,
      };
    });
  };

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
            sortColumn: sortColumn as keyof CountryTypes,
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
        onSearch={(t: string) => onSearch({ search: t })}
        searchPlaceholder={translation.search + "..."}
      >
        <Column fullText resizable minWidth={50}>
          <HeaderCell className="textBold">{translation.code}</HeaderCell>
          <CompactCell dataKey="code" />
        </Column>
        <Column fullText flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.country_name}
          </HeaderCell>
          <CompactCell dataKey="name" />
        </Column>
        <Column fullText flexGrow={1} resizable>
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
        title={translation.document_type}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddCountry
          handleClose={() => handleModal("addModal", false)}
          fetchData={() => onSearch({})}
          selectedData={selectedData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?.countryName || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/geo/countries/${selectedData?._id}`}
          refreshListData={onSearch}
          data={{
            countryId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
