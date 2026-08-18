import CustomTabs from "@/components/tabs";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import TopLevelHolidays from "./holidays";
import OffDays from "./offdays";

function Holidays() {
  const { translation } = useContext(LanguageContext);
  return (
    <div>
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
