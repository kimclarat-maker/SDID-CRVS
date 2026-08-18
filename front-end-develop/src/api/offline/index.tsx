import api from "..";
import { getStorage } from "@/utils/storage";

export const fetchOfflineSync = async () => {
  try {
    const user = await getStorage();

    if (!user.id) return;
    const options = {
      method: "GET",
      url: `/configuration/accounts/offline-sync`,
      params: {
        accountId: user.id,
      },
    };

    const data = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
