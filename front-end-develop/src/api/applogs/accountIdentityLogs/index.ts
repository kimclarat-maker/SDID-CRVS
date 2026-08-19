import toastMessage from "@/utils/common/toastMessage";
import { GETAccountIdentityLogsParameters } from "@/types/LogsType";
import api from "../..";

export const fetchAccountIdentityLogs = async (
  params: GETAccountIdentityLogsParameters
) => {
  try {
    return {
      data: {
        data: [],
        total: 0,
      },
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchSessionActivityLogs = async () => {
  try {
    return {
      data: {
        data: [],
        total: 0,
      },
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchAccountActivityLogs = async () => {
  try {
    return {
      data: {
        data: [],
        total: 0,
      },
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchAccountActivityLogsBySessionId = async () => {
  try {
    return {
      data: {
        data: [],
        total: 0,
      },
    };
  } catch (error) {
    toastMessage("error", error);
  }
};
