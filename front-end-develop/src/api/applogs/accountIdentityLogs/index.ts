import toastMessage from "@/utils/common/toastMessage";
import { GETAccountIdentityLogsParameters } from "@/types/LogsType";
import api from "../..";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchAccountIdentityLogs,
  demoFetchSessionActivityLogs,
  demoFetchAccountActivityLogs,
  demoFetchAccountActivityLogsBySessionId,
} from "@/demo/services/logs";

// Note: none of these four ever called the real api() client — they've
// always returned this static empty payload directly (their "Account logs"/
// "Session logs" tabs are commented out in
// screens/dashboard/admin/applogs/index.tsx, so nothing renders their data
// either way). The isDemoMode() branch below is added for consistency with
// the rest of the demo layer rather than to fix a break — this module was
// already demo-safe.
export const fetchAccountIdentityLogs = async (
  params: GETAccountIdentityLogsParameters
) => {
  try {
    if (isDemoMode()) return demoFetchAccountIdentityLogs();
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
    if (isDemoMode()) return demoFetchSessionActivityLogs();
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
    if (isDemoMode()) return demoFetchAccountActivityLogs();
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
    if (isDemoMode()) return demoFetchAccountActivityLogsBySessionId();
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
