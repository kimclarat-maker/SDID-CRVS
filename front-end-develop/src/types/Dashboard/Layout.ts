import React from "react";

export type DashboardLayoutType = {
  children: React.ReactNode;
  navbarContainerType?: "container" | "container-fluid" | undefined;
  isLocalServiceActive?: boolean;
  retryLocalService: () => void;
  localServiceHealthData?: any;
  networkHealthData?: any;
  isOnline?: boolean;
};
