import Table from "@/components/table";
import { Table as LibTable, List, Stack, Drawer, Text, Avatar } from "rsuite";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import userPhotoPlaceholder from "@/assets/userPhotoPlaceholder.png";
import { AccountType } from "@/types/Account";
import { get } from "lodash";
import { Link } from "react-router-dom";
import { DeviceType } from "@/types/Device";
import { DateCell } from "@/components/table/date";
import moment from "moment";
import ButtonCell from "@/components/table/button/buttonCell";
import { useFetchAccountById } from "@/hooks/useAccounts";
import Loading from "@/components/loader";

const { Column, HeaderCell, Cell } = LibTable;

const Log = (selectedData: any) => {
  const { translation } = useContext(LanguageContext);

  const { data, fetchAccountData, loading } = useFetchAccountById();

  useEffect(() => {
    if (selectedData?.performedBy) {
      fetchAccountData(selectedData?.performedBy);
    }
  }, [selectedData]);

  const renderAccount = () => {
    return (
      <Stack spacing={16}>
        {loading ? (
          <Loading />
        ) : (
          <>
            <Stack.Item>
              <Avatar
                circle
                size="sm"
                src={data?.photo || userPhotoPlaceholder}
                alt="avatar"
              />
            </Stack.Item>
            <Stack.Item>
              <Text className="textBold">
                {data?.firstName} {data?.lastName}
              </Text>
              {data.center && (
                <Text style={{ fontSize: 12 }}>{data.center?.name}</Text>
              )}
            </Stack.Item>
          </>
        )}
      </Stack>
    );
  };

  return (
    <List>
      <List.Item>
        <Stack>
          <Stack.Item grow={1}>
            <strong>{translation.action}</strong>
          </Stack.Item>
          <Stack.Item>{selectedData?.action}</Stack.Item>
        </Stack>
      </List.Item>
      <List.Item>
        <Stack spacing={16}>
          <Stack.Item grow={1}>
            <strong>{translation.details}</strong>
          </Stack.Item>
          <Stack.Item>{selectedData?.details}</Stack.Item>
        </Stack>
      </List.Item>
      <List.Item>
        <Stack>
          <Stack.Item grow={1}>
            <strong>{translation.date}</strong>
          </Stack.Item>
          <Stack.Item>
            {selectedData?.timestamp
              ? moment(selectedData?.timestamp).format("lll")
              : "-"}
          </Stack.Item>
        </Stack>
      </List.Item>
      <List.Item>
        <Stack>
          <Stack.Item grow={1}>
            <strong>{translation.performed_by}</strong>
          </Stack.Item>
          <Stack.Item>{renderAccount()}</Stack.Item>
        </Stack>
      </List.Item>
    </List>
  );
};

interface ListProps {
  data: AccountType[];
  totalPages?: number;
  loading: boolean;
  fetchData: (e: any) => void;
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

function AppList({
  data,
  totalPages,
  loading,
  fetchData,
  setFilters,
}: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof DeviceType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<DeviceType>();
  const [open, setOpen] = useState(false);

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
    sortColumn: keyof AccountType;
    sortType: string;
  }) => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    setFilters((prev: any) => ({
      ...prev,
      order: sortType,
    }));
  };

  const handleModal = (item?: DeviceType) => {
    setOpen(true);

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [
    {
      name: translation.view,
      icon: "visibility",
      onClick: (rowData: any) => handleModal(rowData),
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
            sortColumn: sortColumn as keyof DeviceType,
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
        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <DateCell dataKey="timestamp" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <CompactCell dataKey="action" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.details}</HeaderCell>
          <CompactCell dataKey="details" />
        </Column>

        <Column width={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ButtonCell icon="visibility" onClick={handleModal} dataKey="_id" />
        </Column>
      </Table>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <Drawer.Body>
          <Log {...selectedData} />
        </Drawer.Body>
      </Drawer>
    </>
  );
}

export default AppList;
