import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { FilterContext } from "@/context/FilterContext";
import { PermissionType } from "@/types/AccessRight";
import { get } from "lodash";
import { ModuleType } from "@/types/Modules";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: ModuleType[];
  filters: any;
  setFilters: (e: any) => void;
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
  paginationLayout,
  loading,
  totalPages,
  filters,
  setFilters,
}: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof PermissionType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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
    sortColumn: keyof ModuleType;
    sortType: string;
  }) => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    setFilters((prev: any) => ({
      ...prev,
      order: sortType,
    }));
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
            sortColumn: sortColumn as keyof PermissionType,
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
        // searchPlaceholder={translation.search}
      >
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.name}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.value}</HeaderCell>
          <CompactCell dataKey="value" />
        </Column>

        {/* <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.actions}</HeaderCell>
          <ButtonCell dataKey="_id" onClick={() => setOpen(true)} />
        </Column> */}
      </Table>
    </>
  );
}

export default List;
