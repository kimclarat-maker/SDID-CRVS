import toastMessage from "@/utils/common/toastMessage";
import { SectorGETParameters } from "@/types/geography";
import api from "..";
import { SectorTypes } from "@/types/geography";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchSectors,
  demoFetchSectorsByDistrict,
  demoFetchSingleSector,
  demoUpdateSector,
  demoDeleteSector,
  demoCreateSector,
} from "@/demo/services/geography";

export const fetchSectors = async (params?: SectorGETParameters) => {
  if (isDemoMode()) return demoFetchSectors(params);
  try {
    let url = "/geo/sectors";

    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    if (params?.districtId) {
      url = `/geo/sectors/bydistrict/${params.districtId}`;
    }
    const options = {
      method: "GET",
      url,
      params: {
        ...params,
        offset: params?.offset || 0,
        limit: params?.limit || 50000,
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

export const fetchSectorsByDistrict = async (
  districtId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  if (isDemoMode())
    return demoFetchSectorsByDistrict(districtId, status, offset, limit);
  try {
    const options = {
      method: "GET",
      url: `/geo/sectors/bydistrict/${districtId}`,
      params: {
        status,
        offset: offset || 0,
        limit: limit || 1000,
      },
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchSingleSector = async (id: string) => {
  if (isDemoMode()) return demoFetchSingleSector(id);
  try {
    const options = {
      method: "GET",
      url: `/geo/sectors/${id}`,
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

export const updateSector = async (params: SectorTypes) => {
  if (isDemoMode()) return demoUpdateSector(params);
  try {
    const options = {
      method: "PATCH",
      url: `/geo/sectors/${params._id}`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const deleteSector = async (id: string) => {
  if (isDemoMode()) return demoDeleteSector(id);
  try {
    const options = {
      method: "DELETE",
      url: `/geo/sectors/${id}`,
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

export const createSector = async (params: SectorTypes) => {
  if (isDemoMode()) return demoCreateSector(params);
  try {
    const options = {
      method: "POST",
      url: `/geo/sectors`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};
