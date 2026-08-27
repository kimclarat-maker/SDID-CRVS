import { IrisTypes } from "@/types/IrisTypes";
import axios from "axios";
import { isDemoMode } from "@/demo/config";
import {
  demoOpenIrisDevice,
  demoCloseIrisDevice,
  demoStartIrisDevice,
  demoFetchLastAsBase64,
  demoAbortIrisDevice,
  demoManualCaptureIrisDevice,
} from "@/demo/services/deviceServices";

const IRIS_BASE = "https://localhost:9991/api/v1";

const QUALITY_CHECKER1_BASE = "https://localhost:11401";

const openIrisApi = `${IRIS_BASE}/iris/devices/open`;

const closeIrisApi = `${IRIS_BASE}/iris/devices/close`;

const startIrisApi = `${IRIS_BASE}/iris/devices/start`;

const lastBase64Api = `${IRIS_BASE}/iris/image/last/base64`;

const qualityCherkerApi = `${QUALITY_CHECKER1_BASE}/enroll?standard=Icao9303`;

const abortIrisApi = `${IRIS_BASE}/iris/devices/abort`;

const manualCaptureIrisApi = `${IRIS_BASE}/iris/devices/manual-capture`;

export const openIrisDevice = async () => {
  if (isDemoMode()) return demoOpenIrisDevice();
  try {
    const response = await axios(openIrisApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    console.log("Open iris device:", data);

    return data;
  } catch (error) {
    return error;
  }
};

export const closeIrisDevice = async () => {
  if (isDemoMode()) return demoCloseIrisDevice();
  try {
    const response = await axios(closeIrisApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    console.log("Close iris device:", data);

    return data;
  } catch (error) {
    return error;
  }
};

export const startIrisDevice = async (params: IrisTypes) => {
  if (isDemoMode()) return demoStartIrisDevice();
  try {
    delete params.whiteLED;
    const response = await axios(startIrisApi, {
      method: "POST",
      data: params,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchLastAsBase64 = async (position: string) => {
  if (isDemoMode()) return demoFetchLastAsBase64();
  try {
    const response = await axios(lastBase64Api + `?eye=${position}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    return data;
  } catch (error) {
    throw error;
  }
};

export const abortIrisDevice = async () => {
  if (isDemoMode()) return demoAbortIrisDevice();
  try {
    const response = await axios(abortIrisApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    console.log("Abort iris device:", data);

    return data;
  } catch (error) {
    return error;
  }
};

export const manualCaptureIrisDevice = async () => {
  if (isDemoMode()) return demoManualCaptureIrisDevice();
  try {
    const response = await axios(manualCaptureIrisApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    console.log("Abort iris device:", data);

    return data;
  } catch (error) {
    return error;
  }
};

export const qualityChecker = async (iris: any) => {
  try {
    const response = await axios(qualityCherkerApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.data;

    return data;
  } catch (error) {
    throw error;
  }
};
