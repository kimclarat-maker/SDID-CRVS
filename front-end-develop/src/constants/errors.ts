import { translations } from "@/internationalization";
import { extractErrorMessage } from "@/utils/common/error/handler";

export default (lng: string, actualError: any) => {
  return {
    "001": {
      message: translations[lng].login_failed,
      description: extractErrorMessage(actualError),
    },
    "002": {
      message: translations[lng].no_data_found,
      description: extractErrorMessage(actualError),
    },
  };
};

export const EXCLUDED_MESSAGES = [
  "UNAUTHORIZED",
  "SESSION",
  "UNKNOWN ERROR",
  "SESSION EXPIRED",
  "NETWORK ERROR",
  "ECONNREFUSED",
];
