import Table from "@/components/table";
import { Table as LibTable, Text } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { LogType } from "@/types/LogsType";
import { FilterContext } from "@/context/FilterContext";
import { get } from "lodash";
import Modal from "@/components/Modal";
import ButtonCell from "@/components/table/button/buttonCell";
import { DateCell } from "@/components/table/date";
import LogInfo from "../logInfo";

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
  identifier,
}: {
  data: LogType[];
  loading: boolean;
  totalPages?: number;
  fetchData: (e: any) => void;
  identifier?: string;
}) {
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [sortColumn, setSortColumn] = useState<keyof LogType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>();

  const handleChangeLimit = (dataKey: number) => {
    setPage(page);
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      logs: {
        ...prev.notifications,
        offset: page,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev.applicationLogs,
      applicationLogs: {
        ...prev.notifications,
        offset: dataKey,
        limit: 10,
      },
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof LogType;
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
            sortColumn: sortColumn as keyof LogType,
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
        handleRowClick={(rowData) => {
          setSelectedData(rowData);
          setOpenModal(true);
        }}
        onSearch={(t: string) => fetchData({ identifier: t })}
        searchPlaceholder={translation.search + "..."}
      >
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">Action</HeaderCell>
          <CompactCell dataKey="action" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">Date</HeaderCell>
          <DateCell dataKey="postedDate" formatTime="lll" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">Module</HeaderCell>
          <CompactCell dataKey="module" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">Type</HeaderCell>
          <CompactCell dataKey="type" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">ID</HeaderCell>
          <CompactCell dataKey="id" />
        </Column>

        <Column flexGrow={1}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              setSelectedData(rowData);
              setOpenModal(true);
            }}
          />
        </Column>
      </Table>

      <Modal
        size="lg"
        show={openModal}
        title={"Logs -  " + identifier}
        handleClose={() => setOpenModal(false)}
      >
        {selectedData?.data?.module === "SMSService" ? (
          <Text>{selectedData.data.message}</Text>
        ) : selectedData?.data?.module === "MailService" ? (
          <div
            dangerouslySetInnerHTML={{
              __html: selectedData.data.html.replace(/body\{[^\}]+\}/, ""),
            }}
          />
        ) : (
          <div>
            <LogInfo data={selectedData} />
          </div>
        )}
      </Modal>
    </>
  );
}

export default List;
