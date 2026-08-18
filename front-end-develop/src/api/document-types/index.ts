import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/DocumentType";
import api from "..";

export const fetchDocumentTypes = async (params?: GETParameters) => {
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }
    const options = {
      method: "GET",
      url: `/configuration/document-types`,
      params,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchSingleDocumentType = async (documentTypeId: string) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/document-types/${documentTypeId}`,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};
