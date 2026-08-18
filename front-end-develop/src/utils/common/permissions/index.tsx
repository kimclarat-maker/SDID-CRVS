import { cfg } from "@/constants/cfg";
import toastMessage from "../toastMessage";

const STORAGE_NAME = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";

export const accessRoleName = () => {
  try {
    if (!sessionStorage.getItem(STORAGE_NAME)) return;
    const userLoggedIn = JSON.parse(sessionStorage.getItem(STORAGE_NAME) || "");
    if (
      userLoggedIn &&
      userLoggedIn.account &&
      userLoggedIn.account.accessRole &&
      userLoggedIn.account.accessRole.value
    ) {
      return userLoggedIn.account.accessRole.value;
    }
  } catch (error) {
    return;
  }
};

export const defineAccess = ({
  method,
  module,
}: {
  method: string;
  module: string;
}) => {
  try {
    let hasAccess = false;
    const userLoggedIn = sessionStorage.getItem(STORAGE_NAME)
      ? JSON.parse(sessionStorage.getItem(STORAGE_NAME) as string)
      : null;

    if (
      userLoggedIn?.account?.accessRole?.value?.toUpperCase() === "SUPERADMIN"
    ) {
      hasAccess = true;
    } else if (
      userLoggedIn &&
      userLoggedIn.account &&
      userLoggedIn.account.permissions &&
      Array.isArray(userLoggedIn.account.permissions)
    ) {
      const permissionName = `${method.toLowerCase()}_${module.toLowerCase()}`;

      if (userLoggedIn.account.permissions.includes(permissionName)) {
        hasAccess = true;
      }
    }

    return hasAccess;
  } catch (error: any) {
    toastMessage(error);
  }
};
