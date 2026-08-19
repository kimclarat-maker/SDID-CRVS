import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import SearchCitizen from "../../search/citizen";
import CustomTabs from "@/components/tabs";
import Approved from "./list";
import PageHeader from "@/components/pageHeader";

function ApprovedApplications() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("search");

  const tabs = [
    {
      key: "search",
      title: translation.search,
      data: <SearchCitizen type="approved" />,
    },
    {
      key: "approved",
      title: translation.approved,
      data: <Approved tab={tab} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={translation.approved}
        breadcrumb={[
          { label: translation.requests },
          { label: translation.approved },
        ]}
      />
      <CustomTabs options={tabs} getTab={setTab} />
    </>
  );
}

export default ApprovedApplications;
