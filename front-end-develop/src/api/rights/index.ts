import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/AccessRight";
import api from "..";
import { isDemoMode } from "@/demo/config";
import { demoFetchAccessRights } from "@/demo/services/referenceLookups";

export const fetchAccessRights = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchAccessRights(params);
  try {
    let url = `/configuration/access-rights`;

    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    if (params && params.id) {
      url = `/configuration/access-rights/${params.id}`;
    }
    const options = {
      method: "GET",
      url,
      params: {
        offset: params?.offset || 0,
        limit: params?.offset || 10,
        ...params,
      },
    };

    const data = await api(options);

    return data.data;
  } catch (error) {
    toastMessage("error", error);
  }
};
