import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/Device";
import api from "..";
import axios from "axios";
import { isDemoMode } from "@/demo/config";
import { demoFetchDevices } from "@/demo/services/administration";

interface Device {
  name: string;
  deviceType: string;
  item: string;
  model: string;
  notes: string;
  serialNumber: string;
  condition: string;
  status: string;
  centerId: string;
}

export const registerDevice = async (params: Device) => {
  try {
    const options = {
      method: "POST",
      url: `/devices/register`,
      data: params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchDevices = async (params: GETParameters) => {
  if (isDemoMode()) return demoFetchDevices(params as any);

  try {
    const options = {
      method: "GET",
      url: `/devices`,
      params,
    };

    const { data = {} } = await api(options);

    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const fetchDeviceByID = async (id: string) => {
  try {
    const options = {
      method: "GET",
      url: `/devices/${id}`,
    };

    const { data = {} } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const updateDevice = async (id: string) => {
  try {
    const options = {
      method: "PATCH",
      url: `/devices/${id}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteDevice = async (id: string) => {
  try {
    const options = {
      method: "PATCH",
      url: `/devices/${id}`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const auditLogsDevice = async (id: string) => {
  try {
    const options = {
      method: "GET",
      url: `/devices/audit-logs`,
      params: { deviceId: id },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const assignDevice = async (
  id: string,
  accountId: string,
  notes: string
) => {
  try {
    const options = {
      method: "PATCH",
      url: `/devices/${id}/assign`,
      data: {
        accountId,
        notes,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const unassignDevice = async (id: string, reason: string) => {
  try {
    const options = {
      method: "PATCH",
      url: `/devices/${id}/unassign`,
      data: {
        reason,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const assignmentDeviceHistorical = async (id: string) => {
  try {
    const options = {
      method: "GET",
      url: `/devices/${id}/assignment-history`,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const deviceReport = async (params: any) => {
  try {
    const options = {
      method: "GET",
      url: `/devices/reports/status`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const getConnectedIris = async () => {
  try {
    const options = {
      method: "GET",
      url: `https://localhost:9991/api/v1/iris/devices`,
    };

    const { data } = await axios(options);

    return data?.data || data;
  } catch (error) {
    throw error;
  }
};

export const getConnectedFingerprint = async () => {
  try {
    const options = {
      method: "GET",
      url: `https://localhost:12212/api/v1/kits/fingerprint`,
    };

    const { data } = await api(options);

    return data?.data || data;
  } catch (error) {
    throw error;
  }
};

export const getConnectedWebcams = async () => {
  try {
    const options = {
      method: "GET",
      url: `https://localhost:12212/api/v1/kits/webcams`,
    };

    const { data } = await api(options);

    return data?.data || data;
  } catch (error) {
    throw error;
  }
};

export const getConnectedSignatures = async () => {
  try {
    const options = {
      method: "GET",
      url: `https://localhost:12212/api/v1/kits/signature-pads`,
    };

    const { data } = await api(options);

    return data?.data || data;
  } catch (error) {
    throw error;
  }
};
