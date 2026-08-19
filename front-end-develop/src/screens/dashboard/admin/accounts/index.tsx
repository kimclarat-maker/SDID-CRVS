import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Accounts from "./data";
import CustomTabs from "@/components/tabs";
import PageHeader from "@/components/pageHeader";

function AppAccounts() {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <PageHeader title={translation.accounts} />
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
