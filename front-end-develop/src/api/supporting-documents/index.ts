import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/SupportingDocument";
import api from "..";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchSupportingDocuments,
  demoFetchSingleSupportingDocuments,
} from "@/demo/services/referenceLookups";

export const fetchSupportingDocuments = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchSupportingDocuments();
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
  if (isDemoMode()) return demoFetchSingleSupportingDocuments(fieldName);
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
