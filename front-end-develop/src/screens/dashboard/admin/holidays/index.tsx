import CustomTabs from "@/components/tabs";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import TopLevelHolidays from "./holidays";
import OffDays from "./offdays";
import PageHeader from "@/components/pageHeader";

function Holidays() {
  const { translation } = useContext(LanguageContext);
  return (
    <div>
      <PageHeader title={translation.holidays} />
      <CustomTabs
        options={[
          {
            title: translation.holidays,
            data: <TopLevelHolidays />,
          },
          {
            title: translation.offdays,
            data: <OffDays />,
          },
        ]}
      />
    </div>
  );
}

export default Holidays;
