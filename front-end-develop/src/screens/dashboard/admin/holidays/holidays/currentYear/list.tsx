import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { FilterContext } from "@/context/FilterContext";
import { HolidayType } from "@/types/Holidays";
import { get } from "lodash";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: HolidayType[];
  loading: boolean;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, loading }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [sortColumn, setSortColumn] = useState<keyof HolidayType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

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
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <CompactCell dataKey="date" />
        </Column>
      </Table>
    </>
  );
}

export default List;
