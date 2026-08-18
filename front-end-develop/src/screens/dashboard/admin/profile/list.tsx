import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { GETSingleNotification, NotificationType } from "@/types/Notification";
import Modal from "@/components/Modal";
import { get } from "lodash";
import { DateCell } from "@/components/table/date";
import { StatusCell } from "@/components/table/status";

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
  const [notificationData, setNotification] = useState<GETSingleNotification>();
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

  const actions: ActionType[] = [
    {
      name: translation.view,
      icon: "visibility",
      onClick: (rowData) => handleOpenModal(rowData),
    },
  ];

  const handleOpenModal = (data: GETSingleNotification) => {
    openModal(true);
    setNotification(data);
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
        // totalPages={totalPages}
      >
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.message}</HeaderCell>
          <CompactCell dataKey="message" />
        </Column>

        <Column fullText sortable resizable flexGrow={1}>
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <DateCell dataKey="postedDate" />
        </Column>

        <Column fullText sortable resizable flexGrow={1}>
          <HeaderCell className="textBold">{translation.subject}</HeaderCell>
          <StatusCell dataKey="subject" />
        </Column>

        <Column>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>
    </>
  );
}

export default List;
