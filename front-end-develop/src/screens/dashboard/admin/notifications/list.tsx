import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import { DateCell } from "@/components/table/date";
import { StatusCell } from "@/components/table/status";
import { NotificationType } from "@/types/Notification";

const { Column, HeaderCell, Cell } = LibTable;

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
  loading,
  totalPages,
  fetchData,
}: {
  data: NotificationType[];
  loading: boolean;
  totalPages: number;
  fetchData: (e: any) => void;
}) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof NotificationType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, openModal] = useState(false);

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
    sortColumn: keyof NotificationType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
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
            sortColumn: sortColumn as keyof NotificationType,
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
      >
        <Column resizable>
          <HeaderCell className="textBold">{translation.type}</HeaderCell>
          <CompactCell dataKey="type" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.subject}</HeaderCell>
          <CompactCell dataKey="subject" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.message}</HeaderCell>
          <CompactCell dataKey="message" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column fullText sortable resizable flexGrow={1}>
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <DateCell dataKey="date" />
        </Column>
      </Table>
    </>
  );
}

export default List;
