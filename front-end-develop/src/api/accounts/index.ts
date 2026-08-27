import toastMessage from "@/utils/common/toastMessage";
import { AccountType, GETParameters } from "@/types/Account";
import api from "..";
import { cfg } from "@/constants/cfg";
import { fetchDeviceByID, fetchDevices } from "../device";
import { isDemoMode } from "@/demo/config";
import { demoFetchAccounts, demoFetchAccountByID } from "@/demo/services/administration";

export const fetchAccounts = async (
  params: GETParameters,
  isRemoteFetchForceEnabled?: boolean
) => {
  if (isDemoMode()) return demoFetchAccounts(params as any);

  try {
    const env = cfg.VITE_NODE_ENV;

    let url = `/accounts`;

    // if (env === "backend") {
    //   url = `/configuration/accounts`;
    // }

    const options = {
      method: "GET",
      url,
      params,
      isRemoteFetchForceEnabled,
    };

    const { data } = await api(options);
    return {
      data,
    };
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchAccountByID = async (
  id: string,
  isStartedOnline?: boolean
) => {
  if (isDemoMode()) return demoFetchAccountByID(id);
  try {
    const options = {
      method: "GET",
      url: `/accounts/${id}`,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return {
      data,
    };
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

type PasswordLinkType = { email?: string };

export const sendPasswordResetLink = async (params: PasswordLinkType = {}) => {
  try {
    if (Object.keys(params).length === 0)
      return toastMessage("error", "Required fields not provided: ");

    const options = {
      method: "POST",
      url: `/auth/send-password-reset-link`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

type PasswordResetType = { newPassword: string; token: string };

export const passwordReset = async (params: PasswordResetType) => {
  try {
    if (Object.keys(params).length === 0)
      return toastMessage("error", "Required fields not provided: ");

    const options = {
      method: "POST",
      url: `/auth/reset-password`,
      data: {
        newPassword: params.newPassword,
        token: params.token,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (token: string) => {
  try {
    if (Object.keys(token).length === 0)
      return toastMessage("error", "Required fields not provided: token ");

    const options = {
      method: "POST",
      url: `/auth/mfa/verify-email`,
      data: {
        token,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyPasswordResetLink = async (params: { token: string }) => {
  try {
    if (Object.keys(params).length === 0)
      return toastMessage("error", "Required fields not provided: ");

    const options = {
      method: "POST",
      url: `/auth/reset-password/verify-token`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const syncAccountData = async (loginResponse: AccountType) => {
  try {
    const devices = await fetchDevices({
      accountId: loginResponse?.account?._id,
    });
    const options = {
      method: "POST",
      url: `/auth/sync-account-data`,
      data: {
        loginResponse,
        devices: devices.data,
      },
      isLocalServiceEnabled: true,
    };

    console.log("options", options);

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
