import toastMessage from "@/utils/common/toastMessage";
import { SectorGETParameters } from "@/types/geography";
import api from "..";
import { SectorTypes } from "@/types/geography";
import sectors from "@/mocks/geo/sectors";

export const fetchSectors = async (params?: SectorGETParameters) => {
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
