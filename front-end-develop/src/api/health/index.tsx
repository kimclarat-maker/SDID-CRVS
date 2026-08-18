import { cfg } from "@/constants/cfg";
import axios from "axios";

export const fetchAPIServiceInfo = async () => {
  try {
    let url = `${cfg.VITE_LOCAL_SERVICE_API}/health/service-info`;

    const options = {
      method: "GET",
      url,
    };

    const data = await axios(options);

    return data.data;
  } catch (error) {
    throw error;
  }
};
