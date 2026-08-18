import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, ScheduleType } from "@/types/Schedule";
import api from "..";

interface ApiResponse {
  data: ScheduleType[];
  total: number;
}

export const fetchSchedules = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  try {
    if (params.search === "" || params.search === undefined) {
      delete params.search;
    }

    if (params.startDate === "" || params.startDate === undefined) {
      delete params.startDate;
    }

    if (params.appointmentNo === "" || params.appointmentNo === undefined) {
      delete params.appointmentNo;
    }

    if (params.requestNo === "" || params.requestNo === undefined) {
      delete params.requestNo;
    }

    const options = {
      method: "GET",
      url: `/schedules`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchScheduleByAppointmentNo = async (
  appointmentNo: string,
  center?: string
) => {
  try {
    const options = {
      method: "GET",
      url: `/schedules/appointment/${appointmentNo}`,
      params: {
        center,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchSchedulesCalendar = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  try {
    const options = {
      method: "GET",
      url: `/schedules/daily`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchScheduleById = async (id: string) => {
  try {
    const options = {
      method: "GET",
      url: `/schedules/${id}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const updateSchedules = async (
  id: string,
  params: { status: string }
) => {
  try {
    const options = {
      method: "PATCH",
      url: `/schedules/${id}`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
