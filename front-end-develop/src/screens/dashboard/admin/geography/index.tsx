import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import CustomTabs from "@/components/tabs";
import Provinces from "./province";
import Districts from "./district";
import Sectors from "./sector";
import Cells from "./cell";
import Villages from "./village";
import Countries from "./country";
import { platformConfig } from "@/config/platform.config";
import PageHeader from "@/components/pageHeader";

// Underlying data/routes stay province/district/sector/cell/village (real
// backend contract); only the tab labels below come from the deployment's
// administrativeAreaHierarchy so the UI can read as country-neutral.
const [level1, level2, level3, level4, level5] =
  platformConfig.administrativeAreaHierarchy;

function Geography() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("countries");

  return (
    <div>
      <PageHeader title={translation.locations} />
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
            title: level1?.label || translation.provinces,
            key: "provinces",
            data: tab === "provinces" ? <Provinces /> : <></>,
          },
          {
            title: level2?.label || translation.districts,
            key: "districts",
            data: tab === "districts" ? <Districts /> : <></>,
          },
          {
            title: level3?.label || translation.sectors,
            key: "sectors",
            data: tab === "sectors" ? <Sectors /> : <></>,
          },
          {
            title: level4?.label || translation.cells,
            key: "cells",
            data: tab === "cells" ? <Cells /> : <></>,
          },
          {
            title: level5?.label || translation.villages,
            key: "villages",
            data: tab === "villages" ? <Villages /> : <></>,
          },
        ]}
      />
    </div>
  );
}

export default Geography;
