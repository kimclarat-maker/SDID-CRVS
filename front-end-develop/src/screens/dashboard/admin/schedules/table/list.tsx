import Table from "@/components/table";
import {
  Table as LibTable,
  List as LibList,
  Stack,
  ButtonToolbar,
} from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { get, set } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { ScheduleType } from "@/types/Schedule";
import { DateCell } from "@/components/table/date";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { LinkCell } from "@/components/table/linkCell";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import { updateSchedules } from "@/api/schedules";
import toastMessage from "@/utils/common/toastMessage";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: ScheduleType[];
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
  const [sortColumn, setSortColumn] = useState<keyof ScheduleType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

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
    sortColumn: keyof ScheduleType;
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

  const onUpdate = async (id: string, params: any) => {
    try {
      setUpdating(true);

      const data = await updateSchedules(id, params);

      toastMessage("success", data.message);

      fetchData({
        offset: 0,
        limit,
      });

      setOpenModal(false);
      setUpdating(false);
    } catch (error) {
      toastMessage("error", error);
      setUpdating(false);
    }
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
            sortColumn: sortColumn as keyof ScheduleType,
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
          <HeaderCell>{translation.appointment_number}</HeaderCell>
          <LinkCell
            dataKey="appointmentNo"
            onClick={(item) => {
              setOpenModal(true);
              setSelectedData(item);
            }}
          />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.request_number}</HeaderCell>
          <CompactCell dataKey="requestNo" />
        </Column>

        {/* <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="request.firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="request.lastName" />
        </Column> */}

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.phone_number}</HeaderCell>
          <CompactCell dataKey="phoneNumber" />
        </Column>

        {/* <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.center}</HeaderCell>
          <CompactCell dataKey="center.name" />
        </Column> */}

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
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
        title={selectedData?.appointmentNo}
      >
        {selectedData && (
          <div className="rs-modal-body">
            <div className="user-img">
              <img
                src={selectedData?.request?.selfie || userImagePlaceholder}
                alt=""
              />
            </div>
            <LibList>
              <LibList.Item>
                {renderItem(
                  translation.prenrollment_number,
                  selectedData?.request?.preEnrollmentNumber
                )}
              </LibList.Item>
              <LibList.Item>
                {renderItem(
                  translation.surname,
                  selectedData?.request?.firstName
                )}
              </LibList.Item>
              <LibList.Item>
                {renderItem(
                  translation.post_name,
                  selectedData?.request?.lastName
                )}
              </LibList.Item>
              <LibList.Item>
                {renderItem(translation.center, selectedData?.center?.name)}
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
              <ButtonToolbar className="mb-3">
                {(selectedData?.status?.toUpperCase() !== "COMPLETE" ||
                  selectedData?.status?.toUpperCase() !==
                    "MARKED_FOR_SCHEDULE") && (
                  <>
                    <Button
                      text={translation.mark_as_complete}
                      onClick={() =>
                        onUpdate(selectedData._id, { status: "complete" })
                      }
                      appearance="default"
                    />
                    <Button
                      text={translation.start_review}
                      onClick={() =>
                        navigate(
                          `/dashboard/admin/prenrollment/search?prq=${selectedData?.request?.preEnrollmentNumber}`
                        )
                      }
                    />
                  </>
                )}
                {/* <Button
                  text={translation.transfer}
                  appearance="ghost"
                  onClick={() =>
                    navigate(
                      `/dashboard/admin/schedules/transfer/${selectedData._id}`
                    )
                  }
                /> */}
              </ButtonToolbar>
            </Stack>
          </div>
        )}
      </Modal>
    </>
  );
}

export default List;
