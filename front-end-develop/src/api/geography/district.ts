import toastMessage from "@/utils/common/toastMessage";
import { DistrictTypes, ProvinceGETParameters } from "@/types/geography";
import api from "..";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchDistricts,
  demoFetchDistrictsByProvince,
  demoFetchSingleDistrict,
  demoUpdateDistrict,
  demoDeleteDistrict,
  demoCreateDistrict,
} from "@/demo/services/geography";

export const fetchDistricts = async (params?: ProvinceGETParameters) => {
  if (isDemoMode()) return demoFetchDistricts(params);
  try {
    let url = `/geo/districts`;

    if (params?.provinceId) {
      url = `/geo/districts/byprovince/${params.provinceId}`;
    }

    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url,
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

export const fetchDistrictsByProvince = async (
  provinceId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  if (isDemoMode())
    return demoFetchDistrictsByProvince(provinceId, status, offset, limit);
  try {
    const options = {
      method: "GET",
      url: `/geo/districts/byprovince/${provinceId}`,
      params: {
        status,
        offset: offset || 0,
        limit: limit || 10000,
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

export const fetchSingleDistrict = async (id: string) => {
  if (isDemoMode()) return demoFetchSingleDistrict(id);
  try {
    const options = {
      method: "GET",
      url: `/geo/districts/${id}`,
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

export const updateDistrict = async (params: DistrictTypes) => {
  if (isDemoMode()) return demoUpdateDistrict(params);
  try {
    const options = {
      method: "PATCH",
      url: `/geo/districts/${params._id}`,
      data: params,
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

export const deleteDistrict = async (id: string) => {
  if (isDemoMode()) return demoDeleteDistrict(id);
  try {
    const options = {
      method: "DELETE",
      url: `/geo/districts/${id}`,
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

export const createDistrict = async (params: DistrictTypes) => {
  if (isDemoMode()) return demoCreateDistrict(params);
  try {
    const options = {
      method: "POST",
      url: `/geo/districts`,
      data: params,
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
