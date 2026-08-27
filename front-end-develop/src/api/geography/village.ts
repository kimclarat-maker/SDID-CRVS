import toastMessage from "@/utils/common/toastMessage";
import { VillageGETParameters } from "@/types/geography";
import api from "..";
import { VillageTypes } from "@/types/geography";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchVillages,
  demoFetchVillagesByCell,
  demoFetchSingleVillages,
  demoUpdateVillages,
  demoDeleteVillages,
  demoCreateVillages,
} from "@/demo/services/geography";

export const fetchVillages = async (params?: VillageGETParameters) => {
  if (isDemoMode()) return demoFetchVillages(params);
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url: `/geo/villages`,
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

export const fetchVillagesByCell = async (
  cellId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  if (isDemoMode())
    return demoFetchVillagesByCell(cellId, status, offset, limit);
  try {
    const options = {
      method: "GET",
      url: `/geo/villages/bycell/${cellId}`,
      params: {
        status,
        offset: offset || 0,
        limit: limit || 10,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchSingleVillages = async (id: string) => {
  if (isDemoMode()) return demoFetchSingleVillages(id);
  try {
    const options = {
      method: "GET",
      url: `/geo/villages/${id}`,
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

export const updateVillages = async (params: VillageTypes) => {
  if (isDemoMode()) return demoUpdateVillages(params);
  try {
    const options = {
      method: "PATCH",
      url: `/geo/villages/${params._id}`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const deleteVillages = async (id: string) => {
  if (isDemoMode()) return demoDeleteVillages(id);
  try {
    const options = {
      method: "DELETE",
      url: `/geo/villages/${id}`,
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

export const createVillages = async (params: VillageTypes) => {
  if (isDemoMode()) return demoCreateVillages(params);
  try {
    const options = {
      method: "POST",
      url: `/geo/villages`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};
