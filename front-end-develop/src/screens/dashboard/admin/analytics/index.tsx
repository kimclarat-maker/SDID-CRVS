import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Header from "@/components/header";
import { useParams } from "react-router-dom";
import Enrolled from "./enrolled";
import All from "./all";
import CustomTabs from "@/components/tabs";
import Pending from "./pending";

function Analytics() {
  const { translation } = useContext(LanguageContext);
  const { page = "dashboard" } = useParams();
  const [tab, setTab] = useState("all");

  return (
    <>
      <Header title={translation[page]} />
      <br />

      <CustomTabs
        getTab={setTab}
        activeTab={tab}
        options={[
          {
            title: translation.all,
            key: "all",
            data: <All tab={tab} />,
          },
          {
            title: translation.enrolled,
            key: "enrolled",
            data: <Enrolled tab={tab} />,
          },
          {
            title: translation.pending,
            key: "pending",
            data: <Pending tab={tab} />,
          },
          // {
          //   title: translation.missed_appointments,
          //   key: "appointments",
          //   data: <MissedAppointment tab={tab} />,
          // },
        ]}
      />
    </>
  );
}

export default Analytics;
