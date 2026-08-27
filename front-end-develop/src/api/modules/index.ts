import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/Modules";
import api from "..";
import { isDemoMode } from "@/demo/config";
import { demoFetchModules } from "@/demo/services/referenceLookups";

export const fetchModules = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchModules(params);
  try {
    let url = `/configuration/access-rights/modules`;

    if (params && params.id) {
      url = `/configuration/access-rights/modules/${params.id}`;
    }

    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url,
      params,
    };

    const data = await api(options);

    return data.data;
  } catch (error) {
    toastMessage("error", error);
  }
};
