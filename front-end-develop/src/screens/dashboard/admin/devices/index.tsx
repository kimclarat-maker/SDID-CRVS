import Devices from "./data";
import PageHeader from "@/components/pageHeader";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

function AppDevices() {
  const { translation } = useContext(LanguageContext);
  return (
    <>
      <PageHeader title={translation.devices} />
      <Devices />
    </>
  );
}

export default AppDevices;
