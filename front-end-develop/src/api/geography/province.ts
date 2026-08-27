import toastMessage from "@/utils/common/toastMessage";
import { ProvinceGETParameters } from "@/types/geography";
import api from "..";
import { ProvinceTypes } from "@/types/geography";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchProvinces,
  demoFetchSingleProvince,
  demoUpdateProvince,
  demoDeleteProvince,
  demoCreateProvince,
} from "@/demo/services/geography";

export const fetchProvinces = async (params?: ProvinceGETParameters) => {
  if (isDemoMode()) return demoFetchProvinces(params);
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url: `/geo/provinces`,
      params: {
        ...params,
        offset: params?.offset || 0,
        limit: params?.limit || 10,
      },
    };

    const { data } = await api(options);

    return {
      data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchSingleProvince = async (id: string) => {
  if (isDemoMode()) return demoFetchSingleProvince(id);
  try {
    const options = {
      method: "GET",
      url: `/geo/provinces/${id}`,
    };

    const { data } = await api(options);

    return {
      data,
    };
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const updateProvince = async (params: ProvinceTypes) => {
  if (isDemoMode()) return demoUpdateProvince(params);
  try {
    const options = {
      method: "PATCH",
      url: `/geo/provinces/${params._id}`,
      data: { ...params, _id: undefined },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteProvince = async (id: string) => {
  if (isDemoMode()) return demoDeleteProvince(id);
  try {
    const options = {
      method: "DELETE",
      url: `/geo/provinces/${id}`,
    };

    const { data } = await api(options);

    return {
      data,
    };
  } catch (error) {
    throw error;
  }
};

export const createProvince = async (params: ProvinceTypes) => {
  if (isDemoMode()) return demoCreateProvince(params);
  try {
    const options = {
      method: "POST",
      url: `/geo/provinces`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
