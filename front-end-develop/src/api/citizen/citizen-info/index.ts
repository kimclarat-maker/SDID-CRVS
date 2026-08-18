import toastMessage from "@/utils/common/toastMessage";
import api from "../..";

export const fetchCitizenAllInfo = async (documentNumber: string) => {
  try {
    const options = {
      method: "GET",
      url: `/citizen-info/all-sources/document-number/${documentNumber.replace(
        /"/g,
        ""
      )}`,
      params: {
        offset: 0,
        limit: 100,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchCitizenInfo = async ({
  documentType,
  identifier,
}: {
  documentType: string;
  identifier: string;
}) => {
  try {
    const options = {
      method: "GET",
      url: `/citizen-info`,
      params: {
        documentType,
        identifier,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    throw error;
  }
};

//for the child

export const fetchCitizenChildInfo = async ({
  documentType,
  identifier,
}: {
  documentType: string;
  identifier: string;
}) => {
  try {
    const options = {
      method: "GET",
      url: `/citizen-info/family/children`,
      params: {
        documentType,
        identifier,
      },
    };

    const { data } = await api(options);

    return data.data;
  } catch (error) {
    toastMessage("error", error);
  }
};
