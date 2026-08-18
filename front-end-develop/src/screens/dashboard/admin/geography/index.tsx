import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import CustomTabs from "@/components/tabs";
import Provinces from "./province";
import Districts from "./district";
import Sectors from "./sector";
import Cells from "./cell";
import Villages from "./village";
import Countries from "./country";

function Geography() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("countries");

  return (
    <div>
      <CustomTabs
        activeTab={tab}
        getTab={(t: string) => setTab(t)}
        options={[
          {
            title: translation.countries,
            key: "countries",
            data: tab === "countries" ? <Countries /> : <></>,
          },
          {
            title: translation.provinces,
            key: "provinces",
            data: tab === "provinces" ? <Provinces /> : <></>,
          },
          {
            title: translation.districts,
            key: "districts",
            data: tab === "districts" ? <Districts /> : <></>,
          },
          {
            title: translation.sectors,
            key: "sectors",
            data: tab === "sectors" ? <Sectors /> : <></>,
          },
          {
            title: translation.cells,
            key: "cells",
            data: tab === "cells" ? <Cells /> : <></>,
          },
          {
            title: translation.villages,
            key: "villages",
            data: tab === "villages" ? <Villages /> : <></>,
          },
        ]}
      />
    </div>
  );
}

export default Geography;
