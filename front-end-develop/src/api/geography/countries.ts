import toastMessage from "@/utils/common/toastMessage";
import { CountryGETParameters } from "@/types/geography";
import api from "..";
import { CountryTypes } from "@/types/geography";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchCountries,
  demoFetchSingleCountry,
  demoUpdateCountry,
  demoDeleteCountry,
  demoCreateCountry,
} from "@/demo/services/geography";

export const fetchCountries = async (params?: CountryGETParameters) => {
  if (isDemoMode()) return demoFetchCountries(params);
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url: `/geo/countries`,
      params: {
        ...params,
        offset: params?.offset || 0,
        limit: params?.limit || 195,
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

export const fetchSingleCountry = async (id: string) => {
  if (isDemoMode()) return demoFetchSingleCountry(id);
  try {
    const options = {
      method: "GET",
      url: `/geo/countries/${id}`,
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

export const updateCountry = async (params: CountryTypes) => {
  if (isDemoMode()) return demoUpdateCountry(params);
  try {
    const options = {
      method: "PATCH",
      url: `/geo/countries/${params._id}`,
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

export const deleteCountry = async (id: string) => {
  if (isDemoMode()) return demoDeleteCountry(id);
  try {
    const options = {
      method: "DELETE",
      url: `/geo/countries/${id}`,
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

export const createCountry = async (params: CountryTypes) => {
  if (isDemoMode()) return demoCreateCountry(params);
  try {
    const options = {
      method: "POST",
      url: `/geo/countries`,
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
