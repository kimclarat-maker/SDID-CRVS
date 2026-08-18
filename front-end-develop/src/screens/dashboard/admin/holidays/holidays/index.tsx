import Filters from "./filters";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import CurrentYearHolidays from "./currentYear";
import AllHolidays from "./all";
import CustomHolidays from "./custom";

function TopLevelHolidays() {
  const { translation } = useContext(LanguageContext);
  const [refresh, setRefresh] = useState(false);
  const categories = [
    { label: translation.all, value: "all" },
    { label: translation.current_year, value: "currentYear" },
    { label: translation.custom, value: "custom" },
  ];

  const [category, setCategory] = useState(categories[0].value);

  return (
    <>
      <Filters fetchData={() => setRefresh(true)} />
      <div>
        <RadioGroup
          onChange={(category) => setCategory(category)}
          value={category}
          inline
        >
          {categories.map((el: any, i) => (
            <Radio name={el.label} value={el.value} key={i} label={el.label} />
          ))}
        </RadioGroup>

        {category === "all" && <AllHolidays refresh={refresh} />}
        {category === "currentYear" && (
          <CurrentYearHolidays refresh={refresh} />
        )}
        {category === "custom" && <CustomHolidays refresh={refresh} />}
      </div>
    </>
  );
}

export default TopLevelHolidays;
