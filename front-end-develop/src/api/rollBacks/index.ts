import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, RollBack } from "@/types/RollBack";
import api from "..";
import rollbacks from "@/mocks/rollbacks";

interface ApiResponse {
  data: RollBack[];
  total: number;
}

export const createRollBack = async (payload: {
  preEnrollmentId: string;
  rollbackReason: string;
  isRemoteFetchForceEnabled?: boolean;
}): Promise<ApiResponse | undefined> => {
  try {
    const options = {
      method: "POST",
      url: `/pre-enrollment/rollback`,
      data: payload,
      isRemoteFetchForceEnabled: payload.isRemoteFetchForceEnabled,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchRollBacks = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  try {
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/all`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchRollBackById = async (id: string) => {
  try {
    // const options = {
    //   method: "GET",
    //   url: `/analytics/summary`,
    //   params
    // };

    // return await api(options);

    return rollbacks.find((el) => el._id === id);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchRollBackByIdetntifier = async (identifier: string) => {
  try {
    return rollbacks.find((el) => el.identifier === identifier);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};
