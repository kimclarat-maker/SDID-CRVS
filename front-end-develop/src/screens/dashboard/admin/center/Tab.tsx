import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import CustomTabs from "@/components/tabs";
import Centers from ".";
import { defineAccess } from "@/utils/common/permissions";

function CenterTabs() {
  const { translation } = useContext(LanguageContext);

  let tabs = [];

  if (defineAccess({ method: "get", module: "centers" })) {
    tabs.push({
      title: translation.centers,
      data: <Centers />,
    });
  }

  return (
    <div>
      <CustomTabs options={tabs} />
    </div>
  );
}

export default CenterTabs;
