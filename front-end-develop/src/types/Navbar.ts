export type NavbarType = {
  containerType?: string;
  toggleSidebarIcon?: string;
  isLocalServiceActive?: boolean;
  retryLocalService?: () => void;
  localServiceHealthData?: any;
  networkHealthData?: any;
  isOnline?: boolean;
};
