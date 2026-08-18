import { LoginType } from "@/types/User";
import api from "..";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import { cfg } from "@/constants/cfg";

export const userLoginApi = async (
  userInfo: LoginType,
  isLocalServiceEnabled?: boolean
) => {
  try {
    const options: any = {
      method: "POST",
      url: `/auth/login`,
      data: userInfo,
      isLocalServiceEnabled,
    };

    if (!isLocalServiceEnabled) {
      options.isRemoteFetchForceEnabled = true;
      delete options.isLocalServiceEnabled;
    } else {
      delete options.isRemoteFetchForceEnabled;
    }
    const { data } = await api(options);
    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const userLoginVerifyCodeApi = async (params: { code: string }) => {
  try {
    const env = cfg.VITE_NODE_ENV as string;

    let url = `/auth/mfa/verify-email`;

    if (env === "backend") {
      url = `/auth/mfa-verify-email`;
    }
    const options = {
      method: "POST",
      url,
      data: params,
      isRemoteFetchForceEnabled: true,
    };

    console.log("addressoptions", options);

    const { data = {} } = await api(options);

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const userLogoutApi = async () => {
  try {
    const user = await getStorage();

    if (!user) {
      window.location.href = "/authentication/login";
      return;
    }

    const options = {
      method: "POST",
      url: `/auth/logout`,
      headers: {
        token: `bearer ${user.token}`,
        ["x-sdid-api-key"]: cfg.VITE_API_KEY,
        ["x-sdid-api-secret-key"]: cfg.VITE_API_SECRET_KEY,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const userSendOTPByEmail = async (
  email: string,
  tempToken: string,
  isLocalServiceEnabled?: boolean
) => {
  try {
    const env = cfg.VITE_NODE_ENV as string;

    let url = `/auth/mfa/send-otp-by-email`;

    if (env === "backend") {
      url = `/auth/send-email-otp`;
    }
    const options = {
      method: "POST",
      url,
      data: {
        email,
        tempToken,
      },
      isRemoteFetchForceEnabled: !isLocalServiceEnabled ? true : false,
    };

    const data = await api(options);

    if (!data) return {};

    return data;
  } catch (error: any) {
    throw error;
  }
};
