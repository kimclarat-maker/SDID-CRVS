import { cfg } from "@/constants/cfg";

const { VITE_APP_NAME = "SDID-ENROLLMENT" } = cfg;

export const setStorage = async (
  data: any,
  storageName: string = VITE_APP_NAME,
  type?: string
): Promise<void> => {
  if (type === "local")
    await localStorage.setItem(storageName, JSON.stringify(data));
  await sessionStorage.setItem(storageName, JSON.stringify(data));
};

export const getStorage = async (
  storageName = VITE_APP_NAME,
  type?: string
): Promise<any> => {
  try {
    if (type === "local") {
      const storageValue = localStorage.getItem(storageName);
      return typeof storageValue === "string" && storageName === "loginType"
        ? localStorage.getItem(storageName)
        : JSON.parse(localStorage.getItem(storageName) || "");
    }

    const data = sessionStorage.getItem(storageName);

    if (!data) return;

    const user = await JSON.parse(sessionStorage.getItem(storageName) || "");
    return user;
  } catch (error) {
    return;
  }
};

export const clearStorage = async (type?: string): Promise<void> => {
  if (type === "local") await localStorage.clear();
  await sessionStorage.clear();
};

export const removeStorageItem = async (item: string, type?: string) => {
  if (type === "local") await localStorage.removeItem(item);
  await sessionStorage.removeItem(item);
};
