import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import CustomTabs from "@/components/tabs";
import ExceptionsPrenrollment from "../exceptions/prenrollment";
import ExceptionsPairValidator from "../exceptions/approver";
import SearchCitizen from "../../search/citizen";
import PageHeader from "@/components/pageHeader";

function Exceptions() {
  const { translation } = useContext(LanguageContext);
  const [tab, setTab] = useState("search");

  return (
    <>
      <PageHeader
        title={translation.exceptions}
        breadcrumb={[
          { label: translation.requests },
          { label: translation.exceptions },
        ]}
      />
      <CustomTabs
        getTab={setTab}
        options={[
          {
            title: translation.search,
            data: <SearchCitizen />,
            key: "search",
          },
          {
            title: translation.exceptions_prenrollment,
            data: <ExceptionsPrenrollment tab={tab} />,
            key: "prenrollment",
          },
          {
            title: translation.exceptions_pair_validator,
            data: <ExceptionsPairValidator tab={tab} />,
            key: "pair",
          },
        ]}
      />
    </>
  );
}

export default Exceptions;
