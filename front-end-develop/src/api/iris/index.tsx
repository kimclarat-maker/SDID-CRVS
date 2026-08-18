import { IrisTypes } from "@/types/IrisTypes";
import axios from "axios";

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
