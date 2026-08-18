import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import CustomTabs from "@/components/tabs";
import LogCode from "./logCode";
// import AccountIDLogs from "./accountNID";
import RequestIDLogs from "./request";
// import SessionLogs from "./sessionLogs";

function Logs() {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <CustomTabs
        options={[
          // {
          //   title: translation.transfer_logs,
          //   data: <AccountIDLogs />,
          // },
          {
            title: "Request Identifier logs",
            data: <RequestIDLogs />,
          },
          // {
          //   title: "Account logs",
          //   data: <SessionLogs />,
          // },
          {
            title: translation.error_logs,
            data: <LogCode />,
          },
        ]}
      />
    </>
  );
}

export default Logs;
