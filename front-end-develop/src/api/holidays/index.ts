import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/DocumentType";
import api from "..";
import { getStorage } from "@/utils/storage";

export const fetchHolidays = async (params?: GETParameters) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/holidays`,
      params,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchHolidaysByYear = async (year?: number) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/holidays/${year}`,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchHolidaysAll = async () => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/holidays/all`,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const uploadHolidays = async (formData: FormData) => {
  try {
    const { token } = await getStorage();
    const options = {
      method: "GET",
      url: `/configuration/holidays/upload`,
      data: formData,
      headers: {
        token: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};
