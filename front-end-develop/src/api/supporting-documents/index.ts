import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/SupportingDocument";
import api from "..";

export const fetchSupportingDocuments = async (params?: GETParameters) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/supporting-documents`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    throw error;
  }
};

export const fetchSingleSupportingDocuments = async (fieldName?: string) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/supporting-documents/${fieldName}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
