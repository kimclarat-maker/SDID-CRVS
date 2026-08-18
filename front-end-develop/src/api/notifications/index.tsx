import toastMessage from "@/utils/common/toastMessage";
import api from "..";
import notifications from "@/mocks/notifications";
import { NotificationType } from "@/types/Notification";

interface ApiResponse {
  data: NotificationType[];
  total: number;
}

export const fetchNotifications = async (): Promise<
  ApiResponse | undefined
> => {
  try {
    let url = `/notifications`;

    const options = {
      method: "GET",
      url,
    };

    const data = await api(options);

    return data.data;
  } catch (error) {
    toastMessage("error", error);
  }
};
