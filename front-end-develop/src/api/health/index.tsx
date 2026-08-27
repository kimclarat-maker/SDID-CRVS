import { cfg } from "@/constants/cfg";
import axios from "axios";
import { isDemoMode } from "@/demo/config";
import { demoFetchAPIServiceInfo } from "@/demo/services/deviceServices";

export const fetchAPIServiceInfo = async () => {
  if (isDemoMode()) return demoFetchAPIServiceInfo();
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
