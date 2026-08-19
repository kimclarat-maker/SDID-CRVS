import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/Draft";
import api from "..";
import drafts from "@/mocks/drafts";
import { Draft } from "@/types/Draft";
import { isDemoMode } from "@/demo/config";
import {
  demoListApplications,
  demoGetApplicationById,
} from "@/demo/services/applications";

interface ApiResponse {
  data: Draft[];
  total: number;
}

export const fetchDrafts = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  if (isDemoMode()) return demoListApplications(params as any) as any;

  try {
    if (params.search === "" || params.search === undefined) {
      delete params.search;
    }

    if (params.startDate === "" || params.startDate === undefined) {
      delete params.startDate;
    }

    if (params.endDate === "" || params.endDate === undefined) {
      delete params.endDate;
    }

    const options = {
      method: "GET",
      url: `/enrollment`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchDraftById = async (id: string) => {
  if (isDemoMode()) {
    const result = await demoGetApplicationById(id);
    return result.data;
  }

  try {
    // const options = {
    //   method: "GET",
    //   url: `/analytics/summary`,
    //   params
    // };

    // return await api(options);

    return drafts.find((el) => el._id === id);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};
