import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import CustomTabs from "@/components/tabs";
import Pending from "./pending";
import SearchCitizen from "../../search/citizen";

function PendingWithTab() {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <CustomTabs
        options={[
          {
            title: translation.search,
            data: <SearchCitizen from="PENDING" />,
          },
          {
            title: translation.pending,
            data: <Pending />,
          },
        ]}
      />
    </>
  );
}

export default PendingWithTab;
