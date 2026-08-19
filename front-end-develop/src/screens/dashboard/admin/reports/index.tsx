import CustomTabs from "@/components/tabs";
import Reports from "./report";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import DailyReports from "./daily";
import WeeklyReports from "./weekly";
import MonthlyReports from "./monthly";
import PageHeader from "@/components/pageHeader";

function ReportEntry() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("1");
  return (
    <>
      <PageHeader title={translation.reports} />
      <CustomTabs
        getTab={setTab}
        activeTab={tab}
        options={[
        {
          title: translation.all,
          data: <Reports tab={tab} />,
          key: "1",
        },
        {
          title: translation.daily,
          data: <DailyReports tab={tab} />,
          key: "2",
        },
        {
          title: translation.weekly,
          data: <WeeklyReports tab={tab} />,
          key: "3",
        },
        {
          title: translation.monthly,
          data: <MonthlyReports tab={tab} />,
          key: "4",
        },
        ]}
      />
    </>
  );
}

export default ReportEntry;
