import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, TransferType } from "@/types/Transfers";
import api from "..";
import transfers from "@/mocks/transfer";
import { isDemoMode } from "@/demo/config";
import { demoFetchTransfers } from "@/demo/services/appointments";

interface ApiResponse {
  data: TransferType[];
  total: number;
}

let copyData = transfers.slice(0);

export const fetchTransferredSchedules = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  if (isDemoMode()) return demoFetchTransfers(params as any) as any;

  try {
    // const options = {
    //   method: "GET",
    //   url: `/analytics/summary`,
    //   params
    // };

    // return await api(options);

    let data = transfers;

    if (params.search && params.search !== "") {
      data = copyData.filter(
        (el) =>
          el.prenrollmentNumber?.toUpperCase() === params.search?.toUpperCase()
      );
    } else {
      data = copyData;
    }

    return {
      data,
      total: 10,
    };
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchTransferredScheduleById = async (id: string) => {
  try {
    return transfers.find((el) => el._id === id);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};
