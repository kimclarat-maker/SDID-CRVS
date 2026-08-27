import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/DocumentType";
import api from "..";
import { getStorage } from "@/utils/storage";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchHolidays,
  demoFetchHolidaysByYear,
  demoFetchHolidaysAll,
  demoUploadHolidays,
} from "@/demo/services/referenceLookups";

export const fetchHolidays = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchHolidays();
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
  if (isDemoMode()) return demoFetchHolidaysByYear(year);
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
  if (isDemoMode()) return demoFetchHolidaysAll();
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
  if (isDemoMode()) return demoUploadHolidays();
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
