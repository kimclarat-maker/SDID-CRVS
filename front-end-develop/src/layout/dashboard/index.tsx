import { useState } from "react";
import { DashboardLayoutType } from "@/types/Dashboard/Layout";
import "./styles.css";
import Navbar from "@/components/navbar";
import { SidebarContext } from "@/context/SidebarContext";
import { FilterProvider } from "@/context/FilterContext";

function DashboardLayout({
  children,
  navbarContainerType,
  isLocalServiceActive,
  retryLocalService,
  localServiceHealthData,
  networkHealthData,
  isOnline,
}: DashboardLayoutType) {
  const [expanded, setSidebarExpand] = useState(true);
  return (
    <SidebarContext.Provider value={{ expanded, setSidebarExpand }}>
      <Navbar
        containerType={navbarContainerType}
        toggleSidebarIcon="menu"
        isLocalServiceActive={isLocalServiceActive}
        retryLocalService={retryLocalService}
        localServiceHealthData={localServiceHealthData}
        networkHealthData={networkHealthData}
        isOnline={isOnline}
      />
      <div style={{ position: "relative" }}>
        <FilterProvider>{children}</FilterProvider>
      </div>
    </SidebarContext.Provider>
  );
}

export default DashboardLayout;
