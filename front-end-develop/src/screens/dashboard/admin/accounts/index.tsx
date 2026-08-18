import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Accounts from "./data";
import CustomTabs from "@/components/tabs";

function AppAccounts() {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <CustomTabs
        options={[
          {
            title: translation.active_account,
            data: <Accounts status="active" />,
          },
          {
            title: translation.inactive_account,
            data: <Accounts status="inactive" />,
          },
        ]}
      />
    </>
  );
}

export default AppAccounts;
