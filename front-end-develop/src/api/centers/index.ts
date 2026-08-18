import { GETParameters, CenterType } from "@/types/Center";
import api from "..";

interface ApiResponse {
  data: CenterType[];
  total: number;
}

export const fetchCenters = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/centers`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchCenterById = async (
  id: string
): Promise<CenterType | undefined> => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/centers/${id}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    throw error;
  }
};

export const updateCenter = async (
  id: string,
  payload: CenterType
): Promise<CenterType | undefined> => {
  try {
    const options = {
      method: "PATCH",
      url: `/configuration/centers/${id}`,
      data: payload,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteCenter = async (
  id: string
): Promise<CenterType | undefined> => {
  try {
    const options = {
      method: "DELETE",
      url: `/configuration/centers/${id}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    throw error;
  }
};

export const addCenter = async (
  payload: CenterType
): Promise<CenterType | undefined> => {
  try {
    const options = {
      method: "POST",
      url: `/configuration/centers`,
      data: payload,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    console.log(error.response);
    throw error;
  }
};
