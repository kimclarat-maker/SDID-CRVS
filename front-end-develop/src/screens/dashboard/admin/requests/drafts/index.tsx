import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import SearchCitizen from "../../search/citizen";
import CustomTabs from "@/components/tabs";
import Drafts from "./list";

function ApprovedApplications() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("search");

  const tabs = [
    {
      key: "search",
      title: translation.search,
      data: <SearchCitizen />,
    },
    {
      key: "draft",
      title: translation.drafts,
      data: <Drafts tab={tab} />,
    },
  ];

  return <CustomTabs options={tabs} getTab={setTab} />;
}

export default ApprovedApplications;
