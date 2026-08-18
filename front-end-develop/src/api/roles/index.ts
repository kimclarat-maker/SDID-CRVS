import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, GETMenusParameters } from "@/types/ROLE";
import api from "..";
import { defineAccess } from "@/utils/common/permissions";

export const fetchRoles = async (params?: GETParameters) => {
  try {
    //access
    const hasAccess = defineAccess({ method: "get", module: "roles" });

    if (!hasAccess) return;

    let url = `/configuration/roles`;

    if (params && params.id) {
      url = `/configuration/roles/${params.id}`;
    }

    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url,
      params: {
        offset: params?.offset || 0,
        limit: params?.limit,
        ...params,
      },
    };

    const data = await api(options);

    return data.data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchRoleMenus = async (params?: GETMenusParameters) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/menus`,
      params,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};
