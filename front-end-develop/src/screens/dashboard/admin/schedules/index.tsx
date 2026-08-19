import CustomTabs from "@/components/tabs";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useState } from "react";
import ScheduleTable from "./table";
import Calendar from "./calendar";
import PageHeader from "@/components/pageHeader";

interface Props {}

const Schedules: React.FC<Props> = ({}) => {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("table");
  return (
    <div>
      <PageHeader title={translation.schedules} />
      <CustomTabs
        getTab={setTab}
        options={[
          {
            title: translation.table,
            data: <ScheduleTable tab={tab} />,
            key: "table",
          },
          // {
          //   title: translation.calendar,
          //   data: <Calendar tab={tab} />,
          //   key: "colendar",
          // },
          // {
          //   title: translation.transfer_appointment,
          //   data: <Transfers />,
          // },
        ]}
      />
    </div>
  );
};

export default Schedules;
