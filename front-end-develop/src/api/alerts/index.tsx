import toastMessage from "@/utils/common/toastMessage";
import api from "..";
import alerts from "@/mocks/alerts";
import { AlertType } from "@/types/Alert";

interface ApiResponse {
  data: AlertType[];
  total: number;
}

export const fetchAlerts = async (): Promise<ApiResponse | undefined> => {
  try {
    return {
      data: alerts,
      total: 10,
    };
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};
