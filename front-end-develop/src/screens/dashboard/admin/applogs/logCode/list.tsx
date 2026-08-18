import Table from "@/components/table";
import { Table as LibTable, Text, List } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { useNavigate } from "react-router-dom";
import { LogType } from "@/types/LogsType";
import { FilterContext } from "@/context/FilterContext";
import { get } from "lodash";
import Modal from "@/components/Modal";
import ButtonCell from "@/components/table/button/buttonCell";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function ErrorList({
  data,
  loading,
  totalPages,
}: {
  data: LogType[];
  loading: boolean;
  totalPages: number;
}) {
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [sortColumn, setSortColumn] = useState<keyof LogType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
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
      ...prev,
      logs: {
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

  const actions: ActionType[] = [
    {
      name: translation.view,
      icon: "visibility",
      onClick: (rowData) => navigate(rowData.url),
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
      >
        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">Error</HeaderCell>
          <CompactCell dataKey="error" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">Error Code</HeaderCell>
          <CompactCell dataKey="errorCode" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">Method</HeaderCell>
          <CompactCell dataKey="method" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">Module</HeaderCell>
          <CompactCell dataKey="module" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">StackTrace</HeaderCell>
          <CompactCell dataKey="stackTrace" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable>
          <HeaderCell className="textBold">_id</HeaderCell>
          <CompactCell dataKey="_id" />
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

      <Modal show={openModal} handleClose={() => setOpenModal(false)}>
        <div className="rs-modal-body">
          {selectedData && (
            <List>
              <List.Item>{selectedData.error}</List.Item>
              <List.Item>{selectedData.errorCode}</List.Item>
              <List.Item>{selectedData.stackTrace}</List.Item>
              <List.Item>{selectedData._id}</List.Item>
            </List>
          )}
        </div>
      </Modal>
    </>
  );
}

export default ErrorList;
