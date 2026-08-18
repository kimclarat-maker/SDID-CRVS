import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Loading from "../loader";
import Empty from "../empty";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

const localizer = momentLocalizer(moment);

type CalendarType = {
  data: any;
  onSelectEvent: (el: any) => void;
  loading: boolean;
};

const AppBigCalendar = ({ data, onSelectEvent, loading }: CalendarType) => {
  const { translation } = useContext(LanguageContext);

  // Transform the data to match react-big-calendar format
  const transformDataToEvents = (data: any) => {
    if (!data || !Array.isArray(data)) return [];

    return data.flatMap((day) => {
      const date = moment(day.date).startOf("day");

      return day.slots.map((slot: any) => {
        const startTime = moment(slot.time.time, "HH:mm:ss");
        const endTime = moment(slot.time.timeSlotEndTime, "HH:mm:ss");

        return {
          start: moment(date)
            .set({
              hour: startTime.hour(),
              minute: startTime.minute(),
              second: startTime.second(),
            })
            .toDate(),
          end: moment(date)
            .set({
              hour: endTime.hour(),
              minute: endTime.minute(),
              second: endTime.second(),
            })
            .toDate(),
          title: slot.title,
          originalData: slot, // Keep original data for reference
        };
      });
    });
  };

  const events = transformDataToEvents(data);

  if (loading) return <Loading isFullScreen />;

  if (events.length === 0) return <Empty title={translation.no_data} />;

  console.log("transformed events", events);

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "75vh" }}
        onSelectEvent={(event) => {
          const startDate = moment(event.start).format("YYYY-MM-DD HH:mm");
          const endDate = moment(event.end).format("YYYY-MM-DD HH:mm");
          onSelectEvent({
            startDate,
            endDate,
            originalData: event.originalData, // Pass the original slot data if needed
          });
        }}
      />
    </div>
  );
};

export default AppBigCalendar;
