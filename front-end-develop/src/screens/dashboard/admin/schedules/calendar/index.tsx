import { useContext, useEffect, useState } from "react";
import AppFilters from "./filters";
import { LanguageContext } from "@/context/LanguageContext";
import AppBigCalendar from "@/components/calendar/calendar";
import { useFetchSchedulesCalendar } from "@/hooks/useFetchSchedules";
import moment from "moment";
import Modal from "@/components/Modal";
import { List, Stack } from "rsuite";

function Calendar({ tab }: { tab: string }) {
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>();
  const [filters, setFilters] = useState({
    startDate: moment().format("YYYY-MM-DD HH:mm"),
    endDate: moment().add(1, "month").format("YYYY-MM-DD HH:mm"),
  });
  const { data, loading, fetchSchedulesData } = useFetchSchedulesCalendar();

  const fetchData = (params: any = {}) => {
    const filterBy = {
      ...params,
    };
    fetchSchedulesData({
      ...filterBy,
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    if (tab && tab !== "calendar") return;
    fetchData(filters);
  }, [tab]);

  const onSelectEvent = (event: any) => {
    console.log("selected event", event);
    setOpen(true);
    setSelectedData(event);
  };

  return (
    <>
      <AppFilters page="schedulesCalendar" />
      <br />
      <div className="card">
        <div className="card-body">
          <AppBigCalendar
            onSelectEvent={onSelectEvent}
            loading={loading}
            data={data}
          />
        </div>
      </div>

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={
          selectedData?.startDate
            ? moment(selectedData?.startDate).format("YYYY-MM-DD")
            : ""
        }
      >
        <div className="rs-modal-body">
          {" "}
          <List>
            <List.Item>
              <Stack>
                <Stack.Item grow={1}>{translation.count}:</Stack.Item>
                <Stack.Item>
                  {selectedData?.originalData?.count || ""}
                </Stack.Item>
              </Stack>
            </List.Item>
            <List.Item>
              <Stack>
                <Stack.Item grow={1}>{translation.start}:</Stack.Item>
                <Stack.Item>
                  {selectedData?.originalData?.time?.name || ""}
                </Stack.Item>
              </Stack>
            </List.Item>
            <List.Item>
              <Stack>
                <Stack.Item grow={1}>{translation.end}:</Stack.Item>
                <Stack.Item>
                  {selectedData?.originalData?.time?.nameEndTime || ""}
                </Stack.Item>
              </Stack>
            </List.Item>
            <List.Item>
              <Stack>
                <Stack.Item grow={1}>{translation.center}:</Stack.Item>
                <Stack.Item>
                  {selectedData?.originalData?.time?.center?.name || ""}
                </Stack.Item>
              </Stack>
            </List.Item>
          </List>
        </div>
      </Modal>
    </>
  );
}

export default Calendar;
