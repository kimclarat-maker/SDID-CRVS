import Table from "@/components/table";
import {
  Table as LibTable,
  List as LibList,
  Stack,
  ButtonToolbar,
} from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get, set } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { TransferType } from "@/types/Transfers";
import { DateCell } from "@/components/table/date";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: TransferType[];
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
  const [sortColumn, setSortColumn] = useState<keyof TransferType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<TransferType>();
  const navigate = useNavigate();

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
    sortColumn: keyof TransferType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const renderItem = (label: string, value: string) => {
    return (
      <Stack>
        <Stack.Item grow={1}>{label}</Stack.Item>
        <Stack.Item>{value}</Stack.Item>
      </Stack>
    );
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
            sortColumn: sortColumn as keyof TransferType,
            sortType,
          })
        }
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        totalPages={totalPages}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <CompactCell dataKey="prenrollmentNumber" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.from_center}</HeaderCell>
          <CompactCell dataKey="fromCenter.name" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.to_center}</HeaderCell>
          <CompactCell dataKey="toCenter.name" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.appointment_date}</HeaderCell>
          <DateCell dataKey="appointmentDate" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              setOpenModal(true);
              setSelectedData(rowData);
            }}
          />
        </Column>
      </Table>
      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        title={translation.appointment}
      >
        {selectedData && (
          <>
            <LibList>
              <LibList.Item>
                {renderItem(
                  translation.prenrollment_number,
                  selectedData.prenrollmentNumber
                )}
              </LibList.Item>
              <LibList.Item>
                {renderItem(translation.surname, selectedData.firstName)}
              </LibList.Item>
              <LibList.Item>
                {renderItem(translation.post_name, selectedData.lastName)}
              </LibList.Item>
              <LibList.Item>
                {renderItem(translation.center, selectedData.fromCenter.name)}
              </LibList.Item>
              <LibList.Item>
                {renderItem(translation.to_center, selectedData.toCenter.name)}
              </LibList.Item>
              <LibList.Item>
                {renderItem(
                  translation.date,
                  moment(selectedData.appointmentDate).format("lll")
                )}
              </LibList.Item>
            </LibList>
            <br />
            <Stack>
              <Stack.Item grow={1}>
                <Button
                  text={translation.cancel}
                  appearance="default"
                  onClick={() => setOpenModal(false)}
                />
              </Stack.Item>
              <ButtonToolbar>
                <Button
                  text={translation.transfer}
                  appearance="ghost"
                  onClick={() =>
                    navigate(
                      `/dashboard/admin/schedules/transfer/${selectedData._id}`
                    )
                  }
                />
                <Button text={translation.start_review} />
              </ButtonToolbar>
            </Stack>
          </>
        )}
      </Modal>
    </>
  );
}

export default List;
