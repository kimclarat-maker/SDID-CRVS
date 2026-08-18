import toastMessage from "@/utils/common/toastMessage";
import { CellGETParameters, CellTypes } from "@/types/geography";
import api from "..";
import cells from "@/mocks/geo/cells";

export const fetchCells = async (params?: CellGETParameters) => {
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url: `/geo/cells`,
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

export const fetchCellsBySector = async (
  sectorId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  try {
    const options = {
      method: "GET",
      url: `/geo/cells/bysector/${sectorId}`,
      params: {
        status,
        offset: offset || 0,
        limit: limit || 10,
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

export const fetchSingleCell = async (id: string) => {
  try {
    const options = {
      method: "GET",
      url: `/geo/cells/${id}`,
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

export const updateCell = async (params: CellTypes) => {
  try {
    const options = {
      method: "PATCH",
      url: `/geo/cells/${params._id}`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const deleteCell = async (id: string) => {
  try {
    const options = {
      method: "DELETE",
      url: `/geo/cells/${id}`,
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

export const createCell = async (params: CellTypes) => {
  try {
    const options = {
      method: "POST",
      url: `/geo/cells`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};
