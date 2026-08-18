import Table from "@/components/table";
import {
  Table as LibTable,
  List as LibList,
  Stack,
  ButtonToolbar,
} from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import { get } from "lodash";
import { ReportType } from "@/types/Report";
import Button from "@/components/button";
import ButtonCell from "@/components/table/button/buttonCell";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: ReportType[];
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
  const [sortColumn, setSortColumn] = useState<keyof ReportType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<ReportType>();
  const [modal, setModal] = useState(false);

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

  const handleModal = (action: boolean, item?: ReportType) => {
    setModal(action);

    if (item) {
      setSelectedData(item);
    }
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof ReportType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const actions: ActionType[] = [
    {
      icon: "visibility",
      onClick: (rowData: any) => handleModal(true, rowData),
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
            sortColumn: sortColumn as keyof ReportType,
            sortType,
          })
        }
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        totalPages={totalPages}
        onSearch={(t: string) => fetchData({ search: t })}
        searchPlaceholder={translation.search + "..."}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.center}</HeaderCell>
          <CompactCell dataKey="center" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.completed}</HeaderCell>
          <CompactCell dataKey="completed" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.roll_backs}</HeaderCell>
          <CompactCell dataKey="rollBacks" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.scheduled}</HeaderCell>
          <CompactCell dataKey="scheduled" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              setSelectedData(rowData);
              handleModal(true, rowData);
            }}
          />
        </Column>
      </Table>

      <Modal
        show={modal}
        title={selectedData?.center}
        handleClose={() => handleModal(false)}
      >
        <LibList bordered>
          <LibList.Item>
            <Stack>
              <Stack.Item grow={1}>
                <span>{translation.center}</span>
              </Stack.Item>
              <Stack.Item>{selectedData?.center}</Stack.Item>
            </Stack>
          </LibList.Item>
          <LibList.Item>
            <Stack>
              <Stack.Item grow={1}>
                <span>{translation.completed}</span>
              </Stack.Item>
              <Stack.Item>{selectedData?.completed}</Stack.Item>
            </Stack>
          </LibList.Item>
          <LibList.Item>
            <Stack>
              <Stack.Item grow={1}>
                <span>{translation.scheduled}</span>
              </Stack.Item>
              <Stack.Item>{selectedData?.scheduled}</Stack.Item>
            </Stack>
          </LibList.Item>
          <LibList.Item>
            <Stack>
              <Stack.Item grow={1}>
                <span>{translation.roll_backs}</span>
              </Stack.Item>
              <Stack.Item>{selectedData?.rollBacks}</Stack.Item>
            </Stack>
          </LibList.Item>
        </LibList>
      </Modal>
    </>
  );
}

export default List;
